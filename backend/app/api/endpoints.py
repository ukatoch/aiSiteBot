from fastapi import Request, APIRouter, UploadFile, File, HTTPException, Body, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.ingestion import ingestion_service
from app.services.vector_store import vector_store
from langchain.chains import RetrievalQA
from langchain_ollama import ChatOllama
from app.core.config import settings
from app.services.validate import validate_bot  
from app.core.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from app import models, schemas
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.security import SECRET_KEY, ALGORITHM
import uuid

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


router = APIRouter()

@router.post("/ingest/url")
async def ingest_url(request: schemas.UrlRequest, db: Session = Depends(get_db)):
    try:
        # 1. Update Metrics first to ensure domain exists/is valid
        domain = db.query(models.Domain).filter(
            models.Domain.bot_id == request.botId,
            models.Domain.hostname == request.hostname
        ).first()
        
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")

        docs = await ingestion_service.ingest_url(str(request.url), request.botId)
        vector_store.add_documents(docs)
        
        metric = db.query(models.Metric).filter(models.Metric.domain_id == domain.id).first()
        if metric:
            metric.sources_count += 1
        else:
            metric = models.Metric(domain_id=domain.id, sources_count=1)
            db.add(metric)
        db.commit()

        return {"message": f"Successfully ingested {len(docs)} chunks from {request.url}"}
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.post("/ingest/file")
async def ingest_file(
    file: UploadFile = File(...), 
    botId: str = Body(...), 
    hostname: str = Body(...),
    db: Session = Depends(get_db)
):
    try:
        domain = db.query(models.Domain).filter(
            models.Domain.bot_id == botId,
            models.Domain.hostname == hostname
        ).first()
        
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")

        content = await file.read()
        filename = file.filename
        
        if filename.endswith(".pdf"):
            docs = await ingestion_service.ingest_pdf(content, filename, botId)
        elif filename.endswith(".txt"):
            docs = await ingestion_service.ingest_text(content.decode("utf-8"), botId, filename)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        vector_store.add_documents(docs)

        metric = db.query(models.Metric).filter(models.Metric.domain_id == domain.id).first()
        if metric:
            metric.sources_count += 1
        else:
            metric = models.Metric(domain_id=domain.id, sources_count=1)
            db.add(metric)
        db.commit()

        return {"message": f"Successfully ingested {len(docs)} chunks from {filename}"}
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.post("/chat", response_model=schemas.ChatResponse)
async def chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    try:
        # 1. Validate Bot & Get Domain
        domain = db.query(models.Domain).filter(
            models.Domain.bot_id == request.botId,
            models.Domain.hostname == request.hostname
        ).first()

        # Handle local dev aliasing (127.0.0.1 <-> localhost)
        if not domain and request.hostname in ['127.0.0.1', 'localhost']:
            alt_hostname = 'localhost' if request.hostname == '127.0.0.1' else '127.0.0.1'
            domain = db.query(models.Domain).filter(
                models.Domain.bot_id == request.botId,
                models.Domain.hostname == alt_hostname
            ).first()
        
        if not domain:
            raise HTTPException(status_code=403, detail=f"Bot '{request.botId}' not authorized for domain '{request.hostname}'")

        # 1.5 Check for resources
        metric = db.query(models.Metric).filter(models.Metric.domain_id == domain.id).first()
        if not metric or metric.sources_count == 0:
            return schemas.ChatResponse(
                answer="Please contact admin",
                sources=[],
                sessionId=request.sessionId or ""
            )

        # 2. Get or Create Session & Handle Deduplication
        session_id = request.sessionId
        user_email = request.userEmail
        session = None

        if user_email:
            # Check for existing session with this email for this domain
            existing_session = db.query(models.ChatSession).filter(
                models.ChatSession.user_email == user_email,
                models.ChatSession.domain_id == domain.id
            ).first()

            if existing_session:
                # We found an existing user session
                if session_id and session_id != existing_session.id:
                    # User started anonymously but now identified as someone we know
                    # Move messages from temp session to existing session
                    temp_messages = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).all()
                    for msg in temp_messages:
                        msg.session_id = existing_session.id
                    
                    # Delete the temp session
                    temp_session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
                    if temp_session:
                        db.delete(temp_session)
                
                session = existing_session
                session_id = existing_session.id
            
        if not session:
            # No existing email session or no email provided yet
            if not session_id:
                session_id = str(uuid.uuid4())
                session = models.ChatSession(id=session_id, domain_id=domain.id)
                db.add(session)
            else:
                session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
                if not session:
                    session = models.ChatSession(id=session_id, domain_id=domain.id)
                    db.add(session)
            
            # Identify the session if email provided now
            if user_email:
                session.user_email = user_email
        
        # 4. Store User Message
        user_msg = models.ChatMessage(session_id=session_id, role="user", content=request.question)
        db.add(user_msg)
        
        # 5. Generate Answer
        llm = ChatOllama(model="llama3.2", temperature=0) 
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vector_store.get_retriever(bot_id=request.botId),
            return_source_documents=True
        )
        
        result = qa_chain.invoke({"query": request.question})
        answer = result["result"]
        source_docs = result["source_documents"]
        sources = list(set([doc.metadata.get("source", "unknown") for doc in source_docs]))
        
        # 6. Store Assistant Message
        assistant_msg = models.ChatMessage(session_id=session_id, role="assistant", content=answer)
        db.add(assistant_msg)
        
        # 7. Update Metrics
        metric = db.query(models.Metric).filter(models.Metric.domain_id == domain.id).first()
        if metric:
            metric.chats_count += 1
        
        db.commit()
        
        return schemas.ChatResponse(answer=answer, sources=sources, sessionId=session_id)
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
@router.get("/dashboard/{domain_id}/documents")
async def list_domain_documents(
    domain_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    try:
        domain = db.query(models.Domain).filter(models.Domain.id == domain_id).first()
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
            
        if not current_user.is_superuser and domain.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        documents = vector_store.list_documents(bot_id=domain.bot_id)
        return {"documents": documents}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

@router.delete("/dashboard/{domain_id}/documents")
async def delete_domain_document(
    domain_id: int,
    source: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        domain = db.query(models.Domain).filter(models.Domain.id == domain_id).first()
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
            
        if not current_user.is_superuser and domain.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        vector_store.delete_document(source=source, bot_id=domain.bot_id)
        
        # Update metrics
        metric = db.query(models.Metric).filter(models.Metric.domain_id == domain.id).first()
        if metric and metric.sources_count > 0:
            metric.sources_count -= 1
            db.commit()
            
        return {"message": "Document deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")
    
   

@router.post("/validateBot")
async def validate_bot_endpoint(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint to validate bot ID and hostname.
    """
    try:
        body = await request.json()
        bot_id = body.get("botId")
        hostname = body.get("hostname")

        validate_bot(bot_id, hostname, db)
        return {"status": "success", "message": "Bot is valid"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.get("/dashboard", response_model=List[schemas.Domain])
async def get_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get all domains and their metrics. 
    Main Admin (SuperUser) sees everything.
    Customer Admin sees only their own domain.
    """
    if current_user.is_superuser:
        domains = db.query(models.Domain).all()
    else:
        domains = db.query(models.Domain).filter(models.Domain.owner_id == current_user.id).all()
    return domains
@router.get("/dashboard/{domain_id}/metrics", response_model=schemas.Metric)
async def get_domain_metrics(domain_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get metrics for a specific domain. Only owner or superuser can access.
    """
    query = db.query(models.Domain).filter(models.Domain.id == domain_id)
    if not current_user.is_superuser:
        query = query.filter(models.Domain.owner_id == current_user.id)
    
    domain = query.first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found or unauthorized")
    
    metric = db.query(models.Metric).filter(models.Metric.domain_id == domain_id).first()
    if not metric:
        metric = models.Metric(domain_id=domain_id, chats_count=0, sources_count=0)
        db.add(metric)
        db.commit()
        db.refresh(metric)
    
    return metric
@router.get("/dashboard/leads", response_model=List[schemas.ChatSession])
async def get_dashboard_leads(
    domain_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Get chat sessions with emails.
    """
    query = db.query(models.ChatSession).filter(models.ChatSession.user_email != None)
    
    if domain_id:
        # Security check: Ensure domain belongs to user or user is superuser
        if not current_user.is_superuser:
            domain = db.query(models.Domain).filter(
                models.Domain.id == domain_id, 
                models.Domain.owner_id == current_user.id
            ).first()
            if not domain:
                raise HTTPException(status_code=403, detail="Not authorized to view leads for this domain")
        query = query.filter(models.ChatSession.domain_id == domain_id)
    elif not current_user.is_superuser:
        domain_ids = [d.id for d in current_user.domains]
        query = query.filter(models.ChatSession.domain_id.in_(domain_ids))
        
    sessions = query.order_by(models.ChatSession.created_at.desc()).all()
    return sessions

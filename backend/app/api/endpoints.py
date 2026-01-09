from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
from app.services.ingestion import ingestion_service
from app.services.vector_store import vector_store
from langchain.chains import RetrievalQA
from langchain_ollama import ChatOllama
from app.core.config import settings

router = APIRouter()

class UrlRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

@router.post("/ingest/url")
async def ingest_url(request: UrlRequest):
    try:
        docs = await ingestion_service.ingest_url(request.url)
        vector_store.add_documents(docs)
        return {"message": f"Successfully ingested {len(docs)} chunks from {request.url}"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        filename = file.filename
        
        if filename.endswith(".pdf"):
            docs = await ingestion_service.ingest_pdf(content, filename)
        elif filename.endswith(".txt"):
            docs = await ingestion_service.ingest_text(content.decode("utf-8"), filename)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        vector_store.add_documents(docs)
        return {"message": f"Successfully ingested {len(docs)} chunks from {filename}"}
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # User needs to pull 'llama3.2'
        llm = ChatOllama(model="llama3.2", temperature=0) 
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vector_store.get_retriever(),
            return_source_documents=True
        )
        
        result = qa_chain.invoke({"query": request.query})
        answer = result["result"]
        source_docs = result["source_documents"]
        sources = list(set([doc.metadata.get("source", "unknown") for doc in source_docs]))
        
        return ChatResponse(answer=answer, sources=sources)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
@router.get("/documents")
async def list_documents():
    try:
        documents = vector_store.list_documents()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

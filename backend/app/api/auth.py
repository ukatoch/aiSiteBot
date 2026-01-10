from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, verify_password, get_password_hash
from app import models, schemas
from datetime import timedelta
import uuid

router = APIRouter()

@router.post("/login")
async def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.email)
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": user.username,
        "is_superuser": user.is_superuser
    }

@router.post("/register", response_model=schemas.RegistrationResponse)
async def register(user_in: schemas.UserCreateWithDomain, db: Session = Depends(get_db)):
    # Check if user exists
    # Check if user email exists
    user_by_email = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user_by_email:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Check if username exists
    user_by_name = db.query(models.User).filter(models.User.username == user_in.username).first()
    if user_by_name:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if domain exists
    domain = db.query(models.Domain).filter(models.Domain.hostname == user_in.hostname).first()
    if domain:
        raise HTTPException(status_code=400, detail="Domain already registered")

    try:
        # Create user
        hashed_password = get_password_hash(user_in.password)
        new_user = models.User(
            email=user_in.email, 
            username=user_in.username,
            hashed_password=hashed_password
        )
        db.add(new_user)
        db.flush() # Get user id

        # Generate unique bot_id
        bot_id = f"bot-{uuid.uuid4().hex[:8]}"
        
        # Create domain
        new_domain = models.Domain(
            hostname=user_in.hostname,
            bot_id=bot_id,
            owner_id=new_user.id
        )
        db.add(new_domain)
        db.flush() # Get domain id

        # Create initial metrics
        new_metric = models.Metric(domain_id=new_domain.id)
        db.add(new_metric)
        
        db.commit()

        return schemas.RegistrationResponse(
            email=new_user.email,
            hostname=new_domain.hostname,
            bot_id=bot_id,
            message="Registration successful! Use this Bot ID to embed the chat in your site."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

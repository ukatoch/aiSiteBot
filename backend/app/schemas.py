from datetime import datetime
import uuid
from typing import List, Optional
from pydantic import BaseModel, EmailStr, HttpUrl

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    is_superuser: bool
class TokenData(BaseModel):
    email: Optional[str] = None

class UrlRequest(BaseModel):
    url: HttpUrl
    botId: str
    hostname: str

class DomainBase(BaseModel):
    hostname: str
    bot_id: str

class DomainCreate(DomainBase):
    pass

class Domain(DomainBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MetricBase(BaseModel):
    chats_count: int
    sources_count: int

class Metric(MetricBase):
    id: int
    domain_id: int
    last_updated: datetime

    class Config:
        from_attributes = True

class UserCreateWithDomain(BaseModel):
    email: EmailStr
    username: str
    password: str
    hostname: str

class RegistrationResponse(BaseModel):
    email: str
    hostname: str
    bot_id: str
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    sessionId: str

class ChatMessageBase(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None

class ChatMessage(ChatMessageBase):
    id: int
    session_id: str

    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    user_email: Optional[EmailStr] = None
    domain_id: int

class ChatSession(ChatSessionBase):
    id: str
    created_at: datetime
    messages: List[ChatMessage] = []

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    question: str
    botId: str
    hostname: str
    sessionId: Optional[str] = None
    userEmail: Optional[EmailStr] = None

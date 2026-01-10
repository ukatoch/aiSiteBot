from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    domains = relationship("Domain", back_populates="owner")

class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, unique=True, index=True, nullable=False) # e.g., example.com
    bot_id = Column(String, unique=True, index=True, nullable=False) # e.g., bot-123
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="domains")
    metrics = relationship("Metric", back_populates="domain")
    chat_sessions = relationship("ChatSession", back_populates="domain")

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    chats_count = Column(Integer, default=0)
    sources_count = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    domain = relationship("Domain", back_populates="metrics")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True) # UUID
    user_email = Column(String, index=True, nullable=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    domain = relationship("Domain", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", lazy="joined", order_by="ChatMessage.id")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    role = Column(String) # user or assistant
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

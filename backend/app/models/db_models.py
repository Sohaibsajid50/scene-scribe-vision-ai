import uuid
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import enum

from app.db.session import Base

# Enum for Job Status
class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    ACTIVE = "ACTIVE"
    ERROR = "ERROR"

# Enum for Job Type
class JobType(str, enum.Enum):
    VIDEO = "VIDEO"
    YOUTUBE = "YOUTUBE"
    TEXT = "TEXT"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for Google Sign-In users
    google_id = Column(String, unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    jobs = relationship("Job", back_populates="owner")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    prompt = Column(String, nullable=False)
    
    status = Column(SQLAlchemyEnum(JobStatus), nullable=False, default=JobStatus.PENDING)
    job_type = Column(SQLAlchemyEnum(JobType), nullable=False)
    current_agent = Column(String, nullable=False, default="Planner Agent")
    
    gemini_file_id = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    display_video_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    error_message = Column(String, nullable=True)

    owner = relationship("User", back_populates="jobs")
    messages = relationship("ChatMessage", back_populates="job", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    
    sender = Column(String, nullable=False) # "USER" or "AI"
    content = Column(String, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="messages")


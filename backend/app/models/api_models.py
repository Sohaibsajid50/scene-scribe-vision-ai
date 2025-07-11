from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uuid
from datetime import datetime
import enum

# ============================================
#                 Enum Models
# ============================================

class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    ACTIVE = "ACTIVE"
    ERROR = "ERROR"

class JobType(str, enum.Enum):
    VIDEO = "VIDEO"
    YOUTUBE = "YOUTUBE"
    TEXT = "TEXT"

# ============================================
#                 Token Models
# ============================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None


# ============================================
#                  User Models
# ============================================

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserCreateGoogle(UserBase):
    google_id: str

class UserLogin(UserCreate):
    pass

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# ============================================
#                  Chat Models
# ============================================

class Message(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    sender: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    file_name: Optional[str] = None # For YouTube URLs or referencing a file

class ChatResponse(BaseModel):
    response: str
    conversation_id: uuid.UUID

class GoogleIdTokenRequest(BaseModel):
    id_token_str: str

# ============================================
#                  Job Models
# ============================================

class Job(BaseModel):
    id: uuid.UUID
    user_id: int
    title: str
    prompt: str
    status: JobStatus
    job_type: JobType
    current_agent: str
    gemini_file_id: Optional[str] = None
    source_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
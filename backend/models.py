from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# --- AUTH MODELS ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[Dict[str, Any]] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None

class LoginSchema(BaseModel):
    email: Optional[str] = Field(None)
    phone: Optional[str] = Field(None)
    otp: Optional[str] = Field(None)
    password: Optional[str] = Field(None)

class UserCreate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    full_name: Optional[str] = None
    role: str # "worker" or "employer"
    password: Optional[str] = None

# --- PROFILE MODELS ---
class WorkerProfile(BaseModel):
    user_id: str
    full_name: str
    skills: List[str] = []
    experience_years: float = 0
    bio: Optional[str] = None
    location: Optional[str] = None
    hourly_rate: float = 0
    is_online: bool = True
    profile_photo: Optional[str] = None
    video_intro: Optional[str] = None
    rating: float = 5.0
    verified: bool = False

class EmployerProfile(BaseModel):
    user_id: str
    company_name: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    verification_status: str = "pending"

# --- JOB MODELS ---
class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employer_id: str = "unknown"
    title: str = "Untitled Job"
    description: str = ""
    category: str = "other"
    location: str = "Remote"
    salary_paise: int = 0
    salary_type: str = "daily"
    status: str = "open" # "open", "matched", "completed", "cancelled"
    posted_at: datetime = Field(default_factory=datetime.utcnow)
    requirements: List[str] = []
    is_boosted: bool = False
    is_urgent: bool = False
    team_size: int = 1
    hire_type: str = "individual" # "individual", "squad", "bulk"
    start_date: Optional[datetime] = None
    estimated_duration: str = ""
    escrow_amount_paise: int = 0
    escrow_status: str = "none" # "none", "locked", "released", "disputed"

class JobCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    salary_paise: int
    salary_type: str = "daily"
    requirements: List[str] = []
    is_urgent: bool = False
    team_size: int = 1
    hire_type: str = "individual"
    start_date: Optional[datetime] = None
    estimated_duration: str = ""

# --- APPLICATION MODELS ---
class Application(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    worker_id: str
    status: str = "applied" # "applied", "shortlisted", "selected", "rejected"
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    match_score: float = 0.0
    quick_apply: bool = False
    ai_insights: Optional[str] = None
    counter_offer_paise: Optional[int] = None
    offer_status: str = "pending" # "pending", "offered", "countered", "accepted", "rejected"
    contract_preview_url: Optional[str] = None
    handshake_code: Optional[str] = None
    checkin_time: Optional[datetime] = None
    checkout_time: Optional[datetime] = None
    progress_updates: List[Dict[str, Any]] = []

class ApplicationUpdate(BaseModel):
    status: str

# --- CHAT MODELS ---
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = False

# --- OTHER MODELS ---
class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

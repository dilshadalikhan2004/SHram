from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import asyncio
from math import radians, sin, cos, sqrt, atan2

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Create the main app
app = FastAPI(title="ShramSetu API", version="1.0.0")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Base Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = Field(..., pattern="^(worker|employer)$")

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    created_at: str
    profile_complete: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Worker Profile Models
class WorkerSkill(BaseModel):
    name: str
    years_experience: int = 0
    proficiency: str = "intermediate"  # beginner, intermediate, expert

class WorkerProfileCreate(BaseModel):
    skills: List[WorkerSkill]
    experience_years: int = 0
    daily_rate: float = 0
    hourly_rate: float = 0
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bio: Optional[str] = None
    availability: str = "available"  # available, busy, unavailable
    languages: List[str] = ["Hindi"]
    profile_photo: Optional[str] = None

class WorkerProfileResponse(WorkerProfileCreate):
    id: str
    user_id: str
    rating: float = 0.0
    total_jobs_completed: int = 0
    created_at: str
    updated_at: str

# Employer Profile Models
class EmployerProfileCreate(BaseModel):
    company_name: str
    business_type: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    company_logo: Optional[str] = None
    verified: bool = False

class EmployerProfileResponse(EmployerProfileCreate):
    id: str
    user_id: str
    rating: float = 0.0
    total_jobs_posted: int = 0
    created_at: str
    updated_at: str

# Job Models
class JobCreate(BaseModel):
    title: str
    description: str
    category: str
    skills_required: List[str]
    experience_required: int = 0
    pay_type: str = "daily"  # daily, hourly, fixed
    pay_amount: float
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    duration: Optional[str] = None
    start_date: Optional[str] = None
    vacancies: int = 1

class JobResponse(JobCreate):
    id: str
    employer_id: str
    employer_name: str
    company_name: str
    status: str = "open"  # open, closed, filled
    applications_count: int = 0
    created_at: str
    updated_at: str

# Application Models
class ApplicationCreate(BaseModel):
    job_id: str
    cover_message: Optional[str] = None
    expected_pay: Optional[float] = None

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    worker_id: str
    worker_name: str
    worker_profile: Optional[Dict] = None
    status: str = "applied"  # applied, shortlisted, selected, rejected
    cover_message: Optional[str] = None
    expected_pay: Optional[float] = None
    match_score: Optional[float] = None
    match_explanation: Optional[str] = None
    created_at: str
    updated_at: str

# Message Models
class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    content: str
    read: bool = False
    created_at: str

class ConversationResponse(BaseModel):
    user_id: str
    user_name: str
    user_role: str
    last_message: str
    last_message_time: str
    unread_count: int = 0

# Rating Models
class RatingCreate(BaseModel):
    rated_user_id: str
    job_id: str
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None

class RatingResponse(RatingCreate):
    id: str
    rater_id: str
    rater_name: str
    created_at: str

# Notification Models
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    data: Optional[Dict] = None
    read: bool = False
    created_at: str

# Match Score Models
class MatchScoreResponse(BaseModel):
    score: float
    explanation: str
    factors: Dict[str, Any]

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km using Haversine formula"""
    if not all([lat1, lon1, lat2, lon2]):
        return 999  # Return large distance if coordinates missing
    
    R = 6371  # Earth's radius in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

async def create_notification(user_id: str, type: str, title: str, message: str, data: dict = None):
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type,
        "title": title,
        "message": message,
        "data": data or {},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    return notification

# ==================== AI MATCHING SYSTEM ====================

async def calculate_match_score(worker_profile: dict, job: dict) -> MatchScoreResponse:
    """Calculate AI-powered match score between worker and job"""
    
    # Extract data
    worker_skills = [s.get("name", "").lower() for s in worker_profile.get("skills", [])]
    required_skills = [s.lower() for s in job.get("skills_required", [])]
    worker_experience = worker_profile.get("experience_years", 0)
    required_experience = job.get("experience_required", 0)
    
    # Calculate skill match
    matching_skills = set(worker_skills) & set(required_skills)
    skill_match = len(matching_skills) / max(len(required_skills), 1) * 100
    
    # Calculate experience match
    if required_experience == 0:
        experience_match = 100
    elif worker_experience >= required_experience:
        experience_match = 100
    else:
        experience_match = (worker_experience / required_experience) * 100
    
    # Calculate distance
    distance = calculate_distance(
        worker_profile.get("latitude"), worker_profile.get("longitude"),
        job.get("latitude"), job.get("longitude")
    )
    
    # Distance scoring (closer is better)
    if distance < 5:
        distance_score = 100
    elif distance < 10:
        distance_score = 80
    elif distance < 25:
        distance_score = 60
    elif distance < 50:
        distance_score = 40
    else:
        distance_score = 20
    
    # Calculate overall score (weighted)
    overall_score = (skill_match * 0.5) + (experience_match * 0.3) + (distance_score * 0.2)
    
    # Generate explanation using AI
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"match_{uuid.uuid4()}",
            system_message="You are a job matching assistant. Provide brief, helpful explanations for match scores."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Analyze this job match and provide a brief 1-2 sentence explanation:

Worker Skills: {', '.join(worker_skills)}
Required Skills: {', '.join(required_skills)}
Matching Skills: {', '.join(matching_skills)}
Worker Experience: {worker_experience} years
Required Experience: {required_experience} years
Distance: {distance:.1f} km
Overall Match Score: {overall_score:.0f}%

Provide a friendly, concise explanation of why this is a good or poor match."""

        user_message = UserMessage(text=prompt)
        explanation = await chat.send_message(user_message)
    except Exception as e:
        logger.error(f"AI explanation failed: {e}")
        # Fallback explanation
        if overall_score >= 80:
            explanation = f"Excellent match! {len(matching_skills)} of {len(required_skills)} required skills match and you're only {distance:.1f}km away."
        elif overall_score >= 60:
            explanation = f"Good match with {len(matching_skills)} matching skills. Consider this opportunity!"
        elif overall_score >= 40:
            explanation = f"Partial match. Some skills align but you may need additional experience."
        else:
            explanation = f"Limited match. Focus on jobs that better align with your skills."
    
    return MatchScoreResponse(
        score=round(overall_score, 1),
        explanation=explanation,
        factors={
            "skill_match": round(skill_match, 1),
            "experience_match": round(experience_match, 1),
            "distance_score": round(distance_score, 1),
            "distance_km": round(distance, 1),
            "matching_skills": list(matching_skills)
        }
    )

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "phone": user_data.phone,
        "role": user_data.role,
        "password_hash": hash_password(user_data.password),
        "profile_complete": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    token = create_token(user_id, user_data.role)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            phone=user_data.phone,
            role=user_data.role,
            created_at=user["created_at"],
            profile_complete=False
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["role"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            phone=user.get("phone"),
            role=user["role"],
            created_at=user["created_at"],
            profile_complete=user.get("profile_complete", False)
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        phone=user.get("phone"),
        role=user["role"],
        created_at=user["created_at"],
        profile_complete=user.get("profile_complete", False)
    )

# ==================== WORKER PROFILE ROUTES ====================

@api_router.post("/worker/profile", response_model=WorkerProfileResponse)
async def create_worker_profile(profile_data: WorkerProfileCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can create worker profiles")
    
    existing = await db.worker_profiles.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists. Use PUT to update.")
    
    profile_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    profile = {
        "id": profile_id,
        "user_id": user["id"],
        **profile_data.model_dump(),
        "skills": [s.model_dump() for s in profile_data.skills],
        "rating": 0.0,
        "total_jobs_completed": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.worker_profiles.insert_one(profile)
    await db.users.update_one({"id": user["id"]}, {"$set": {"profile_complete": True}})
    
    return WorkerProfileResponse(**{k: v for k, v in profile.items() if k != "_id"})

@api_router.get("/worker/profile", response_model=WorkerProfileResponse)
async def get_worker_profile(user: dict = Depends(get_current_user)):
    profile = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return WorkerProfileResponse(**profile)

@api_router.put("/worker/profile", response_model=WorkerProfileResponse)
async def update_worker_profile(profile_data: WorkerProfileCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can update worker profiles")
    
    existing = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = profile_data.model_dump()
    update_data["skills"] = [s.model_dump() for s in profile_data.skills]
    update_data["updated_at"] = now
    
    await db.worker_profiles.update_one(
        {"user_id": user["id"]},
        {"$set": update_data}
    )
    
    updated = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return WorkerProfileResponse(**updated)

@api_router.get("/worker/profile/{worker_id}", response_model=WorkerProfileResponse)
async def get_worker_profile_by_id(worker_id: str, user: dict = Depends(get_current_user)):
    profile = await db.worker_profiles.find_one({"user_id": worker_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return WorkerProfileResponse(**profile)

# ==================== EMPLOYER PROFILE ROUTES ====================

@api_router.post("/employer/profile", response_model=EmployerProfileResponse)
async def create_employer_profile(profile_data: EmployerProfileCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can create employer profiles")
    
    existing = await db.employer_profiles.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists. Use PUT to update.")
    
    profile_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    profile = {
        "id": profile_id,
        "user_id": user["id"],
        **profile_data.model_dump(),
        "rating": 0.0,
        "total_jobs_posted": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.employer_profiles.insert_one(profile)
    await db.users.update_one({"id": user["id"]}, {"$set": {"profile_complete": True}})
    
    return EmployerProfileResponse(**{k: v for k, v in profile.items() if k != "_id"})

@api_router.get("/employer/profile", response_model=EmployerProfileResponse)
async def get_employer_profile(user: dict = Depends(get_current_user)):
    profile = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return EmployerProfileResponse(**profile)

@api_router.put("/employer/profile", response_model=EmployerProfileResponse)
async def update_employer_profile(profile_data: EmployerProfileCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can update employer profiles")
    
    existing = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = profile_data.model_dump()
    update_data["updated_at"] = now
    
    await db.employer_profiles.update_one(
        {"user_id": user["id"]},
        {"$set": update_data}
    )
    
    updated = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return EmployerProfileResponse(**updated)

# ==================== JOB ROUTES ====================

@api_router.post("/jobs", response_model=JobResponse)
async def create_job(job_data: JobCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can create jobs")
    
    employer_profile = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not employer_profile:
        raise HTTPException(status_code=400, detail="Complete your employer profile first")
    
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    job = {
        "id": job_id,
        "employer_id": user["id"],
        "employer_name": user["name"],
        "company_name": employer_profile.get("company_name", ""),
        **job_data.model_dump(),
        "status": "open",
        "applications_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.jobs.insert_one(job)
    await db.employer_profiles.update_one(
        {"user_id": user["id"]},
        {"$inc": {"total_jobs_posted": 1}}
    )
    
    return JobResponse(**{k: v for k, v in job.items() if k != "_id"})

@api_router.get("/jobs", response_model=List[JobResponse])
async def get_jobs(
    category: Optional[str] = None,
    location: Optional[str] = None,
    skills: Optional[str] = None,
    status: str = "open",
    limit: int = Query(default=50, le=100),
    skip: int = 0,
    user: dict = Depends(get_current_user)
):
    query = {"status": status}
    
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        query["skills_required"] = {"$in": skill_list}
    
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [JobResponse(**job) for job in jobs]

@api_router.get("/jobs/employer", response_model=List[JobResponse])
async def get_employer_jobs(user: dict = Depends(get_current_user)):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can view their jobs")
    
    jobs = await db.jobs.find({"employer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [JobResponse(**job) for job in jobs]

@api_router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(**job)

@api_router.put("/jobs/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job_data: JobCreate, user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["employer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")
    
    update_data = job_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.jobs.update_one({"id": job_id}, {"$set": update_data})
    
    updated = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    return JobResponse(**updated)

@api_router.patch("/jobs/{job_id}/status")
async def update_job_status(job_id: str, status: str = Query(...), user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["employer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.jobs.update_one(
        {"id": job_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Job status updated to {status}"}

# ==================== APPLICATION ROUTES ====================

@api_router.post("/applications", response_model=ApplicationResponse)
async def apply_to_job(application_data: ApplicationCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can apply to jobs")
    
    # Check if already applied
    existing = await db.applications.find_one({
        "job_id": application_data.job_id,
        "worker_id": user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")
    
    # Get job
    job = await db.jobs.find_one({"id": application_data.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "open":
        raise HTTPException(status_code=400, detail="Job is not accepting applications")
    
    # Get worker profile
    worker_profile = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not worker_profile:
        raise HTTPException(status_code=400, detail="Complete your profile before applying")
    
    # Calculate match score
    match_result = await calculate_match_score(worker_profile, job)
    
    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    application = {
        "id": app_id,
        "job_id": application_data.job_id,
        "worker_id": user["id"],
        "worker_name": user["name"],
        "status": "applied",
        "cover_message": application_data.cover_message,
        "expected_pay": application_data.expected_pay,
        "match_score": match_result.score,
        "match_explanation": match_result.explanation,
        "match_factors": match_result.factors,
        "created_at": now,
        "updated_at": now
    }
    
    await db.applications.insert_one(application)
    await db.jobs.update_one({"id": application_data.job_id}, {"$inc": {"applications_count": 1}})
    
    # Notify employer
    await create_notification(
        user_id=job["employer_id"],
        type="new_application",
        title="New Application",
        message=f"{user['name']} applied to your job: {job['title']}",
        data={"job_id": job["id"], "application_id": app_id}
    )
    
    return ApplicationResponse(
        id=app_id,
        job_id=application_data.job_id,
        worker_id=user["id"],
        worker_name=user["name"],
        worker_profile=worker_profile,
        status="applied",
        cover_message=application_data.cover_message,
        expected_pay=application_data.expected_pay,
        match_score=match_result.score,
        match_explanation=match_result.explanation,
        created_at=now,
        updated_at=now
    )

@api_router.get("/applications/worker", response_model=List[ApplicationResponse])
async def get_worker_applications(user: dict = Depends(get_current_user)):
    if user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can view their applications")
    
    applications = await db.applications.find({"worker_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for app in applications:
        job = await db.jobs.find_one({"id": app["job_id"]}, {"_id": 0})
        app["job"] = job
        result.append(ApplicationResponse(**app))
    
    return result

@api_router.get("/applications/job/{job_id}", response_model=List[ApplicationResponse])
async def get_job_applications(job_id: str, user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["employer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).sort([("match_score", -1), ("created_at", -1)]).to_list(100)
    
    result = []
    for app in applications:
        worker_profile = await db.worker_profiles.find_one({"user_id": app["worker_id"]}, {"_id": 0})
        app["worker_profile"] = worker_profile
        result.append(ApplicationResponse(**app))
    
    return result

@api_router.patch("/applications/{app_id}/status")
async def update_application_status(app_id: str, status: str = Query(...), user: dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    job = await db.jobs.find_one({"id": application["job_id"]}, {"_id": 0})
    if job["employer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.applications.update_one(
        {"id": app_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notify worker
    status_messages = {
        "shortlisted": f"Good news! You've been shortlisted for: {job['title']}",
        "selected": f"Congratulations! You've been selected for: {job['title']}",
        "rejected": f"Your application for {job['title']} was not selected"
    }
    
    if status in status_messages:
        await create_notification(
            user_id=application["worker_id"],
            type=f"application_{status}",
            title=f"Application {status.title()}",
            message=status_messages[status],
            data={"job_id": job["id"], "application_id": app_id}
        )
    
    return {"message": f"Application status updated to {status}"}

# ==================== MATCH SCORE ROUTE ====================

@api_router.get("/match-score/{job_id}", response_model=MatchScoreResponse)
async def get_match_score(job_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can check match scores")
    
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    worker_profile = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not worker_profile:
        raise HTTPException(status_code=400, detail="Complete your profile first")
    
    return await calculate_match_score(worker_profile, job)

# ==================== CHAT/MESSAGING ROUTES ====================

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(message_data: MessageCreate, user: dict = Depends(get_current_user)):
    receiver = await db.users.find_one({"id": message_data.receiver_id}, {"_id": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    message = {
        "id": msg_id,
        "sender_id": user["id"],
        "sender_name": user["name"],
        "receiver_id": message_data.receiver_id,
        "content": message_data.content,
        "read": False,
        "created_at": now
    }
    
    await db.messages.insert_one(message)
    
    # Notify receiver
    await create_notification(
        user_id=message_data.receiver_id,
        type="new_message",
        title="New Message",
        message=f"{user['name']}: {message_data.content[:50]}...",
        data={"sender_id": user["id"]}
    )
    
    return MessageResponse(**{k: v for k, v in message.items() if k != "_id"})

@api_router.get("/messages/{other_user_id}", response_model=List[MessageResponse])
async def get_conversation(other_user_id: str, user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": user["id"], "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user["id"]}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(500)
    
    # Mark messages as read
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return [MessageResponse(**msg) for msg in messages]

@api_router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(user: dict = Depends(get_current_user)):
    # Get all users I've had conversations with
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender_id": user["id"]},
                    {"receiver_id": user["id"]}
                ]
            }
        },
        {
            "$sort": {"created_at": -1}
        },
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", user["id"]]},
                        "$receiver_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$first": "$content"},
                "last_message_time": {"$first": "$created_at"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {"$and": [
                                {"$eq": ["$receiver_id", user["id"]]},
                                {"$eq": ["$read", False]}
                            ]},
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]
    
    conversations = await db.messages.aggregate(pipeline).to_list(50)
    
    result = []
    for conv in conversations:
        other_user = await db.users.find_one({"id": conv["_id"]}, {"_id": 0})
        if other_user:
            result.append(ConversationResponse(
                user_id=conv["_id"],
                user_name=other_user["name"],
                user_role=other_user["role"],
                last_message=conv["last_message"],
                last_message_time=conv["last_message_time"],
                unread_count=conv["unread_count"]
            ))
    
    return result

# ==================== RATINGS ROUTES ====================

@api_router.post("/ratings", response_model=RatingResponse)
async def create_rating(rating_data: RatingCreate, user: dict = Depends(get_current_user)):
    # Verify the job exists and is associated with both users
    job = await db.jobs.find_one({"id": rating_data.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already rated
    existing = await db.ratings.find_one({
        "rater_id": user["id"],
        "rated_user_id": rating_data.rated_user_id,
        "job_id": rating_data.job_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already rated for this job")
    
    rating_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    rating = {
        "id": rating_id,
        "rater_id": user["id"],
        "rater_name": user["name"],
        "rated_user_id": rating_data.rated_user_id,
        "job_id": rating_data.job_id,
        "rating": rating_data.rating,
        "review": rating_data.review,
        "created_at": now
    }
    
    await db.ratings.insert_one(rating)
    
    # Update average rating
    rated_user = await db.users.find_one({"id": rating_data.rated_user_id}, {"_id": 0})
    if rated_user:
        profile_collection = "worker_profiles" if rated_user["role"] == "worker" else "employer_profiles"
        all_ratings = await db.ratings.find({"rated_user_id": rating_data.rated_user_id}, {"_id": 0}).to_list(100)
        avg_rating = sum(r["rating"] for r in all_ratings) / len(all_ratings)
        
        await db[profile_collection].update_one(
            {"user_id": rating_data.rated_user_id},
            {"$set": {"rating": round(avg_rating, 1)}}
        )
    
    return RatingResponse(**{k: v for k, v in rating.items() if k != "_id"})

@api_router.get("/ratings/{user_id}", response_model=List[RatingResponse])
async def get_user_ratings(user_id: str, user: dict = Depends(get_current_user)):
    ratings = await db.ratings.find({"rated_user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [RatingResponse(**r) for r in ratings]

# ==================== NOTIFICATIONS ROUTES ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [NotificationResponse(**n) for n in notifications]

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

@api_router.patch("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

# ==================== STATS/DASHBOARD ROUTES ====================

@api_router.get("/stats/worker")
async def get_worker_stats(user: dict = Depends(get_current_user)):
    if user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can access this")
    
    applications = await db.applications.find({"worker_id": user["id"]}, {"_id": 0}).to_list(100)
    profile = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    
    return {
        "total_applications": len(applications),
        "shortlisted": sum(1 for a in applications if a["status"] == "shortlisted"),
        "selected": sum(1 for a in applications if a["status"] == "selected"),
        "rejected": sum(1 for a in applications if a["status"] == "rejected"),
        "rating": profile.get("rating", 0) if profile else 0,
        "jobs_completed": profile.get("total_jobs_completed", 0) if profile else 0
    }

@api_router.get("/stats/employer")
async def get_employer_stats(user: dict = Depends(get_current_user)):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can access this")
    
    jobs = await db.jobs.find({"employer_id": user["id"]}, {"_id": 0}).to_list(100)
    profile = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    
    total_applications = 0
    for job in jobs:
        apps = await db.applications.count_documents({"job_id": job["id"]})
        total_applications += apps
    
    return {
        "total_jobs_posted": len(jobs),
        "open_jobs": sum(1 for j in jobs if j["status"] == "open"),
        "filled_jobs": sum(1 for j in jobs if j["status"] == "filled"),
        "total_applications": total_applications,
        "rating": profile.get("rating", 0) if profile else 0
    }

# ==================== CATEGORIES ====================

@api_router.get("/categories")
async def get_categories():
    return {
        "categories": [
            {"id": "construction", "name": "Construction", "icon": "building"},
            {"id": "electrician", "name": "Electrician", "icon": "zap"},
            {"id": "plumber", "name": "Plumber", "icon": "droplet"},
            {"id": "carpenter", "name": "Carpenter", "icon": "hammer"},
            {"id": "painter", "name": "Painter", "icon": "paintbrush"},
            {"id": "mason", "name": "Mason", "icon": "layers"},
            {"id": "welder", "name": "Welder", "icon": "flame"},
            {"id": "driver", "name": "Driver", "icon": "truck"},
            {"id": "security", "name": "Security", "icon": "shield"},
            {"id": "cleaning", "name": "Cleaning", "icon": "sparkles"},
            {"id": "gardener", "name": "Gardener", "icon": "flower"},
            {"id": "helper", "name": "Helper/Labour", "icon": "users"}
        ]
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed database with demo data"""
    
    # Create demo workers
    workers = [
        {"email": "ramesh@demo.com", "name": "Ramesh Kumar", "phone": "9876543210", "role": "worker"},
        {"email": "suresh@demo.com", "name": "Suresh Singh", "phone": "9876543211", "role": "worker"},
        {"email": "mohan@demo.com", "name": "Mohan Sharma", "phone": "9876543212", "role": "worker"},
    ]
    
    # Create demo employers
    employers = [
        {"email": "abc@contractor.com", "name": "ABC Constructions", "phone": "9876543220", "role": "employer"},
        {"email": "xyz@builder.com", "name": "XYZ Builders", "phone": "9876543221", "role": "employer"},
    ]
    
    created_workers = []
    created_employers = []
    
    for w in workers:
        existing = await db.users.find_one({"email": w["email"]})
        if not existing:
            user_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            user = {
                "id": user_id,
                **w,
                "password_hash": hash_password("demo123"),
                "profile_complete": True,
                "created_at": now,
                "updated_at": now
            }
            await db.users.insert_one(user)
            
            # Create worker profile
            profile = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "skills": [
                    {"name": "Construction", "years_experience": 5, "proficiency": "expert"},
                    {"name": "Mason", "years_experience": 3, "proficiency": "intermediate"}
                ],
                "experience_years": 5,
                "daily_rate": 800,
                "hourly_rate": 100,
                "location": "Mumbai, Maharashtra",
                "latitude": 19.076,
                "longitude": 72.8777,
                "bio": "Experienced worker with 5+ years in construction",
                "availability": "available",
                "languages": ["Hindi", "Marathi"],
                "rating": 4.5,
                "total_jobs_completed": 25,
                "created_at": now,
                "updated_at": now
            }
            await db.worker_profiles.insert_one(profile)
            created_workers.append(user_id)
    
    for e in employers:
        existing = await db.users.find_one({"email": e["email"]})
        if not existing:
            user_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            user = {
                "id": user_id,
                **e,
                "password_hash": hash_password("demo123"),
                "profile_complete": True,
                "created_at": now,
                "updated_at": now
            }
            await db.users.insert_one(user)
            
            # Create employer profile
            profile = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "company_name": e["name"],
                "business_type": "Construction",
                "location": "Mumbai, Maharashtra",
                "latitude": 19.076,
                "longitude": 72.8777,
                "description": "Leading construction company in Mumbai",
                "verified": True,
                "rating": 4.8,
                "total_jobs_posted": 10,
                "created_at": now,
                "updated_at": now
            }
            await db.employer_profiles.insert_one(profile)
            created_employers.append(user_id)
            
            # Create some jobs
            jobs_data = [
                {
                    "title": "Construction Worker Needed",
                    "description": "Looking for experienced construction workers for a residential project",
                    "category": "construction",
                    "skills_required": ["Construction", "Mason"],
                    "experience_required": 2,
                    "pay_type": "daily",
                    "pay_amount": 800,
                    "location": "Andheri, Mumbai",
                    "latitude": 19.1136,
                    "longitude": 72.8697,
                    "duration": "3 months",
                    "vacancies": 5
                },
                {
                    "title": "Electrician Required Urgently",
                    "description": "Need skilled electrician for commercial building wiring",
                    "category": "electrician",
                    "skills_required": ["Electrician", "Wiring"],
                    "experience_required": 3,
                    "pay_type": "daily",
                    "pay_amount": 1000,
                    "location": "Bandra, Mumbai",
                    "latitude": 19.0596,
                    "longitude": 72.8295,
                    "duration": "1 month",
                    "vacancies": 2
                }
            ]
            
            for job_data in jobs_data:
                job_id = str(uuid.uuid4())
                job = {
                    "id": job_id,
                    "employer_id": user_id,
                    "employer_name": e["name"],
                    "company_name": e["name"],
                    **job_data,
                    "status": "open",
                    "applications_count": 0,
                    "created_at": now,
                    "updated_at": now
                }
                await db.jobs.insert_one(job)
    
    return {
        "message": "Database seeded successfully",
        "demo_credentials": {
            "workers": [{"email": w["email"], "password": "demo123"} for w in workers],
            "employers": [{"email": e["email"], "password": "demo123"} for e in employers]
        }
    }

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "ShramSetu API v1.0", "status": "running"}

# ==================== WEBSOCKET FOR REAL-TIME CHAT ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["user_id"]
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            await websocket.close(code=4001)
            return
    except:
        await websocket.close(code=4001)
        return
    
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                # Save message to database
                msg_id = str(uuid.uuid4())
                now = datetime.now(timezone.utc).isoformat()
                
                message = {
                    "id": msg_id,
                    "sender_id": user_id,
                    "sender_name": user["name"],
                    "receiver_id": data["receiver_id"],
                    "content": data["content"],
                    "read": False,
                    "created_at": now
                }
                
                await db.messages.insert_one(message)
                
                # Send to receiver if online
                await manager.send_personal_message({
                    "type": "new_message",
                    "message": {k: v for k, v in message.items() if k != "_id"}
                }, data["receiver_id"])
                
                # Confirm to sender
                await websocket.send_json({
                    "type": "message_sent",
                    "message": {k: v for k, v in message.items() if k != "_id"}
                })
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

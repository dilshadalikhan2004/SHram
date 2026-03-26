from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query, status, UploadFile, File, Request, Response, Header
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
import requests
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

# Storage Config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "shramsetu")
storage_key = None

# Stripe Config
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

# Job Boost Packages
BOOST_PACKAGES = {
    "basic": {"price": 99.00, "days": 7, "name": "Basic Boost"},
    "premium": {"price": 249.00, "days": 14, "name": "Premium Boost"},
    "featured": {"price": 499.00, "days": 30, "name": "Featured Listing"}
}

# Create the main app
app = FastAPI(title="ShramSetu API", version="2.0.0")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== TRANSLATIONS ====================

TRANSLATIONS = {
    "en": {
        "welcome": "Welcome",
        "find_jobs": "Find Jobs",
        "post_job": "Post Job",
        "my_applications": "My Applications",
        "profile": "Profile",
        "settings": "Settings",
        "logout": "Logout",
        "apply_now": "Apply Now",
        "save_job": "Save Job",
        "match_score": "Match Score",
        "skills": "Skills",
        "experience": "Experience",
        "location": "Location",
        "daily_rate": "Daily Rate",
        "contact": "Contact",
        "rating": "Rating",
        "verified": "Verified",
        "available": "Available",
        "busy": "Busy",
        "search_jobs": "Search jobs...",
        "all_categories": "All Categories",
        "applied": "Applied",
        "shortlisted": "Shortlisted",
        "selected": "Selected",
        "rejected": "Rejected",
        "boost_job": "Boost Job",
        "recommended": "Recommended for you",
        "top_candidates": "Top Candidates",
        "reliability_score": "Reliability Score",
        "jobs_completed": "Jobs Completed",
        "phone_verified": "Phone Verified"
    },
    "hi": {
        "welcome": "स्वागत है",
        "find_jobs": "नौकरी खोजें",
        "post_job": "नौकरी पोस्ट करें",
        "my_applications": "मेरे आवेदन",
        "profile": "प्रोफ़ाइल",
        "settings": "सेटिंग्स",
        "logout": "लॉग आउट",
        "apply_now": "अभी आवेदन करें",
        "save_job": "नौकरी सहेजें",
        "match_score": "मैच स्कोर",
        "skills": "कौशल",
        "experience": "अनुभव",
        "location": "स्थान",
        "daily_rate": "दैनिक दर",
        "contact": "संपर्क",
        "rating": "रेटिंग",
        "verified": "सत्यापित",
        "available": "उपलब्ध",
        "busy": "व्यस्त",
        "search_jobs": "नौकरी खोजें...",
        "all_categories": "सभी श्रेणियाँ",
        "applied": "आवेदन किया",
        "shortlisted": "शॉर्टलिस्ट",
        "selected": "चयनित",
        "rejected": "अस्वीकृत",
        "boost_job": "नौकरी बूस्ट करें",
        "recommended": "आपके लिए अनुशंसित",
        "top_candidates": "शीर्ष उम्मीदवार",
        "reliability_score": "विश्वसनीयता स्कोर",
        "jobs_completed": "पूर्ण नौकरियां",
        "phone_verified": "फ़ोन सत्यापित"
    },
    "or": {
        "welcome": "ସ୍ୱାଗତ",
        "find_jobs": "ଚାକିରି ଖୋଜନ୍ତୁ",
        "post_job": "ଚାକିରି ପୋଷ୍ଟ କରନ୍ତୁ",
        "my_applications": "ମୋର ଆବେଦନ",
        "profile": "ପ୍ରୋଫାଇଲ୍",
        "settings": "ସେଟିଂସ୍",
        "logout": "ଲଗଆଉଟ୍",
        "apply_now": "ବର୍ତ୍ତମାନ ଆବେଦନ କରନ୍ତୁ",
        "save_job": "ଚାକିରି ସଞ୍ଚୟ କରନ୍ତୁ",
        "match_score": "ମ୍ୟାଚ୍ ସ୍କୋର",
        "skills": "କୌଶଳ",
        "experience": "ଅଭିଜ୍ଞତା",
        "location": "ଅବସ୍ଥାନ",
        "daily_rate": "ଦୈନିକ ହାର",
        "contact": "ଯୋଗାଯୋଗ",
        "rating": "ରେଟିଂ",
        "verified": "ଯାଞ୍ଚ ହୋଇଛି",
        "available": "ଉପಲବ୍ଧ",
        "busy": "ବ୍ୟସ୍ତ",
        "search_jobs": "ଚାକିରି ଖୋଜନ୍ତୁ...",
        "all_categories": "ସମସ୍ତ ଶ୍ରେଣୀ",
        "applied": "ଆବେଦନ ହୋଇଛି",
        "shortlisted": "ସର୍ଟଲିଷ୍ଟ",
        "selected": "ଚୟନିତ",
        "rejected": "ପ୍ରତ୍ୟାଖ୍ୟାତ",
        "boost_job": "ଚାକିରି ବୁଷ୍ଟ କରନ୍ତୁ",
        "recommended": "ଆପଣଙ୍କ ପାଇଁ ସୁପାରିଶ",
        "top_candidates": "ଶୀର୍ଷ ପ୍ରାର୍ଥୀ",
        "reliability_score": "ବିଶ୍ୱସନୀୟତା ସ୍କୋର",
        "jobs_completed": "ସମ୍ପୂର୍ଣ୍ଣ ଚାକିରି",
        "phone_verified": "ଫୋନ୍ ଯାଞ୍ଚ ହୋଇଛି"
    }
}

# ==================== STORAGE FUNCTIONS ====================

def init_storage():
    """Initialize storage - call once at startup"""
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    """Download file from storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "pdf": "application/pdf"
}

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str = Field(..., pattern="^(worker|employer|both)$")

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
    phone_verified: bool = False
    profile_photo: Optional[str] = None
    preferred_language: str = "en"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class WorkerSkill(BaseModel):
    name: str
    years_experience: int = 0
    proficiency: str = "intermediate"

class WorkerProfileCreate(BaseModel):
    skills: List[WorkerSkill]
    experience_years: int = 0
    daily_rate: float = 0
    hourly_rate: float = 0
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bio: Optional[str] = None
    availability: str = "available"
    languages: List[str] = ["Hindi"]
    profile_photo: Optional[str] = None

class WorkerProfileResponse(WorkerProfileCreate):
    id: str
    user_id: str
    rating: float = 0.0
    total_jobs_completed: int = 0
    reliability_score: float = 0.0
    acceptance_rate: float = 0.0
    phone_verified: bool = False
    created_at: str
    updated_at: str

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
    total_hires: int = 0
    created_at: str
    updated_at: str

class JobCreate(BaseModel):
    title: str
    description: str
    category: str
    skills_required: List[str]
    experience_required: int = 0
    pay_type: str = "daily"
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
    status: str = "open"
    applications_count: int = 0
    is_boosted: bool = False
    boost_expires: Optional[str] = None
    boost_type: Optional[str] = None
    created_at: str
    updated_at: str

class ApplicationCreate(BaseModel):
    job_id: str
    cover_message: Optional[str] = None
    expected_pay: Optional[float] = None
    quick_apply: bool = False

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    worker_id: str
    worker_name: str
    worker_profile: Optional[Dict] = None
    status: str = "applied"
    cover_message: Optional[str] = None
    expected_pay: Optional[float] = None
    match_score: Optional[float] = None
    match_explanation: Optional[str] = None
    reliability_score: Optional[float] = None
    ai_recommendation: Optional[str] = None
    created_at: str
    updated_at: str

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

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    data: Optional[Dict] = None
    read: bool = False
    created_at: str

class MatchScoreResponse(BaseModel):
    score: float
    explanation: str
    factors: Dict[str, Any]
    ai_recommendation: Optional[str] = None

class SavedJobCreate(BaseModel):
    job_id: str

class WorkHistoryResponse(BaseModel):
    id: str
    job_id: str
    job_title: str
    employer_name: str
    status: str
    rating_received: Optional[int] = None
    review_received: Optional[str] = None
    completed_at: Optional[str] = None

class BoostJobRequest(BaseModel):
    job_id: str
    package_id: str
    origin_url: str

class CheckoutStatusRequest(BaseModel):
    session_id: str

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

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(optional_security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    except:
        return None

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    if not all([lat1, lon1, lat2, lon2]):
        return 999
    R = 6371
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

async def calculate_reliability_score(worker_id: str) -> float:
    """Calculate reliability score based on work history"""
    applications = await db.applications.find({"worker_id": worker_id}).to_list(100)
    
    if not applications:
        return 50.0  # Default for new workers
    
    total = len(applications)
    completed = sum(1 for a in applications if a.get("status") == "completed")
    selected = sum(1 for a in applications if a.get("status") in ["selected", "completed"])
    rejected = sum(1 for a in applications if a.get("status") == "rejected")
    
    # Calculate components
    completion_rate = (completed / max(selected, 1)) * 100 if selected > 0 else 50
    acceptance_rate = ((total - rejected) / total) * 100 if total > 0 else 50
    
    # Get average rating
    ratings = await db.ratings.find({"rated_user_id": worker_id}, {"_id": 0}).to_list(100)
    avg_rating = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 3.0
    rating_score = (avg_rating / 5) * 100
    
    # Weighted average
    reliability = (completion_rate * 0.4) + (acceptance_rate * 0.3) + (rating_score * 0.3)
    
    return min(100, max(0, round(reliability, 1)))

# ==================== AI MATCHING SYSTEM ====================

async def calculate_match_score(worker_profile: dict, job: dict) -> MatchScoreResponse:
    """Calculate AI-powered match score with enhanced features"""
    
    worker_skills = [s.get("name", "").lower() for s in worker_profile.get("skills", [])]
    required_skills = [s.lower() for s in job.get("skills_required", [])]
    worker_experience = worker_profile.get("experience_years", 0)
    required_experience = job.get("experience_required", 0)
    
    # Skill match
    matching_skills = set(worker_skills) & set(required_skills)
    skill_match = len(matching_skills) / max(len(required_skills), 1) * 100
    
    # Experience match
    if required_experience == 0:
        experience_match = 100
    elif worker_experience >= required_experience:
        experience_match = 100
    else:
        experience_match = (worker_experience / required_experience) * 100
    
    # Distance
    distance = calculate_distance(
        worker_profile.get("latitude"), worker_profile.get("longitude"),
        job.get("latitude"), job.get("longitude")
    )
    
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
    
    # Reliability score
    reliability = worker_profile.get("reliability_score", 50)
    reliability_score = reliability
    
    # Overall score with reliability
    overall_score = (skill_match * 0.4) + (experience_match * 0.25) + (distance_score * 0.2) + (reliability_score * 0.15)
    
    # Generate AI explanation
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"match_{uuid.uuid4()}",
            system_message="You are a job matching assistant for ShramSetu, a labor marketplace in India. Provide brief, helpful explanations in a friendly tone."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Analyze this job match and provide:
1. A brief 1-2 sentence explanation
2. A recommendation (Highly Recommended / Recommended / Consider / Not Recommended)

Worker Skills: {', '.join(worker_skills)}
Required Skills: {', '.join(required_skills)}
Matching Skills: {', '.join(matching_skills)}
Worker Experience: {worker_experience} years
Required Experience: {required_experience} years
Distance: {distance:.1f} km
Reliability Score: {reliability}%
Overall Match: {overall_score:.0f}%

Format response as:
EXPLANATION: [your explanation]
RECOMMENDATION: [your recommendation]"""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        explanation = response
        recommendation = "Recommended" if overall_score >= 70 else "Consider"
        
        if "EXPLANATION:" in response:
            parts = response.split("RECOMMENDATION:")
            explanation = parts[0].replace("EXPLANATION:", "").strip()
            if len(parts) > 1:
                recommendation = parts[1].strip()
                
    except Exception as e:
        logger.error(f"AI explanation failed: {e}")
        if overall_score >= 80:
            explanation = f"Excellent match! {len(matching_skills)} skills match and you're only {distance:.1f}km away."
            recommendation = "Highly Recommended"
        elif overall_score >= 60:
            explanation = f"Good match with {len(matching_skills)} matching skills."
            recommendation = "Recommended"
        elif overall_score >= 40:
            explanation = f"Partial match. Some skills align."
            recommendation = "Consider"
        else:
            explanation = f"Limited match. Focus on better aligned jobs."
            recommendation = "Not Recommended"
    
    return MatchScoreResponse(
        score=round(overall_score, 1),
        explanation=explanation,
        factors={
            "skill_match": round(skill_match, 1),
            "experience_match": round(experience_match, 1),
            "distance_score": round(distance_score, 1),
            "reliability_score": round(reliability_score, 1),
            "distance_km": round(distance, 1),
            "matching_skills": list(matching_skills)
        },
        ai_recommendation=recommendation
    )

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "phone": user_data.phone,
        "role": user_data.role,
        "password_hash": hash_password(user_data.password),
        "profile_complete": False,
        "phone_verified": False,
        "profile_photo": None,
        "preferred_language": "en",
        "created_at": now,
        "updated_at": now
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
            created_at=now,
            profile_complete=False,
            phone_verified=False,
            preferred_language="en"
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
            profile_complete=user.get("profile_complete", False),
            phone_verified=user.get("phone_verified", False),
            profile_photo=user.get("profile_photo"),
            preferred_language=user.get("preferred_language", "en")
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
        profile_complete=user.get("profile_complete", False),
        phone_verified=user.get("phone_verified", False),
        profile_photo=user.get("profile_photo"),
        preferred_language=user.get("preferred_language", "en")
    )

@api_router.patch("/auth/language")
async def update_language(language: str = Query(..., pattern="^(en|hi|or)$"), user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"preferred_language": language}})
    return {"message": "Language updated", "language": language}

# ==================== TRANSLATIONS ROUTE ====================

@api_router.get("/translations/{language}")
async def get_translations(language: str):
    if language not in TRANSLATIONS:
        language = "en"
    return TRANSLATIONS[language]

# ==================== FILE UPLOAD ROUTES ====================

@api_router.post("/upload/profile-photo")
async def upload_profile_photo(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    # Validate file type
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP allowed")
    
    # Read file
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Upload to storage
    path = f"{APP_NAME}/profiles/{user['id']}/{uuid.uuid4()}.{ext}"
    content_type = MIME_TYPES.get(ext, "application/octet-stream")
    
    try:
        result = put_object(path, data, content_type)
        
        # Store reference in DB
        file_record = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "storage_path": result["path"],
            "original_filename": file.filename,
            "content_type": content_type,
            "size": result.get("size", len(data)),
            "type": "profile_photo",
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.files.insert_one(file_record)
        
        # Update user profile photo
        await db.users.update_one({"id": user["id"]}, {"$set": {"profile_photo": result["path"]}})
        
        # Update worker/employer profile if exists
        if user["role"] == "worker":
            await db.worker_profiles.update_one({"user_id": user["id"]}, {"$set": {"profile_photo": result["path"]}})
        else:
            await db.employer_profiles.update_one({"user_id": user["id"]}, {"$set": {"company_logo": result["path"]}})
        
        return {"path": result["path"], "message": "Photo uploaded successfully"}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@api_router.get("/files/{path:path}")
async def get_file(path: str, authorization: str = Header(None), auth: str = Query(None)):
    # Support query param auth for img tags
    if not authorization and auth:
        authorization = f"Bearer {auth}"
    
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=record.get("content_type", content_type))
    except Exception as e:
        logger.error(f"File download failed: {e}")
        raise HTTPException(status_code=404, detail="File not found")

# ==================== WORKER PROFILE ROUTES ====================

@api_router.post("/worker/profile", response_model=WorkerProfileResponse)
async def create_worker_profile(profile_data: WorkerProfileCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["worker", "both"]:
        raise HTTPException(status_code=403, detail="Only workers can create worker profiles")
    
    existing = await db.worker_profiles.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    profile = {
        "id": profile_id,
        "user_id": user["id"],
        **profile_data.model_dump(),
        "skills": [s.model_dump() for s in profile_data.skills],
        "rating": 0.0,
        "total_jobs_completed": 0,
        "reliability_score": 50.0,
        "acceptance_rate": 100.0,
        "phone_verified": user.get("phone_verified", False),
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
    
    # Update reliability score
    reliability = await calculate_reliability_score(user["id"])
    if reliability != profile.get("reliability_score"):
        await db.worker_profiles.update_one({"user_id": user["id"]}, {"$set": {"reliability_score": reliability}})
        profile["reliability_score"] = reliability
    
    return WorkerProfileResponse(**profile)

@api_router.put("/worker/profile", response_model=WorkerProfileResponse)
async def update_worker_profile(profile_data: WorkerProfileCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["worker", "both"]:
        raise HTTPException(status_code=403, detail="Only workers can update worker profiles")
    
    existing = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = profile_data.model_dump()
    update_data["skills"] = [s.model_dump() for s in profile_data.skills]
    update_data["updated_at"] = now
    
    await db.worker_profiles.update_one({"user_id": user["id"]}, {"$set": update_data})
    updated = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return WorkerProfileResponse(**updated)

@api_router.get("/worker/profile/{worker_id}", response_model=WorkerProfileResponse)
async def get_worker_profile_by_id(worker_id: str, user: dict = Depends(get_current_user)):
    profile = await db.worker_profiles.find_one({"user_id": worker_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return WorkerProfileResponse(**profile)

@api_router.get("/worker/history", response_model=List[WorkHistoryResponse])
async def get_work_history(user: dict = Depends(get_current_user)):
    """Get worker's work history with ratings"""
    applications = await db.applications.find(
        {"worker_id": user["id"], "status": {"$in": ["selected", "completed"]}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    history = []
    for app in applications:
        job = await db.jobs.find_one({"id": app["job_id"]}, {"_id": 0})
        if job:
            rating = await db.ratings.find_one(
                {"rated_user_id": user["id"], "job_id": app["job_id"]},
                {"_id": 0}
            )
            history.append(WorkHistoryResponse(
                id=app["id"],
                job_id=app["job_id"],
                job_title=job["title"],
                employer_name=job["employer_name"],
                status=app["status"],
                rating_received=rating["rating"] if rating else None,
                review_received=rating.get("review") if rating else None,
                completed_at=app.get("updated_at")
            ))
    
    return history

# ==================== EMPLOYER PROFILE ROUTES ====================

@api_router.post("/employer/profile", response_model=EmployerProfileResponse)
async def create_employer_profile(profile_data: EmployerProfileCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["employer", "both"]:
        raise HTTPException(status_code=403, detail="Only employers can create employer profiles")
    
    existing = await db.employer_profiles.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    profile = {
        "id": profile_id,
        "user_id": user["id"],
        **profile_data.model_dump(),
        "rating": 0.0,
        "total_jobs_posted": 0,
        "total_hires": 0,
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
    if user["role"] not in ["employer", "both"]:
        raise HTTPException(status_code=403, detail="Only employers can update employer profiles")
    
    existing = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = profile_data.model_dump()
    update_data["updated_at"] = now
    
    await db.employer_profiles.update_one({"user_id": user["id"]}, {"$set": update_data})
    updated = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return EmployerProfileResponse(**updated)

# ==================== JOB ROUTES ====================

@api_router.post("/jobs", response_model=JobResponse)
async def create_job(job_data: JobCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["employer", "both"]:
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
        "is_boosted": False,
        "boost_expires": None,
        "boost_type": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.jobs.insert_one(job)
    await db.employer_profiles.update_one({"user_id": user["id"]}, {"$inc": {"total_jobs_posted": 1}})
    
    return JobResponse(**{k: v for k, v in job.items() if k != "_id"})

@api_router.get("/jobs", response_model=List[JobResponse])
async def get_jobs(
    category: Optional[str] = None,
    location: Optional[str] = None,
    skills: Optional[str] = None,
    status: str = "open",
    min_pay: Optional[float] = None,
    max_distance: Optional[float] = None,
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
    if min_pay:
        query["pay_amount"] = {"$gte": min_pay}
    
    # Sort: boosted jobs first, then by date
    jobs = await db.jobs.find(query, {"_id": 0}).sort([
        ("is_boosted", -1),
        ("created_at", -1)
    ]).skip(skip).limit(limit).to_list(limit)
    
    # Check and expire old boosts
    now = datetime.now(timezone.utc)
    for job in jobs:
        if job.get("is_boosted") and job.get("boost_expires"):
            expires = datetime.fromisoformat(job["boost_expires"].replace("Z", "+00:00"))
            if expires < now:
                await db.jobs.update_one(
                    {"id": job["id"]},
                    {"$set": {"is_boosted": False, "boost_expires": None, "boost_type": None}}
                )
                job["is_boosted"] = False
    
    return [JobResponse(**job) for job in jobs]

@api_router.get("/jobs/recommended", response_model=List[JobResponse])
async def get_recommended_jobs(limit: int = 10, user: dict = Depends(get_current_user)):
    """Get AI-recommended jobs for worker"""
    if user["role"] not in ["worker", "both"]:
        raise HTTPException(status_code=403, detail="Only workers can get recommendations")
    
    worker_profile = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not worker_profile:
        raise HTTPException(status_code=400, detail="Complete your profile first")
    
    # Get open jobs
    jobs = await db.jobs.find({"status": "open"}, {"_id": 0}).limit(50).to_list(50)
    
    # Calculate match scores
    scored_jobs = []
    for job in jobs:
        match = await calculate_match_score(worker_profile, job)
        scored_jobs.append((job, match.score))
    
    # Sort by score
    scored_jobs.sort(key=lambda x: x[1], reverse=True)
    
    return [JobResponse(**job) for job, _ in scored_jobs[:limit]]

@api_router.get("/jobs/employer", response_model=List[JobResponse])
async def get_employer_jobs(user: dict = Depends(get_current_user)):
    if user["role"] not in ["employer", "both"]:
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
        raise HTTPException(status_code=403, detail="Not authorized")
    
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

# ==================== SAVED JOBS ROUTES ====================

@api_router.post("/jobs/save")
async def save_job(data: SavedJobCreate, user: dict = Depends(get_current_user)):
    existing = await db.saved_jobs.find_one({"user_id": user["id"], "job_id": data.job_id})
    if existing:
        raise HTTPException(status_code=400, detail="Job already saved")
    
    saved = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "job_id": data.job_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.saved_jobs.insert_one(saved)
    return {"message": "Job saved"}

@api_router.delete("/jobs/save/{job_id}")
async def unsave_job(job_id: str, user: dict = Depends(get_current_user)):
    await db.saved_jobs.delete_one({"user_id": user["id"], "job_id": job_id})
    return {"message": "Job unsaved"}

@api_router.get("/jobs/saved", response_model=List[JobResponse])
async def get_saved_jobs(user: dict = Depends(get_current_user)):
    saved = await db.saved_jobs.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    job_ids = [s["job_id"] for s in saved]
    jobs = await db.jobs.find({"id": {"$in": job_ids}}, {"_id": 0}).to_list(100)
    return [JobResponse(**job) for job in jobs]

# ==================== APPLICATION ROUTES ====================

@api_router.post("/applications", response_model=ApplicationResponse)
async def apply_to_job(application_data: ApplicationCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["worker", "both"]:
        raise HTTPException(status_code=403, detail="Only workers can apply to jobs")
    
    existing = await db.applications.find_one({
        "job_id": application_data.job_id,
        "worker_id": user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")
    
    job = await db.jobs.find_one({"id": application_data.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "open":
        raise HTTPException(status_code=400, detail="Job is not accepting applications")
    
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
        "cover_message": application_data.cover_message if not application_data.quick_apply else "Quick Apply",
        "expected_pay": application_data.expected_pay,
        "match_score": match_result.score,
        "match_explanation": match_result.explanation,
        "reliability_score": worker_profile.get("reliability_score", 50),
        "ai_recommendation": match_result.ai_recommendation,
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
        data={"job_id": job["id"], "application_id": app_id, "match_score": match_result.score}
    )
    
    return ApplicationResponse(
        id=app_id,
        job_id=application_data.job_id,
        worker_id=user["id"],
        worker_name=user["name"],
        worker_profile=worker_profile,
        status="applied",
        cover_message=application["cover_message"],
        expected_pay=application_data.expected_pay,
        match_score=match_result.score,
        match_explanation=match_result.explanation,
        reliability_score=worker_profile.get("reliability_score", 50),
        ai_recommendation=match_result.ai_recommendation,
        created_at=now,
        updated_at=now
    )

@api_router.get("/applications/worker", response_model=List[ApplicationResponse])
async def get_worker_applications(user: dict = Depends(get_current_user)):
    if user["role"] not in ["worker", "both"]:
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
    
    # Sort by match score (top candidates first)
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).sort([
        ("match_score", -1),
        ("reliability_score", -1),
        ("created_at", -1)
    ]).to_list(100)
    
    result = []
    for app in applications:
        worker_profile = await db.worker_profiles.find_one({"user_id": app["worker_id"]}, {"_id": 0})
        app["worker_profile"] = worker_profile
        result.append(ApplicationResponse(**app))
    
    return result

@api_router.get("/applications/top-candidates/{job_id}")
async def get_top_candidates(job_id: str, limit: int = 5, user: dict = Depends(get_current_user)):
    """Get AI-ranked top candidates for a job"""
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["employer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).sort([
        ("match_score", -1),
        ("reliability_score", -1)
    ]).limit(limit).to_list(limit)
    
    result = []
    for i, app in enumerate(applications):
        worker_profile = await db.worker_profiles.find_one({"user_id": app["worker_id"]}, {"_id": 0})
        result.append({
            "rank": i + 1,
            "application": app,
            "worker_profile": worker_profile,
            "ai_insight": app.get("ai_recommendation", "Good candidate")
        })
    
    return {"top_candidates": result}

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
    
    # Update employer hires count if selected
    if status == "selected":
        await db.employer_profiles.update_one(
            {"user_id": user["id"]},
            {"$inc": {"total_hires": 1}}
        )
    
    # Notify worker
    status_messages = {
        "viewed": f"Your application for {job['title']} has been viewed",
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
    if user["role"] not in ["worker", "both"]:
        raise HTTPException(status_code=403, detail="Only workers can check match scores")
    
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    worker_profile = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not worker_profile:
        raise HTTPException(status_code=400, detail="Complete your profile first")
    
    return await calculate_match_score(worker_profile, job)

# ==================== STRIPE PAYMENT ROUTES ====================

@api_router.get("/boost/packages")
async def get_boost_packages():
    """Get available job boost packages"""
    return {"packages": BOOST_PACKAGES}

@api_router.post("/boost/checkout")
async def create_boost_checkout(data: BoostJobRequest, user: dict = Depends(get_current_user)):
    """Create Stripe checkout session for job boost"""
    if user["role"] not in ["employer", "both"]:
        raise HTTPException(status_code=403, detail="Only employers can boost jobs")
    
    # Validate job
    job = await db.jobs.find_one({"id": data.job_id, "employer_id": user["id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Validate package
    if data.package_id not in BOOST_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = BOOST_PACKAGES[data.package_id]
    
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        # Build URLs from origin
        success_url = f"{data.origin_url}/employer/boost/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{data.origin_url}/employer"
        
        stripe_checkout = StripeCheckout(
            api_key=STRIPE_API_KEY,
            webhook_url=f"{data.origin_url}/api/webhook/stripe"
        )
        
        checkout_request = CheckoutSessionRequest(
            amount=package["price"],
            currency="inr",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user["id"],
                "job_id": data.job_id,
                "package_id": data.package_id,
                "type": "job_boost"
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "user_id": user["id"],
            "job_id": data.job_id,
            "package_id": data.package_id,
            "amount": package["price"],
            "currency": "inr",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        logger.error(f"Stripe checkout failed: {e}")
        raise HTTPException(status_code=500, detail="Payment initialization failed")

@api_router.get("/boost/status/{session_id}")
async def check_boost_status(session_id: str, user: dict = Depends(get_current_user)):
    """Check payment status and activate boost"""
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # If already processed, return status
    if transaction["payment_status"] == "paid":
        return {"status": "paid", "message": "Boost already activated"}
    
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        
        if status.payment_status == "paid":
            # Activate boost
            package = BOOST_PACKAGES[transaction["package_id"]]
            boost_expires = datetime.now(timezone.utc) + timedelta(days=package["days"])
            
            await db.jobs.update_one(
                {"id": transaction["job_id"]},
                {"$set": {
                    "is_boosted": True,
                    "boost_expires": boost_expires.isoformat(),
                    "boost_type": transaction["package_id"]
                }}
            )
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            return {"status": "paid", "message": f"Boost activated for {package['days']} days"}
        
        return {"status": status.payment_status, "message": "Payment pending"}
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail="Status check failed")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            transaction = await db.payment_transactions.find_one(
                {"session_id": event.session_id},
                {"_id": 0}
            )
            
            if transaction and transaction["payment_status"] != "paid":
                package = BOOST_PACKAGES.get(transaction.get("package_id", "basic"))
                boost_expires = datetime.now(timezone.utc) + timedelta(days=package["days"])
                
                await db.jobs.update_one(
                    {"id": transaction["job_id"]},
                    {"$set": {
                        "is_boosted": True,
                        "boost_expires": boost_expires.isoformat(),
                        "boost_type": transaction.get("package_id")
                    }}
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

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
    
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return [MessageResponse(**msg) for msg in messages]

@api_router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"$or": [{"sender_id": user["id"]}, {"receiver_id": user["id"]}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {"$cond": [{"$eq": ["$sender_id", user["id"]]}, "$receiver_id", "$sender_id"]},
            "last_message": {"$first": "$content"},
            "last_message_time": {"$first": "$created_at"},
            "unread_count": {"$sum": {"$cond": [
                {"$and": [{"$eq": ["$receiver_id", user["id"]]}, {"$eq": ["$read", False]}]},
                1, 0
            ]}}
        }}
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
    job = await db.jobs.find_one({"id": rating_data.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
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
    if user["role"] not in ["worker", "both"]:
        raise HTTPException(status_code=403, detail="Only workers can access this")
    
    applications = await db.applications.find({"worker_id": user["id"]}, {"_id": 0}).to_list(100)
    profile = await db.worker_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    saved_jobs = await db.saved_jobs.count_documents({"user_id": user["id"]})
    
    return {
        "total_applications": len(applications),
        "shortlisted": sum(1 for a in applications if a["status"] == "shortlisted"),
        "selected": sum(1 for a in applications if a["status"] == "selected"),
        "rejected": sum(1 for a in applications if a["status"] == "rejected"),
        "rating": profile.get("rating", 0) if profile else 0,
        "jobs_completed": profile.get("total_jobs_completed", 0) if profile else 0,
        "reliability_score": profile.get("reliability_score", 50) if profile else 50,
        "saved_jobs": saved_jobs
    }

@api_router.get("/stats/employer")
async def get_employer_stats(user: dict = Depends(get_current_user)):
    if user["role"] not in ["employer", "both"]:
        raise HTTPException(status_code=403, detail="Only employers can access this")
    
    jobs = await db.jobs.find({"employer_id": user["id"]}, {"_id": 0}).to_list(100)
    profile = await db.employer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    
    total_applications = 0
    for job in jobs:
        apps = await db.applications.count_documents({"job_id": job["id"]})
        total_applications += apps
    
    boosted_jobs = sum(1 for j in jobs if j.get("is_boosted"))
    
    return {
        "total_jobs_posted": len(jobs),
        "open_jobs": sum(1 for j in jobs if j["status"] == "open"),
        "filled_jobs": sum(1 for j in jobs if j["status"] == "filled"),
        "boosted_jobs": boosted_jobs,
        "total_applications": total_applications,
        "total_hires": profile.get("total_hires", 0) if profile else 0,
        "rating": profile.get("rating", 0) if profile else 0
    }

# ==================== CATEGORIES ====================

@api_router.get("/categories")
async def get_categories():
    return {
        "categories": [
            {"id": "construction", "name": "Construction", "name_hi": "निर्माण", "name_or": "ନିର୍ମାଣ", "icon": "building"},
            {"id": "electrician", "name": "Electrician", "name_hi": "इलेक्ट्रीशियन", "name_or": "ଇଲେକ୍ଟ୍ରିସିଆନ୍", "icon": "zap"},
            {"id": "plumber", "name": "Plumber", "name_hi": "प्लंबर", "name_or": "ପ୍ଲମ୍ବର୍", "icon": "droplet"},
            {"id": "carpenter", "name": "Carpenter", "name_hi": "बढ़ई", "name_or": "ବଢ଼େଇ", "icon": "hammer"},
            {"id": "painter", "name": "Painter", "name_hi": "पेंटर", "name_or": "ପେଣ୍ଟର୍", "icon": "paintbrush"},
            {"id": "mason", "name": "Mason", "name_hi": "राजमिस्त्री", "name_or": "ରାଜମିସ୍ତ୍ରୀ", "icon": "layers"},
            {"id": "welder", "name": "Welder", "name_hi": "वेल्डर", "name_or": "ୱେଲ୍ଡର୍", "icon": "flame"},
            {"id": "driver", "name": "Driver", "name_hi": "ड्राइवर", "name_or": "ଡ୍ରାଇଭର୍", "icon": "truck"},
            {"id": "security", "name": "Security", "name_hi": "सुरक्षा", "name_or": "ସୁରକ୍ଷା", "icon": "shield"},
            {"id": "cleaning", "name": "Cleaning", "name_hi": "सफाई", "name_or": "ସଫାଇ", "icon": "sparkles"},
            {"id": "gardener", "name": "Gardener", "name_hi": "माली", "name_or": "ମାଳୀ", "icon": "flower"},
            {"id": "helper", "name": "Helper/Labour", "name_hi": "हेल्पर/मजदूर", "name_or": "ହେଲ୍ପର୍/ମଜୁର", "icon": "users"}
        ]
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed database with demo data"""
    
    workers = [
        {"email": "ramesh@demo.com", "name": "Ramesh Kumar", "phone": "9876543210", "role": "worker"},
        {"email": "suresh@demo.com", "name": "Suresh Singh", "phone": "9876543211", "role": "worker"},
        {"email": "mohan@demo.com", "name": "Mohan Sharma", "phone": "9876543212", "role": "worker"},
    ]
    
    employers = [
        {"email": "abc@contractor.com", "name": "ABC Constructions", "phone": "9876543220", "role": "employer"},
        {"email": "xyz@builder.com", "name": "XYZ Builders", "phone": "9876543221", "role": "employer"},
    ]
    
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
                "phone_verified": True,
                "preferred_language": "hi",
                "created_at": now,
                "updated_at": now
            }
            await db.users.insert_one(user)
            
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
                "bio": "Experienced construction worker with 5+ years",
                "availability": "available",
                "languages": ["Hindi", "Marathi"],
                "rating": 4.5,
                "total_jobs_completed": 25,
                "reliability_score": 92,
                "acceptance_rate": 95,
                "phone_verified": True,
                "created_at": now,
                "updated_at": now
            }
            await db.worker_profiles.insert_one(profile)
    
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
                "phone_verified": True,
                "preferred_language": "en",
                "created_at": now,
                "updated_at": now
            }
            await db.users.insert_one(user)
            
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
                "total_hires": 45,
                "created_at": now,
                "updated_at": now
            }
            await db.employer_profiles.insert_one(profile)
            
            jobs_data = [
                {
                    "title": "Construction Worker Needed",
                    "description": "Looking for experienced construction workers for a residential project in Andheri. Must have at least 2 years experience.",
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
                    "description": "Need skilled electrician for commercial building wiring. Must know industrial wiring.",
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
                },
                {
                    "title": "Plumber for New Apartment",
                    "description": "Experienced plumber needed for new apartment complex. Multiple bathrooms and kitchen fitting work.",
                    "category": "plumber",
                    "skills_required": ["Plumber", "Pipe Fitting"],
                    "experience_required": 2,
                    "pay_type": "daily",
                    "pay_amount": 900,
                    "location": "Powai, Mumbai",
                    "latitude": 19.1176,
                    "longitude": 72.9060,
                    "duration": "2 months",
                    "vacancies": 3
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
                    "is_boosted": False,
                    "boost_expires": None,
                    "boost_type": None,
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
    return {"message": "ShramSetu API v2.0", "status": "running", "features": [
        "AI Match Scoring", "Real-time Chat", "Job Boost", "Multi-language",
        "Reliability Scoring", "Smart Recommendations", "Profile Photos"
    ]}

# ==================== WEBSOCKET ====================

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
                
                await manager.send_personal_message({
                    "type": "new_message",
                    "message": {k: v for k, v in message.items() if k != "_id"}
                }, data["receiver_id"])
                
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

# Startup event
@app.on_event("startup")
async def startup_event():
    try:
        init_storage()
    except Exception as e:
        logger.warning(f"Storage init on startup failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query, status, UploadFile, File, Request, Response, Header, Body, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
from pathlib import Path

# Load environment variables BEFORE other imports
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import logging
import uuid
import json
import jwt
import asyncio
import httpx
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

# Internal Imports
from database import get_db, mongo_url
from translations import TRANSLATIONS
from auth_routes import auth_router
from job_routes import job_router
from profile_routes import profile_router
from application_routes import app_router
from notification_routes import notification_router
from payment_routes import payment_api_router
from squad_routes import squad_router
from earnings_routes import earnings_router
from chat_routes import chat_router
from handshake_routes import handshake_router
from tracking_routes import tracking_router
from portfolio_routes import portfolio_router
from verification_routes import verification_router
from offer_routes import offer_router
from reputation_routes import reputation_router
from subscription_routes import subscription_router
from cloudinary_utils import upload_to_cloudinary
from google import genai
import google.generativeai as legacy_genai # Keeping as fallback if needed elsewhere temporarily

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure Modern Gemini Client
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
ai_client = None
# Lazy AI Client
_ai_client = None
def get_ai_client():
    global _ai_client
    if _ai_client is None and GEMINI_KEY:
        try:
            from google import genai
            _ai_client = genai.Client(api_key=GEMINI_KEY)
            logger.info("Gemini AI Client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI Client: {str(e)}")
    return _ai_client

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'f9b4c7d0e8a21f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')

def _get_jwt_exp():
    val = os.environ.get('JWT_EXPIRATION_HOURS', '24')
    try: return int(val)
    except: return 24
JWT_EXPIRATION_HOURS = _get_jwt_exp()

app = FastAPI(title="ShramSetu API", version="2.0.3")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception caught: {request.method} {request.url} - {type(exc).__name__}: {str(exc)}")
    return Response(
        content=json.dumps({"detail": f"Internal Server Error: {type(exc).__name__}"}),
        status_code=500,
        media_type="application/json"
    )


# CORS Configuration
cors_origins_raw = os.environ.get('CORS_ORIGINS', '')
if cors_origins_raw:
    origins = [o.strip() for o in cors_origins_raw.split(',') if o.strip()]
else:
    # Safe defaults including localhost and production Vercel
    origins = [
        "https://s-hram.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

@api_router.get("/health")
async def health_check():
    db = get_db()
    mongo_status = "unconnected"
    if db is not None:
        try:
            # client is at the module level in database.py
            from database import client
            if client:
                await client.admin.command('ping')
                mongo_status = "connected"
        except Exception as e:
            mongo_status = f"error: {str(e)}"
    
    return {
        "status": "online",
        "mongodb": mongo_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.3"
    }

@api_router.get("/translations/{lang}")
async def get_translations(lang: str):
    """
    Returns the translation dictionary for the requested language.
    Falls back to English if the language is not supported.
    """
    return TRANSLATIONS.get(lang, TRANSLATIONS["en"])

# TEMP DEBUG: List users to diagnose login issues — REMOVE BEFORE PRODUCTION
@api_router.get("/debug/users")

async def debug_users():
    try:
        db = get_db()
        if db is None:
            return {"error": "No DB connection"}
        cursor = db.users.find({})
        users = await cursor.to_list(length=50)
        result = []
        for u in users:
            result.append({
                "_id": str(u.get("_id")),
                "phone": u.get("phone"),
                "email": u.get("email"),
                "full_name": u.get("full_name"),
                "role": u.get("role"),
                "has_password": bool(u.get("password")),
                "has_hashed_password": bool(u.get("hashed_password")),
                "all_fields": [k for k in u.keys() if k not in ("password", "hashed_password")],
            })
        return {"count": len(result), "users": result}
    except Exception as e:
        return {"error": str(e)}

@api_router.get("/translations/{language}")
async def get_translations(language: str):
    if language not in TRANSLATIONS:
        language = "en"
    return TRANSLATIONS[language]

@api_router.get("/categories")
async def get_categories():
    # Return 56 categories from 6 sectors as per PRD
    from database import get_db
    db = get_db()
    # Mock some categories for now or fetch from DB
    categories = [
        {"id": "electrician", "name": "Electrician", "name_hi": "इलेक्ट्रीशियन", "name_or": "ଇଲେକ୍ଟ୍ରିସିଆନ୍"},
        {"id": "plumber", "name": "Plumber", "name_hi": "प्लंबर", "name_or": "ପ୍ଲମ୍ବର"},
        {"id": "painter", "name": "Painter", "name_hi": "पेंटर", "name_or": "ପେଣ୍ଟର"},
        {"id": "carpenter", "name": "Carpenter", "name_hi": "बढ़ई", "name_or": "ବଢ଼େଇ"},
        {"id": "construction", "name": "Construction", "name_hi": "निर्माण", "name_or": "ନିର୍ମାଣ"},
    ]
    return {"categories": categories}

@api_router.post("/upload/video")
async def upload_video(file: UploadFile = File(...)):
    # Save to temp file and upload to Cloudinary
    temp_dir = Path("./tmp")
    temp_dir.mkdir(exist_ok=True)
    temp_path = temp_dir / file.filename
    
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)
    
    cloudinary_url = upload_to_cloudinary(str(temp_path), folder="shramsetu/videos")
    
    # Clean up temp file
    if temp_path.exists():
        os.remove(temp_path)
    
    if not cloudinary_url:
        raise HTTPException(status_code=500, detail="Failed to upload to Cloudinary")
        
    return {"video_url": cloudinary_url}

@api_router.post("/upload/photo")
async def upload_photo(file: UploadFile = File(...)):
    temp_dir = Path("./tmp")
    temp_dir.mkdir(exist_ok=True)
    temp_path = temp_dir / file.filename
    
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)
    
    cloudinary_url = upload_to_cloudinary(str(temp_path), folder="shramsetu/photos")
    
    if temp_path.exists():
        os.remove(temp_path)
        
    if not cloudinary_url:
        raise HTTPException(status_code=500, detail="Failed to upload to Cloudinary")
        
    return {"photo_url": cloudinary_url}

@api_router.post("/chatbot")
async def shram_chatbot(request: Request):
    data = await request.json()
    user_query = data.get("query")
    if not user_query:
        raise HTTPException(status_code=400, detail="Query is required")
        
    try:
        cur_ai_client = get_ai_client()
        if not cur_ai_client:
            logger.error("Chatbot failed: Gemini AI Client not initialized")
            return {"response": "AI Configuration Error: Please check server environment variables."}
            
        contexual_prompt = f"""
        You are 'Shram Assistant', an AI helper for the ShramSetu platform.
        ShramSetu connects blue-collar workers (construction, plumbing, etc.) with employers in India.
        Provide helpful, concise, and professional advice in a friendly tone.
        Current User Query: {user_query}
        """
        
        response = cur_ai_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=contexual_prompt
        )
        
        return {"response": response.text}
    except Exception as e:
        err_str = str(e).lower()
        logger.error(f"Gemini API Critical Failure: {type(e).__name__} - {str(e)}")
        
        # Specific friendly messages for common AI service errors
        if "429" in err_str or "quota" in err_str or "exhausted" in err_str:
            return {"response": "The AI Assistant is currently resting due to high demand. Please try again in a minute or two!"}
        
        if "api_key" in err_str or "invalid" in err_str or "permission" in err_str:
            logger.critical("CHECK SYSTEM ENV: GEMINI_API_KEY appears invalid or restricted.")
            return {"response": "I am experiencing some internal configuration issues. Please try again later while I fix them!"}
            
        return {"response": "I'm having trouble connecting to my brain right now. Please try again later!"}


from fastapi.responses import FileResponse

@api_router.get("/files/{path:path}")
async def serve_uploaded_file(path: str):
    # Handle both 'uploads/filename' and just 'filename'
    if path.startswith("uploads/"):
        file_path = ROOT_DIR / path
    else:
        file_path = ROOT_DIR / "uploads" / path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    # Determine media type
    ext = filename.rsplit(".", 1)[-1].lower()
    media_types = {"webm": "video/webm", "mp4": "video/mp4", "jpg": "image/jpeg", "png": "image/png"}
    return FileResponse(str(file_path), media_type=media_types.get(ext, "application/octet-stream"))

@api_router.get("/stats/worker")
async def get_worker_stats(request: Request):
    from auth_utils import get_current_user_id
    user_id = await get_current_user_id(request)
    db = get_db()

    # Real application counts
    total_applications = await db.applications.count_documents({"worker_id": user_id})
    active_jobs = await db.applications.count_documents({
        "worker_id": user_id, 
        "status": {"$in": ["selected", "accepted", "shortlisted"]}
    })
    completed_jobs = await db.applications.count_documents({
        "worker_id": user_id, "status": "completed"
    })
    rejected_jobs = await db.applications.count_documents({
        "worker_id": user_id, "status": "rejected"
    })

    # Reliability score: weighted formula
    # - Base: 40 points
    # - Completion ratio: up to 30 points (completed / total * 30)
    # - Low rejection bonus: up to 15 points
    # - Profile completeness: up to 15 points
    reliability = 40
    if total_applications > 0:
        completion_ratio = completed_jobs / total_applications
        reliability += int(completion_ratio * 30)
        rejection_ratio = rejected_jobs / total_applications
        reliability += int((1 - rejection_ratio) * 15)
    else:
        reliability += 15  # No rejections = full bonus

    # Profile completeness bonus
    profile = await db.worker_profiles.find_one({"user_id": user_id})
    if profile:
        if profile.get("skills") and len(profile["skills"]) > 0: reliability += 3
        if profile.get("location"): reliability += 3
        if profile.get("bio"): reliability += 2
        if profile.get("phone_verified"): reliability += 3
        if profile.get("video_intro"): reliability += 2
        if profile.get("experience_years"): reliability += 2

    reliability = min(reliability, 99)

    # Weekly earnings from completed jobs in last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    earnings_cursor = db.applications.find({
        "worker_id": user_id,
        "status": "completed",
        "completed_at": {"$gte": seven_days_ago}
    })
    weekly_earnings = 0
    async for app in earnings_cursor:
        weekly_earnings += app.get("earned_amount", 0)

    # Daily earnings for last 7 days (for the bar chart)
    daily_earnings = []
    for i in range(6, -1, -1):
        day_start = datetime.utcnow().replace(hour=0, minute=0, second=0) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_total = 0
        day_cursor = db.applications.find({
            "worker_id": user_id,
            "status": "completed",
            "completed_at": {"$gte": day_start, "$lt": day_end}
        })
        async for app in day_cursor:
            day_total += app.get("earned_amount", 0)
        daily_earnings.append(day_total)

    # Calculate week-over-week growth
    prev_week_start = datetime.utcnow() - timedelta(days=14)
    prev_week_end = datetime.utcnow() - timedelta(days=7)
    prev_cursor = db.applications.find({
        "worker_id": user_id,
        "status": "completed",
        "completed_at": {"$gte": prev_week_start, "$lt": prev_week_end}
    })
    prev_weekly = 0
    async for app in prev_cursor:
        prev_weekly += app.get("earned_amount", 0)
    
    if prev_weekly > 0:
        growth_pct = round(((weekly_earnings - prev_weekly) / prev_weekly) * 100, 1)
    else:
        growth_pct = 0.0 if weekly_earnings == 0 else 100.0

    return {
        "total_applications": total_applications,
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs,
        "reliability_score": reliability,
        "weekly_earnings": weekly_earnings,
        "daily_earnings": daily_earnings,
        "earnings_growth_pct": growth_pct
    }

@api_router.get("/stats/employer")
async def get_employer_stats(request: Request):
    from auth_utils import get_current_user_id
    user_id = await get_current_user_id(request)
    db = get_db()

    # Base Metrics
    total_jobs_posted = await db.jobs.count_documents({"employer_id": user_id})
    active_hiring = await db.jobs.count_documents({"employer_id": user_id, "status": "open"})
    
    # Calculate total hires from employer's jobs
    employer_jobs = await db.jobs.find({"employer_id": user_id}).to_list(None)
    employer_job_ids = [j.get("id") or str(j.get("_id")) for j in employer_jobs]
    
    total_hires = 0
    force_breakdown_raw = {}
    
    if employer_job_ids:
        hires_cursor = db.applications.find({
            "job_id": {"$in": employer_job_ids},
            "status": {"$in": ["selected", "accepted", "completed"]}
        })
        async for app in hires_cursor:
            total_hires += 1
            # Build force breakdown map
            job = next((j for j in employer_jobs if (j.get("id") or str(j.get("_id"))) == app.get("job_id")), None)
            if job:
                cat = job.get("category", "other").capitalize()
                force_breakdown_raw[cat] = force_breakdown_raw.get(cat, 0) + 1
    
    # Pending Payments (Escrow simplified calculate: open jobs default required capital)
    pending_payments = 0
    for job in employer_jobs:
        if job.get("status") in ["open", "active"]:
            expected_escrow = ((job.get("salary_paise", 50000)) * (job.get("team_size", 1))) / 100
            pending_payments += expected_escrow
            
    # Recent Activity Feed
    recent_activity = []
    # 1. Recent Applications
    if employer_job_ids:
        recent_apps = await db.applications.find({"job_id": {"$in": employer_job_ids}}).sort("applied_at", -1).limit(3).to_list(None)
        for app in recent_apps:
            job = next((j for j in employer_jobs if (j.get("id") or str(j.get("_id"))) == app.get("job_id")), None)
            recent_activity.append({
                "id": app.get("id") or str(app.get("_id")),
                "type": "applicant",
                "title": f"New Applicant: #{str(app.get('worker_id'))[:4]}",
                "job": job.get("title") if job else "Unknown Mission",
                "time": getattr(app.get("applied_at"), "isoformat", lambda: str(app.get("applied_at", "")))() if app.get("applied_at") else "Recently",
                "status": "new",
                "original_date": app.get("applied_at", datetime.min)
            })

    # Sort activity
    recent_activity.sort(key=lambda x: x.get("original_date", datetime.min), reverse=True)
    
    # Convert force breakdown to sorted array format for UI
    force_breakdown = []
    colors = ['bg-primary', 'bg-orange-400', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-400']
    for idx, (label, count) in enumerate(force_breakdown_raw.items()):
        force_breakdown.append({
            "label": label,
            "count": count,
            "color": colors[idx % len(colors)]
        })
        
    # AI Tactical Briefing
    ai_insight = "Operational efficiency targets stabilized across active zones."
    if total_hires > 0 or total_jobs_posted > 0:
        try:
            cur_ai_client = get_ai_client()
            if cur_ai_client:
                prompt = f"""
                You are 'Shram Matrix', an AI logistics advisor. 
                The employer currently has {active_hiring} open missions, {total_hires} total deployed personnel, and a pending payroll/escrow balance of ₹{pending_payments}.
                Provide a single, short, tactical, professional piece of strategic advice (max 20 words) for their dashboard. Provide only the quote. Keep it immersive and slightly industrial/sci-fi themed.
                """
                response = cur_ai_client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
                if response and response.text:
                    ai_insight = response.text.strip().replace('"', '')
        except Exception as e:
            pass # Use fallback

    return {
        "status": "success",
        "data": {
            "total_jobs_posted": total_jobs_posted,
            "active_hiring": active_hiring,
            "total_hires": total_hires,
            "pending_payments": pending_payments,
            "attendance_today": 96, # Placeholder for now as check-in logic isn't fully robust
            "force_breakdown": force_breakdown,
            "recent_activity": recent_activity[:4],
            "ai_insight": ai_insight
        }
    }

# Include all sub-routers
api_router.include_router(auth_router)
api_router.include_router(job_router, prefix="/jobs")
api_router.include_router(profile_router)
api_router.include_router(app_router, prefix="/applications")
api_router.include_router(notification_router, prefix="/notifications")
api_router.include_router(payment_api_router)
api_router.include_router(squad_router)
api_router.include_router(earnings_router)
api_router.include_router(chat_router)
api_router.include_router(handshake_router, prefix="/handshake")
api_router.include_router(tracking_router, prefix="/tracking")
api_router.include_router(portfolio_router)
api_router.include_router(verification_router)
api_router.include_router(offer_router)
api_router.include_router(reputation_router)
api_router.include_router(subscription_router)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected to WebSocket")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected from WebSocket")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    user_id = None
    try:
        # Verify token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id") or payload.get("id")
        
        if not user_id:
            logger.warning("WebSocket connection rejected: Invalid token payload")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect(user_id, websocket)
        
        # Keep connection alive and wait for messages
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                if message_data.get("type") == "message":
                    receiver_id = message_data.get("receiver_id")
                    content = message_data.get("content")
                    
                    if receiver_id and content:
                        # Save to DB
                        db = get_db()
                        new_msg = {
                            "id": str(uuid.uuid4()),
                            "sender_id": user_id,
                            "receiver_id": receiver_id,
                            "content": content,
                            "timestamp": datetime.utcnow(),
                            "is_read": False
                        }
                        await db.messages.insert_one(new_msg)
                        
                        # Forward as JSON-safe dict
                        safe_msg = new_msg.copy()
                        safe_msg["timestamp"] = safe_msg["timestamp"].isoformat()
                        
                        # Send to receiver if online
                        await manager.send_personal_message({
                            "type": "new_message",
                            "message": safe_msg
                        }, receiver_id)
                        
                        # Send confirmation to sender
                        await manager.send_personal_message({
                            "type": "message_sent",
                            "message": safe_msg
                        }, user_id)
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON from {user_id}: {data}")
            except Exception as e:
                logger.error(f"Error processing socket message: {str(e)}")
            
    except jwt.ExpiredSignatureError:
        logger.warning(f"WebSocket connection rejected: Token expired")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        if user_id:
            manager.disconnect(user_id)
        # Check if already closed
        try:
            await websocket.close()
        except:
            pass

app.include_router(api_router)

# Mocked db for global access - removed top-level init
db = None

if __name__ == "__main__":
    import uvicorn
    import os
    def _get_port():
        val = os.environ.get("PORT", "8000")
        try: return int(val)
        except: return 8000
    port = _get_port()
    print(f"Starting server on 0.0.0.0:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, access_log=True)

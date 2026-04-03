from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timedelta
import random
from database import get_db
from auth_utils import get_current_user_id

handshake_router = APIRouter(tags=["handshake"])

@handshake_router.post("/generate/{job_id}")
async def generate_handshake(job_id: str, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Verify the user has an accepted application for this job
    application = await db.applications.find_one({
        "job_id": job_id,
        "worker_id": user_id,
        "status": "accepted"
    })
    
    if not application:
        raise HTTPException(status_code=403, detail="No accepted mission found for this job")
    
    # Generate 4-digit code
    code = f"{random.randint(1000, 9999)}"
    
    # Store with 10-minute expiry
    await db.handshakes.update_one(
        {"job_id": job_id, "worker_id": user_id},
        {
            "$set": {
                "code": code,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(minutes=10)
            }
        },
        upsert=True
    )
    
    return {"code": code}

@handshake_router.post("/verify")
async def verify_handshake(payload: dict, request: Request):
    employer_id = await get_current_user_id(request)
    job_id = payload.get("job_id")
    code = payload.get("code")
    
    if not job_id or not code:
        raise HTTPException(status_code=400, detail="job_id and code required")
    
    db = get_db()
    
    # Verify the job belongs to this employer
    job = await db.jobs.find_one({"id": job_id, "employer_id": employer_id})
    if not job:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Find the matching handshake code
    handshake = await db.handshakes.find_one({
        "job_id": job_id,
        "code": code,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not handshake:
        raise HTTPException(status_code=401, detail="Invalid or expired verification code")
    
    worker_id = handshake["worker_id"]
    
    # Update application status to start the mission
    await db.applications.update_one(
        {"job_id": job_id, "worker_id": worker_id},
        {
            "$set": {
                "status": "in_progress",
                "checkin_time": datetime.utcnow()
            }
        }
    )
    
    # Update job status if it's the first hire
    await db.jobs.update_one(
        {"id": job_id, "status": "open"},
        {"$set": {"status": "matched"}}
    )
    
    # Clean up the code
    await db.handshakes.delete_one({"_id": handshake["_id"]})
    
    return {"message": "Verification successful. Worker checked-in.", "worker_id": worker_id}

@handshake_router.get("/status/{job_id}")
async def get_handshake_status(job_id: str, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    app = await db.applications.find_one({
        "job_id": job_id,
        "worker_id": user_id
    })
    
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found")
        
    return {
        "status": app.get("status"),
        "checkin_time": app.get("checkin_time")
    }

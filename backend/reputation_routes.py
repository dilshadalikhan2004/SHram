from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import List, Optional
from database import get_db, mongo_to_dict
from pydantic import BaseModel
from datetime import datetime
import uuid

from auth_utils import get_current_user_id

reputation_router = APIRouter(tags=["reputation"])

class BilateralRatingRequest(BaseModel):
    target_id: str # user_id being rated
    application_id: Optional[str] = None
    score: float # 1-5
    comment: Optional[str] = None

@reputation_router.post("/ratings/bilateral")
async def create_bilateral_rating(request: Request, rating_in: BilateralRatingRequest):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    new_rating = {
        "id": str(uuid.uuid4()),
        "from_id": user_id,
        "target_id": rating_in.target_id,
        "application_id": rating_in.application_id,
        "score": rating_in.score,
        "comment": rating_in.comment,
        "created_at": datetime.utcnow()
    }
    
    await db.bilateral_ratings.insert_one(new_rating)
    
    # Update target's aggregate rating in profile
    # Simple average logic for now
    cursor = db.bilateral_ratings.find({"target_id": rating_in.target_id})
    all_ratings = await cursor.to_list(length=100)
    if all_ratings:
        avg_score = sum(r["score"] for r in all_ratings) / len(all_ratings)
        
        # Determine which profile to update
        from bson import ObjectId
        user = await db.users.find_one({"_id": ObjectId(rating_in.target_id)}) # Fallback logic
        # Update both just in case or check role
        await db.worker_profiles.update_one({"user_id": rating_in.target_id}, {"$set": {"rating": avg_score}})
        
    return new_rating

@reputation_router.get("/ratings/bilateral/{user_id}")
async def get_ratings_for_user(user_id: str):
    db = get_db()
    cursor = db.bilateral_ratings.find({"target_id": user_id}).sort("created_at", -1)
    ratings = await cursor.to_list(length=50)
    return [mongo_to_dict(r) for r in ratings]

@reputation_router.post("/ratings/bilateral/{rating_id}/reply")
async def reply_to_rating(rating_id: str, reply: str = Query(...)):
    db = get_db()
    
    result = await db.bilateral_ratings.update_one(
        {"id": rating_id},
        {"$set": {"reply": reply, "replied_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Rating not found")
        
    return {"status": "success"}

@reputation_router.get("/analytics/employer")
async def get_employer_analytics(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Fetch real stats
    total_spent = 0
    # Add logic here...
    
    return {
        "total_hires": 0,
        "active_escrow": 0,
        "retention_rate": 0,
        "trust_score": 85
    }

@reputation_router.get("/bid-suggestion/{job_id}")
async def get_bid_suggestion(job_id: str):
    # Mock logic for suggestion engine
    return {
        "recommended_paise": 55000,
        "market_avg_paise": 52000,
        "reasoning": "High demand for this category in your area."
    }

@reputation_router.get("/fraud/profile-check/{user_id}")
async def check_profile_fraud(user_id: str):
    return {
        "risk_score": 5, # 0-100
        "flags": [],
        "status": "safe"
    }

class FraudReportRequest(BaseModel):
    target_id: str
    reason: str
    details: Optional[str] = None

@reputation_router.post("/fraud/report")
async def report_fraud(request: Request, report_in: FraudReportRequest):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    new_report = {
        "id": str(uuid.uuid4()),
        "reporter_id": user_id,
        "target_id": report_in.target_id,
        "reason": report_in.reason,
        "details": report_in.details,
        "status": "investigating",
        "reported_at": datetime.utcnow()
    }
    
    await db.fraud_reports.insert_one(new_report)
    return {"status": "reported", "message": "Thank you for keeping ShramSetu safe."}

@reputation_router.post("/fraud/scan-job/{job_id}")
async def scan_job_fraud(job_id: str):
    # Mock scanning
    return {
        "status": "safe",
        "risk_level": "low",
        "flags": []
    }

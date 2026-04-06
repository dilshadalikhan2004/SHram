from fastapi import APIRouter, HTTPException, Depends, Request, Body
from typing import List, Optional
from datetime import datetime
import uuid
import logging
from database import get_db, mongo_to_dict, mongo_list_to_dict
from models import Job, JobCreate

from auth_utils import get_current_user_id
 
from google import genai
import os
import json
import math
from bson import ObjectId

logger = logging.getLogger(__name__)

job_router = APIRouter(tags=["jobs"])

# Configure Modern Gemini Client
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
# Lazy AI Client
_ai_client = None
def get_ai_client():
    global _ai_client
    if _ai_client is None and GEMINI_KEY:
        try:
            from google import genai
            _ai_client = genai.Client(api_key=GEMINI_KEY)
        except Exception as e:
            logger.error(f"Failed to init AI client in job_routes: {e}")
    return _ai_client

@job_router.post("/draft")
async def draft_job_ai(payload: dict = Body(...)):
    user_query = payload.get("query")
    if not user_query:
        raise HTTPException(status_code=400, detail="Query required")
    
    try:
        cur_ai_client = get_ai_client()
        if not cur_ai_client:
             return {"title": "", "description": user_query, "category": "other"}
             
        prompt = f"""
        Extract job details from this description for a worker marketplace: "{user_query}"
        Return ONLY a JSON object with:
        "title", "description", "category" (e.g. construction, plumbing, cleaning, etc), 
        "location", "salary_paise", "salary_type" (daily/fixed), 
        "team_size" (int), "hire_type" (individual/squad), "estimated_duration" (e.g. "3 days").
        If values are missing, provide best guesses or null.
        """
        response = cur_ai_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        # Extract JSON from potential markdown backticks
        clean_text = response.text.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0].strip()
            
        return mongo_to_dict(json.loads(clean_text))
    except Exception as e:
        logger.error(f"Draft AI Error: {str(e)}")
        # Fallback to empty draft
        return {"title": "", "description": user_query, "category": "other"}


@job_router.get("/", response_model=List[dict])
async def list_jobs(
    category: Optional[str] = None,
    min_pay: Optional[int] = None,
    max_pay: Optional[int] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None
):
    db = get_db()
    # Build filter clauses to combine with $and so that the status clause and
    # optional search clause can both use $or without conflicting.
    and_clauses = []

    # Include jobs that are explicitly "open" or that have a missing/null/empty status
    # (legacy records created before the status field was enforced).
    and_clauses.append({"$or": [
        {"status": "open"},
        {"status": {"$exists": False}},
        {"status": None},
        {"status": ""}
    ]})

    # Only filter by category when a real category (not "all" or empty) is provided.
    if category and category.strip().lower() != 'all':
        and_clauses.append({"category": category})

    if min_pay:
        and_clauses.append({"salary_paise": {"$gte": min_pay}})
    if max_pay:
        and_clauses.append({"salary_paise": {"$lte": max_pay}})

    # Only apply urgency filter when the value is exactly "urgent".
    if urgency == 'urgent':
        and_clauses.append({"is_urgent": True})

    # Ignore blank/whitespace-only search strings.
    if search and search.strip():
        and_clauses.append({"$or": [
            {"title": {"$regex": search.strip(), "$options": "i"}},
            {"description": {"$regex": search.strip(), "$options": "i"}},
            {"location": {"$regex": search.strip(), "$options": "i"}}
        ]})

    query = {"$and": and_clauses} if len(and_clauses) > 1 else (and_clauses[0] if and_clauses else {})
    
    # Sort by is_boosted then posted_at
    cursor = db.jobs.find(query).sort([("is_boosted", -1), ("posted_at", -1)])
    jobs = await cursor.to_list(length=100)
    
    # Hydrate with virtual fields
    for job in jobs:
        # Applicant count
        count = await db.applications.count_documents({"job_id": job.get("id") or str(job.get("_id"))})
        job["applicant_count"] = count
        
        # Employer rating integration
        employer = await db.employer_profiles.find_one({"user_id": job.get("employer_id")})
        
        # Calculate real dynamic rating
        reviews_cursor = db.reviews.find({"recipient_id": job.get("employer_id")})
        reviews_list = await reviews_cursor.to_list(length=100)
        
        if reviews_list:
            total_stars = sum(r.get("rating", 0) for r in reviews_list)
            actual_rating = round(total_stars / len(reviews_list), 1)
            job["employer_rating"] = actual_rating
        else:
            job["employer_rating"] = employer.get("rating", 4.5) if employer else 4.5
        
    return mongo_list_to_dict(jobs)

@job_router.post("/", response_model=Job)
async def create_job(job_in: JobCreate, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Verify employer profile
    employer = await db.employer_profiles.find_one({"user_id": user_id})
    if not employer:
        # Auto-create if missing for demo
        employer = {"user_id": user_id, "company_name": "Demo Employer"}
        await db.employer_profiles.insert_one(employer)

    new_job = Job(
        employer_id=user_id,
        **job_in.dict(exclude={"status"})
    )
    new_job.status = "open"
    
    # Calculate estimated escrow (100% of budget for simple demo)
    new_job.escrow_amount_paise = new_job.salary_paise * (new_job.team_size or 1)
    
    await db.jobs.insert_one(new_job.dict())
    return new_job


@job_router.get("/recommended", response_model=List[Job])
async def get_recommended_jobs(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Simple recommendation based on worker profile skills/location
    worker = await db.worker_profiles.find_one({"user_id": user_id})
    if not worker:
        return await list_jobs()
        
    query = {"status": "open"}
    # If worker has skills, boost matching jobs
    # For now, just listing jobs but we can add complexity later
    cursor = db.jobs.find(query).sort([("is_boosted", -1), ("posted_at", -1)])
    jobs = await cursor.to_list(length=20)
    return mongo_list_to_dict(jobs)

@job_router.get("/employer", response_model=List[Job])
async def get_employer_jobs(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    cursor = db.jobs.find({"employer_id": user_id}).sort("posted_at", -1)
    jobs = await cursor.to_list(length=50)
    return mongo_list_to_dict(jobs)

@job_router.get("/my-jobs", response_model=List[Job])
async def get_my_jobs_alias(request: Request):
    """Backward-compatible alias for GET /employer."""
    return await get_employer_jobs(request)

@job_router.get("/match/{job_id}")
async def get_job_match_score(job_id: str, request: Request):
    """Calculates AI match score and analysis between current worker and job."""
    user_id = await get_current_user_id(request)
    db = get_db()
    
    try:
        job_query = {"_id": ObjectId(job_id)}
    except (ValueError, TypeError):
        job_query = {"id": job_id}
        
    job = await db.jobs.find_one(job_query)
    if not job:
        job = await db.jobs.find_one({"id": job_id})
        if not job: # Still not found
             raise HTTPException(status_code=404, detail="Job not found")

    profile = await db.worker_profiles.find_one({"user_id": user_id}) or {}

    score = 0
    skill_match = 0
    exp_match = 0
    distance = None
    matching_skills = []

    # 1. Skill Match (40% weight)
    job_reqs = job.get("requirements", [])
    profile_skills = profile.get("skills", [])
    
    if job_reqs and profile_skills:
        reqs_lower = [str(r).lower() for r in job_reqs]
        skills_lower = [str(s).lower() for s in profile_skills]
        matching_skills = list(set(reqs_lower) & set(skills_lower))
        skill_match = (len(matching_skills) / len(reqs_lower)) * 100 if reqs_lower else 100
        score += skill_match * 0.4
    elif not job_reqs:
        skill_match = 100
        score += 40

    # 2. Experience Match (30% weight)
    profile_exp = profile.get("experience_years", 0)
    if profile_exp >= 2:
        exp_match = 100
    elif profile_exp > 0:
        exp_match = 50
    score += exp_match * 0.3

    # 3. Location Proximity (30% weight)
    job_lat, job_lng = job.get("lat"), job.get("lng")
    prof_lat, prof_lng = profile.get("lat"), profile.get("lng")
    
    if job_lat and prof_lat:
        R = 6371 # km
        dlat = math.radians(job_lat - prof_lat)
        dlng = math.radians(job_lng - prof_lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(prof_lat)) * math.cos(math.radians(job_lat)) * math.sin(dlng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        if distance <= 10:
            score += 30
        elif distance <= 25:
            score += 20
        elif distance <= 50:
            score += 10
    else:
        if profile.get("location") and job.get("location"):
            if profile["location"].lower() in job["location"].lower() or job["location"].lower() in profile["location"].lower():
                score += 30
                distance = 5.0

    if score == 0 and profile:
         score = 45 # baseline for completed profiles with no exact keyword hits

    final_score = min(100, max(12, score))

    # Optional: Use Gemini for tactical brief
    explanation = f"Your signature indicates an {int(final_score)}% operational match."
    if ai_client:
        try:
            prompt = f"Write a 1-sentence tactical mission briefing explanation (e.g. 'Your specialized plumbing skills make you a high-value asset for this operation.') for a worker with {profile_exp} years experience applying for the mission: '{job.get('title')}'. Give no preamble, just the sentence."
            resp = ai_client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt
            )
            explanation = resp.text.strip()
        except Exception as e:
            logger.error(f"Match Briefing AI Error: {e}")

    return {
        "job_id": str(job["_id"]) if "_id" in job else job.get("id"),
        "score": final_score,
        "explanation": explanation,
        "factors": {
            "skill_match": skill_match,
            "experience_match": exp_match,
            "distance_km": distance or 12.5,
            "matching_skills": matching_skills
        }
    }

@job_router.post("/save")
async def save_job(payload: dict, request: Request):
    user_id = await get_current_user_id(request)
    job_id = payload.get("job_id")
    if not job_id:
         raise HTTPException(status_code=400, detail="job_id required")
         
    db = get_db()
    await db.saved_jobs.update_one(
        {"user_id": user_id},
        {"$addToSet": {"job_ids": job_id}},
        upsert=True
    )
    return {"success": True}

@job_router.get("/saved")
async def get_saved_jobs(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    saved = await db.saved_jobs.find_one({"user_id": user_id})
    if not saved or not saved.get("job_ids"):
         return []
         
    cursor = db.jobs.find({"id": {"$in": saved["job_ids"]}})
    jobs = await cursor.to_list(length=100)
    return mongo_list_to_dict(jobs)

@job_router.delete("/save/{job_id}")
async def unsave_job(job_id: str, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    await db.saved_jobs.update_one(
        {"user_id": user_id},
        {"$pull": {"job_ids": job_id}}
    )
    return {"success": True}

@job_router.post("/migrate/fix-status")
async def migrate_fix_job_status(request: Request):
    """Migration endpoint: sets status='open' on any jobs missing a valid status value.
    Requires X-Admin-Secret header matching the ADMIN_SECRET environment variable."""
    admin_secret = os.environ.get("ADMIN_SECRET")
    if not admin_secret:
        raise HTTPException(status_code=503, detail="Admin secret not configured")
    if request.headers.get("X-Admin-Secret") != admin_secret:
        raise HTTPException(status_code=403, detail="Forbidden")
    db = get_db()
    valid_statuses = ["open", "matched", "completed", "cancelled"]
    result = await db.jobs.update_many(
        {"status": {"$nin": valid_statuses}},
        {"$set": {"status": "open"}}
    )
    return {"fixed": result.modified_count}

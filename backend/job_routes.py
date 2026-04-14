from fastapi import APIRouter, HTTPException, Request, Body
from typing import List, Optional
from datetime import datetime
import uuid
import logging
from database import get_db, mongo_to_dict, mongo_list_to_dict
from models import Job, JobCreate
from pydantic import BaseModel

from auth_utils import get_current_user_id

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

class JobStatusUpdate(BaseModel):
    status: str


def get_ai_client():
    global _ai_client
    if _ai_client is None and GEMINI_KEY:
        try:
            from google import genai
            _ai_client = genai.Client(api_key=GEMINI_KEY)
        except Exception as e:
            logger.error(f"Failed to init AI client in job_routes: {e}")
    return _ai_client


def _to_float(value):
    """Best-effort conversion to float, returning None for invalid values."""
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


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
            clean_text = clean_text.split("```json")[1].split("```\n")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```\n")[1].split("```\n")[0].strip()

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


@job_router.get("/recommended")
async def get_recommended_jobs(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()

    # Simple recommendation based on worker profile skills/location
    worker = await db.worker_profiles.find_one({"user_id": user_id})
    if not worker:
        return await list_jobs()

    query = {"status": "open"}
    cursor = db.jobs.find(query).sort([("is_boosted", -1), ("posted_at", -1)])
    jobs = await cursor.to_list(length=20)
    return mongo_list_to_dict(jobs)


@job_router.get("/employer")
async def get_employer_jobs(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    cursor = db.jobs.find({"employer_id": user_id}).sort("posted_at", -1)
    jobs = await cursor.to_list(length=50)
    return mongo_list_to_dict(jobs)


@job_router.get("/my-jobs")
async def get_my_jobs_alias(request: Request):
    """Backward-compatible alias for GET /employer."""
    return await get_employer_jobs(request)


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


@job_router.delete("/save/{job_id}")
async def unsave_job(job_id: str, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    await db.saved_jobs.update_one(
        {"user_id": user_id},
        {"$pull": {"job_ids": job_id}}
    )
    return {"success": True}


@job_router.get("/{job_id}")
async def get_job_detail(job_id: str, request: Request):
    """Fetches a single job by its business ID or MongoDB ObjectId."""
    db = get_db()
    
    # Try business ID first (UUID string)
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        # Try MongoDB ObjectId if it's a valid hex string
        try:
            job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        except Exception:
            pass
            
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return mongo_to_dict(job)


@job_router.patch("/{job_id}/status")
async def update_job_status(job_id: str, payload: JobStatusUpdate, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()

    job = await db.jobs.find_one({"id": job_id, "employer_id": user_id})
    if not job:
        raise HTTPException(status_code=403, detail="Forbidden")

    allowed = {"open", "matched", "completed", "cancelled", "closed"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")

    await db.jobs.update_one({"id": job_id}, {"$set": {"status": payload.status}})
    return {"success": True, "status": payload.status}


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
        # Fallback to secondary ID field search
        job = await db.jobs.find_one({"id": job_id})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

    profile = await db.worker_profiles.find_one({"user_id": user_id}) or {}

    def normalize_text(val):
        return str(val or '').strip().lower()

    def to_skill_list(value):
        if not value:
            return []
        if isinstance(value, list):
            items = []
            for v in value:
                if isinstance(v, dict):
                    v = v.get('name') or v.get('label') or v.get('value')
                if isinstance(v, str):
                    items.extend([s.strip().lower() for s in v.split(',') if s.strip()])
            return items
        if isinstance(value, str):
            return [s.strip().lower() for s in value.split(',') if s.strip()]
        return []

    score = 0
    skill_match = 0
    exp_match = 0
    distance = None
    matching_skills = []

    # 1. Skill Match (40% weight)
    job_reqs = to_skill_list(job.get("requirements", []))
    job_reqs += to_skill_list(job.get("skills_required", []))
    job_reqs += to_skill_list(job.get("skill_tags", []))
    
    # If no explicit requirements, treat category as a requirement
    if not job_reqs and job.get("category"):
        job_reqs.append(normalize_text(job.get("category")))

    profile_skills = to_skill_list(profile.get("skills", []))
    worker_category = normalize_text(profile.get("category"))
    
    # Add category to profile skills if present
    if worker_category and worker_category not in profile_skills:
        profile_skills.append(worker_category)

    if job_reqs and profile_skills:
        job_req_set = set(job_reqs)
        for req in job_req_set:
            for sk in profile_skills:
                if sk == req or sk in req or req in sk:
                    matching_skills.append(req)
                    break
        skill_match = (len(set(matching_skills)) / len(job_req_set)) * 100 if job_req_set else 100
        score += skill_match * 0.4
    elif not job_reqs and profile_skills:
        # No job requirements but profile has skills: Baseline match
        skill_match = 50
        score += 20

    # 2. Experience Match (30% weight)
    profile_exp_value = _to_float(profile.get("experience_years"))
    profile_exp = profile_exp_value if profile_exp_value is not None else 0
    job_exp_req = _to_float(job.get("experience_required")) or 0
    
    if profile_exp >= job_exp_req:
        exp_match = 100
    elif profile_exp > 0:
        exp_match = (profile_exp / job_exp_req * 100) if job_exp_req > 0 else 50
    score += exp_match * 0.3

    # 2b. Trade/Category Match Bonus (Additional 20% weight equivalent)
    job_cat = normalize_text(job.get("category"))
    job_title = normalize_text(job.get("title"))
    if worker_category and (worker_category == job_cat or worker_category in job_title or job_cat in job_title):
        score += 20
    elif worker_category and any(sk in job_title for sk in profile_skills):
        score += 15

    # 3. Location Proximity (20% weight)
    job_lat, job_lng = _to_float(job.get("lat")), _to_float(job.get("lng"))
    prof_lat, prof_lng = _to_float(profile.get("lat")), _to_float(profile.get("lng"))

    location_score = 0
    if job_lat is not None and job_lng is not None and prof_lat is not None and prof_lng is not None:
        R = 6371  # km
        dlat = math.radians(job_lat - prof_lat)
        dlng = math.radians(job_lng - prof_lng)
        a = (math.sin(dlat / 2) ** 2 + 
             math.cos(math.radians(prof_lat)) * math.cos(math.radians(job_lat)) * 
             math.sin(dlng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        if distance <= 5: location_score = 100
        elif distance <= 15: location_score = 75
        elif distance <= 30: location_score = 50
        elif distance <= 50: location_score = 25
    else:
        # Fallback to string matching
        job_loc = normalize_text(job.get("location"))
        prof_loc = normalize_text(profile.get("location"))
        if job_loc and prof_loc:
            if job_loc in prof_loc or prof_loc in job_loc:
                location_score = 80
                distance = 10.0
    
    score += location_score * 0.1

    # Apply sanity bounds
    final_score = min(99, max(15, score))
    
    # If it's a perfect category match but no specific skills matched, ensure it's respectable
    if worker_category == job_cat and final_score < 60:
        final_score = 65

    # AI Briefing
    explanation = f"Operational match confirmed at {int(final_score)}% via technical alignment."
    ai_client = get_ai_client()
    if ai_client:
        try:
            prompt = f"Write a 1-sentence tactical briefing for a worker with {profile_skills or 'general labor'} skills and {profile_exp} years experience applying to a '{job.get('title')}' job. Be professional, direct, and mention their specific trade if it matches. No preamble."
            resp = ai_client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
            explanation = resp.text.strip()
        except Exception: pass

    return {
        "job_id": str(job["_id"]) if "_id" in job else job.get("id"),
        "score": round(final_score, 1),
        "explanation": explanation,
        "factors": {
            "skill_match": round(skill_match, 1),
            "experience_match": round(exp_match, 1),
            "location_match": round(location_score, 1),
            "distance_km": round(distance, 1) if distance is not None else None,
            "matching_skills": matching_skills
        }
    }



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

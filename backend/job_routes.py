from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime
import uuid
from database import get_db
from models import Job, JobCreate

from auth_utils import get_current_user_id
 
import google.generativeai as genai
import os
import json

job_router = APIRouter(tags=["jobs"])

# Configure Gemini for Job Drafting
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

@job_router.post("/draft")
async def draft_job_ai(payload: dict):
    user_query = payload.get("query")
    if not user_query:
        raise HTTPException(status_code=400, detail="Query required")
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        Extract job details from this description for a worker marketplace: "{user_query}"
        Return ONLY a JSON object with:
        "title", "description", "category" (e.g. construction, plumbing, cleaning, etc), 
        "location", "salary_paise", "salary_type" (daily/fixed), 
        "team_size" (int), "hire_type" (individual/squad), "estimated_duration" (e.g. "3 days").
        If values are missing, provide best guesses or null.
        """
        response = model.generate_content(prompt)
        # Extract JSON from potential markdown backticks
        clean_text = response.text.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0].strip()
            
        return json.loads(clean_text)
    except Exception as e:
        print(f"Draft AI Error: {str(e)}")
        # Fallback to empty draft
        return {"title": "", "description": user_query, "category": "other"}


@job_router.get("/", response_model=List[Job])
async def list_jobs(category: Optional[str] = None):
    db = get_db()
    query = {"status": "open"}
    if category and category != 'all':
        query["category"] = category
    
    # Sort by is_boosted then posted_at
    cursor = db.jobs.find(query).sort([("is_boosted", -1), ("posted_at", -1)])
    jobs = await cursor.to_list(length=100)
    return jobs

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
        **job_in.dict()
    )
    
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
    return jobs

@job_router.get("/employer", response_model=List[Job])
async def get_employer_jobs(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    cursor = db.jobs.find({"employer_id": user_id}).sort("posted_at", -1)
    jobs = await cursor.to_list(length=50)
    return jobs

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
    return jobs

@job_router.delete("/save/{job_id}")
async def unsave_job(job_id: str, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    await db.saved_jobs.update_one(
        {"user_id": user_id},
        {"$pull": {"job_ids": job_id}}
    )
    return {"success": True}

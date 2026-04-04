from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime
import uuid
from database import get_db, mongo_to_dict, mongo_list_to_dict
from models import Application, ApplicationUpdate

from auth_utils import get_current_user_id
from notification_routes import send_user_notification
 
app_router = APIRouter(tags=["applications"])

@app_router.post("/")
async def create_application(payload: dict, request: Request):
    user_id = await get_current_user_id(request)
    job_id = payload.get("job_id")
    if not job_id:
         raise HTTPException(status_code=400, detail="job_id required")
         
    db = get_db()
    # Check if already applied
    existing = await db.applications.find_one({"job_id": job_id, "worker_id": user_id})
    if existing:
         raise HTTPException(status_code=400, detail="Already applied")
         
    # Fetch job and worker profile for AI Matching
    job = await db.jobs.find_one({"id": job_id})
    worker = await db.worker_profiles.find_one({"user_id": user_id})
    
    match_score = 0.5 # Default
    ai_insights = "Manual review recommended."
    
    # --- AI MATCHING: Gemini Fit Analysis ---
    if job and worker:
        try:
            from google import genai
            import os
            import json
            
            GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
            if GEMINI_KEY:
                client = genai.Client(api_key=GEMINI_KEY)
                
                prompt = f"""
                Compare this Worker Profile with the Job Description.
                Worker: {worker.get('skills', [])}, Experience: {worker.get('experience_years')}yr, Bio: {worker.get('bio')}
                Job: {job.get('title')}, Description: {job.get('description')}, Requirements: {job.get('requirements', [])}
                
                Return ONLY a JSON object with:
                "score": 0.0 to 1.0 (float reflecting fit),
                "insight": "One concise sentence explaining why they match or what they miss."
                """
                
                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=prompt
                )
                clean_text = response.text.strip()
                if "```json" in clean_text:
                    clean_text = clean_text.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_text:
                    clean_text = clean_text.split("```")[1].split("```")[0].strip()
                
                ai_data = json.loads(clean_text)
                match_score = ai_data.get("score", 0.5)
                ai_insights = ai_data.get("insight", ai_insights)
        except Exception as e:
            print(f"AI Matching Error: {str(e)}")

    new_app = Application(
        job_id=job_id,
        worker_id=user_id,
        match_score=match_score,
        ai_insights=ai_insights,
        bid_amount_paise=payload.get("bid_amount_paise"),
        proposal_message=payload.get("proposal_message"),
        counter_offer_paise=payload.get("counter_offer_paise") or payload.get("bid_amount_paise"),
        offer_status="countered" if payload.get("bid_amount_paise") or payload.get("counter_offer_paise") else "pending",
        quick_apply=payload.get("quick_apply", False)
    )
    
    await db.applications.insert_one(new_app.dict())
    
    # --- NOTIFICATION: Tell employer about new applicant ---
    if job:
        await send_user_notification(
            user_id=job["employer_id"],
            title="Mission Transmission Detected",
            message=f"A new candidate has applied for '{job['title']}'. AI Match: {int(match_score*100)}%.",
            action_url=f"/employer/dashboard"
        )
        
    return new_app

@app_router.post("/{app_id}/counter")
async def submit_counter_offer(app_id: str, payload: dict, request: Request):
    user_id = await get_current_user_id(request)
    amount_paise = payload.get("amount_paise")
    if not amount_paise:
        raise HTTPException(status_code=400, detail="amount_paise required")
    
    db = get_db()
    # Ensure this is the worker
    await db.applications.update_one(
        {"id": app_id, "worker_id": user_id},
        {"$set": {"counter_offer_paise": amount_paise, "offer_status": "countered"}}
    )
    return {"success": True}

@app_router.get("/worker", response_model=List[dict])
async def get_worker_applications(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    cursor = db.applications.find({"worker_id": user_id}).sort("applied_at", -1)
    apps = await cursor.to_list(length=100)
    
    # Hydrate with job titles
    for app in apps:
        job = await db.jobs.find_one({"id": app["job_id"]})
        if job:
            app["job"] = job
            
    return mongo_list_to_dict(apps)

@app_router.get("/job/{job_id}", response_model=List[dict])
async def get_job_applications(job_id: str, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Verify employer
    job = await db.jobs.find_one({"id": job_id, "employer_id": user_id})
    if not job:
         raise HTTPException(status_code=403, detail="Forbidden")
         
    cursor = db.applications.find({"job_id": job_id})
    apps = await cursor.to_list(length=100)
    
    # Hydrate with worker profile info
    for app in apps:
        profile = await db.worker_profiles.find_one({"user_id": app["worker_id"]})
        if profile:
            app["worker_profile"] = profile
            
    return mongo_list_to_dict(apps)

@app_router.get("/employer", response_model=List[dict])
async def get_employer_applications(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Get all jobs for this employer
    employer_jobs_cursor = db.jobs.find({"employer_id": user_id})
    employer_jobs = await employer_jobs_cursor.to_list(length=None)
    job_ids = [job["id"] for job in employer_jobs]
    
    if not job_ids:
        return []

    # Get all applications for those jobs
    cursor = db.applications.find({"job_id": {"$in": job_ids}}).sort("applied_at", -1)
    apps = await cursor.to_list(length=100)
    
    # Hydrate applications with worker details and job references
    for app in apps:
        profile = await db.worker_profiles.find_one({"user_id": app["worker_id"]})
        if profile:
            app["worker_profile"] = profile
        job = next((j for j in employer_jobs if j["id"] == app["job_id"]), None)
        if job:
            app["job"] = job

    return apps

@app_router.patch("/{app_id}/status")
async def update_application_status(app_id: str, update: ApplicationUpdate, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Find application
    app = await db.applications.find_one({"id": app_id})
    if not app:
         raise HTTPException(status_code=404, detail="Application not found")
         
    # Verify employer of the job
    job = await db.jobs.find_one({"id": app["job_id"]})
    if not job or job["employer_id"] != user_id:
         raise HTTPException(status_code=403, detail="Forbidden")
         
    await db.applications.update_one(
        {"id": app_id},
        {"$set": {"status": update.status}}
    )

    # --- NOTIFICATION: Tell worker about status update ---
    status_msg_map = {
        "shortlisted": "Great news! You have been shortlisted for",
        "selected": "Congratulations! You have been selected for",
        "rejected": "Update on your application for"
    }
    
    await send_user_notification(
        user_id=app["worker_id"],
        title=f"Application {update.status.capitalize()}",
        message=f"{status_msg_map.get(update.status, 'Update on')} '{job['title']}'. Check details now!",
        action_url="/worker/dashboard"
    )
    
    return {"status": update.status}


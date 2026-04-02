from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime
import uuid
from database import get_db
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
         
    new_app = Application(
        job_id=job_id,
        worker_id=user_id,
        quick_apply=payload.get("quick_apply", False)
    )
    
    await db.applications.insert_one(new_app.dict())
    
    # --- NOTIFICATION: Tell employer about new applicant ---
    job = await db.jobs.find_one({"id": job_id})
    if job:
        await send_user_notification(
            user_id=job["employer_id"],
            title="New Job Application",
            message=f"Someone just applied for '{job['title']}'. Review their profile now!",
            action_url=f"/employer/jobs/{job_id}"
        )
        
    return new_app

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
            
    return apps

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
            
    return apps

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


from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
from database import get_db
from auth_utils import get_current_user_id

tracking_router = APIRouter(tags=["tracking"])

@tracking_router.post("/location")
async def update_location(payload: dict, request: Request):
    user_id = await get_current_user_id(request)
    job_id = payload.get("job_id")
    lat = payload.get("lat")
    lng = payload.get("lng")
    
    if not job_id or lat is None or lng is None:
        raise HTTPException(status_code=400, detail="job_id, lat, and lng required")
    
    db = get_db()
    
    # Store the location update
    update = {
        "job_id": job_id,
        "worker_id": user_id,
        "location": {"type": "Point", "coordinates": [lng, lat]},
        "timestamp": datetime.utcnow()
    }
    
    await db.tracking.insert_one(update)
    
    # Update the application's current position for quick access
    await db.applications.update_one(
        {"job_id": job_id, "worker_id": user_id},
        {"$set": {"last_location": [lng, lat]}}
    )
    
    return {"success": True}

@tracking_router.post("/progress")
async def update_progress(payload: dict, request: Request):
    user_id = await get_current_user_id(request)
    job_id = payload.get("job_id")
    percentage = payload.get("percentage") # 0-100
    description = payload.get("description", "")
    
    if not job_id or percentage is None:
        raise HTTPException(status_code=400, detail="job_id and percentage required")
        
    db = get_db()
    
    # Store the progress update
    update = {
        "type": "progress",
        "description": description,
        "percentage": percentage,
        "timestamp": datetime.utcnow()
    }
    
    await db.applications.update_one(
        {"job_id": job_id, "worker_id": user_id},
        {
            "$set": {"current_progress": percentage},
            "$push": {"progress_updates": update}
        }
    )
    
    return {"success": True}

@tracking_router.get("/status/{job_id}")
async def get_mission_status(job_id: str, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # If the requester is the employer, show all workers. If worker, show only theirs.
    is_employer = await db.jobs.find_one({"id": job_id, "employer_id": user_id})
    
    if is_employer:
        cursor = db.applications.find({"job_id": job_id, "status": "in_progress"})
        workers = []
        async for app in cursor:
            worker = await db.worker_profiles.find_one({"user_id": app["worker_id"]})
            workers.append({
                "worker_id": app["worker_id"],
                "name": worker["full_name"] if worker else "Unknown",
                "progress": app.get("current_progress", 0),
                "last_location": app.get("last_location"),
                "status": app["status"]
            })
        return {"workers": workers}
    else:
        app = await db.applications.find_one({"job_id": job_id, "worker_id": user_id})
        if not app:
            raise HTTPException(status_code=404, detail="Mission not found")
        return {
            "progress": app.get("current_progress", 0),
            "status": app["status"],
            "updates": app.get("progress_updates", [])
        }

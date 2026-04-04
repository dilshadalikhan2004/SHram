from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import Optional
from database import get_db, mongo_to_dict
from models import WorkerProfile, EmployerProfile
from pydantic import BaseModel
from datetime import datetime

from auth_utils import get_current_user_id
 
profile_router = APIRouter(tags=["profiles"])

class OnboardingUpdate(BaseModel):
    step: str
    data: dict

@profile_router.patch("/worker/profile/onboarding-progress")
async def update_worker_onboarding_progress(request: Request, update: OnboardingUpdate):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    update_data = update.data.copy()
    update_data["onboarding_step"] = update.step
    
    if update.step == "done":
        update_data["onboarding_completed"] = True
        update_data["verified"] = True
        
    await db.worker_profiles.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )

    if update.step == "done":
        from bson import ObjectId
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"onboarding_completed": True}}
        )
    
    return {"status": "success", "step": update.step}

@profile_router.patch("/employer/profile/onboarding-progress")
async def update_employer_onboarding_progress(request: Request, update: OnboardingUpdate):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    update_data = update.data.copy()
    update_data["onboarding_step"] = update.step
    
    if update.step == "done":
        update_data["onboarding_completed"] = True
        
    await db.employer_profiles.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )

    if update.step == "done":
        from bson import ObjectId
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"onboarding_completed": True}}
        )
    
    return {"status": "success", "step": update.step}


@profile_router.get("/worker/profile", response_model=WorkerProfile)
async def get_worker_profile(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    profile = await db.worker_profiles.find_one({"user_id": user_id})
    
    if not profile:
        # Check if user exists – if so, they might just be missing the profile document
        from bson import ObjectId
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            # Create a basic profile document so the dashboard doesn't hang
            new_profile = {
                "user_id": user_id,
                "full_name": user.get("full_name") or user.get("phone") or "New Worker",
                "phone": user.get("phone"),
                "onboarding_completed": user.get("onboarding_completed", False),
                "created_at": datetime.utcnow()
            }
            await db.worker_profiles.insert_one(new_profile)
            return mongo_to_dict(new_profile)
        raise HTTPException(status_code=404, detail="Profile not found")
        
    return mongo_to_dict(profile)

@profile_router.get("/worker/profile/{target_user_id}")
async def get_public_worker_profile(target_user_id: str):
    db = get_db()
    profile = await db.worker_profiles.find_one({"user_id": target_user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return mongo_to_dict(profile)

@profile_router.post("/worker/profile", response_model=WorkerProfile)
async def update_worker_profile(profile_in: WorkerProfile, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    # Ensure user_id matches
    if profile_in.user_id != user_id:
         raise HTTPException(status_code=403, detail="Forbidden")
         
    await db.worker_profiles.update_one(
        {"user_id": user_id},
        {"$set": profile_in.dict()},
        upsert=True
    )
    return profile_in

class StatusUpdate(BaseModel):
    is_online: bool

@profile_router.patch("/worker/status")
async def update_worker_status(request: Request, status_data: StatusUpdate):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    await db.worker_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"status": "online" if status_data.is_online else "offline", "is_online": status_data.is_online}},
        upsert=True
    )
    return {"status": "online" if status_data.is_online else "offline", "is_online": status_data.is_online}

@profile_router.get("/employer/profile", response_model=EmployerProfile)
async def get_employer_profile(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    profile = await db.employer_profiles.find_one({"user_id": user_id})
    if not profile:
         raise HTTPException(status_code=404, detail="Profile not found")
    return mongo_to_dict(profile)

@profile_router.post("/employer/profile", response_model=EmployerProfile)
async def update_employer_profile(profile_in: EmployerProfile, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    # Ensure user_id matches
    if profile_in.user_id != user_id:
         raise HTTPException(status_code=403, detail="Forbidden")
         
    await db.employer_profiles.update_one(
        {"user_id": user_id},
        {"$set": profile_in.dict()},
        upsert=True
    )
    return profile_in

@profile_router.post("/worker/track-view")
async def track_profile_view(payload: dict, request: Request):
    viewer_id = await get_current_user_id(request)
    target_id = payload.get("target_id")
    if not target_id:
        raise HTTPException(status_code=400, detail="target_id required")
    
    db = get_db()
    
    # Don't track self-views
    if viewer_id == target_id:
        return {"success": True, "note": "Self-view ignored"}
        
    from models import ProfileView
    import models # To get the viewer role from user object if needed, or just assume role
    
    # We can fetch the viewer's role from the users collection if needed, 
    # but for simplicity we'll just record the view.
    new_view = ProfileView(
        viewer_id=viewer_id,
        target_id=target_id,
        viewer_role="employer" # In most cases it's an employer
    )
    
    await db.profile_views.insert_one(new_view.dict())
    
    # Optional: Send notification to worker
    from notification_routes import send_user_notification
    worker = await db.worker_profiles.find_one({"user_id": target_id})
    if worker:
        await send_user_notification(
            user_id=target_id,
            title="Profile Viewed",
            message="An employer has just viewed your profile.",
            action_url="/worker/dashboard"
        )
        
    return {"success": True}

@profile_router.get("/worker/stats")
async def get_worker_stats(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    view_count = await db.profile_views.count_documents({"target_id": user_id})
    # Could add more stats here (earnings, ratings, etc.)
    return {"profile_views": view_count}

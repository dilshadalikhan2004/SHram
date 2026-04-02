from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import Optional
from database import get_db
from models import WorkerProfile, EmployerProfile
from pydantic import BaseModel

from auth_utils import get_current_user_id
 
profile_router = APIRouter(tags=["profiles"])

@profile_router.get("/worker/profile", response_model=WorkerProfile)
async def get_worker_profile(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    profile = await db.worker_profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

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
    return profile

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


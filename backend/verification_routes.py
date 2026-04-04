from fastapi import APIRouter, HTTPException, Depends, Request
from database import get_db, mongo_to_dict
from models import KYCStatus, eshramStatus
from pydantic import BaseModel
from datetime import datetime
import uuid

from auth_utils import get_current_user_id

verification_router = APIRouter(tags=["verification"])

class KYCRequest(BaseModel):
    document_type: str # "aadhar", "pan", "voter_id"
    document_number: str

@verification_router.post("/kyc/initiate")
async def initiate_kyc(request: Request, kyc_in: KYCRequest):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Simulate verification logic
    status = "verified" # Mock for now
    
    new_status = {
        "user_id": user_id,
        "status": status,
        "document_type": kyc_in.document_type,
        "document_number": kyc_in.document_number,
        "verified_at": datetime.utcnow()
    }
    
    await db.kyc_status.update_one(
        {"user_id": user_id},
        {"$set": new_status},
        upsert=True
    )
    
    # Also update worker_profile verified status
    await db.worker_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"verified": True}}
    )
    
    return new_status

class KYCVerifyRequest(BaseModel):
    otp: str

@verification_router.post("/kyc/verify")
async def verify_kyc(request: Request, verify_in: KYCVerifyRequest):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Simple mock: if OTP is '123456', verify. Else mock it anyway.
    await db.kyc_status.update_one(
        {"user_id": user_id},
        {"$set": {"status": "verified", "verified_at": datetime.utcnow()}},
        upsert=True
    )
    
    # Also update worker_profile verified status
    await db.worker_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"verified": True}}
    )
    
    return {"status": "verified", "message": "KYC Approved"}

@verification_router.get("/kyc/status", response_model=KYCStatus)
async def get_kyc_status(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    status = await db.kyc_status.find_one({"user_id": user_id})
    if not status:
        return {"user_id": user_id, "status": "pending"}
    return mongo_to_dict(status)

class eshramLinkRequest(BaseModel):
    uans: str

@verification_router.post("/eshram/link")
async def link_eshram(request: Request, link_in: eshramLinkRequest):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    new_status = {
        "user_id": user_id,
        "is_linked": True,
        "uans": link_in.uans,
        "linked_at": datetime.utcnow()
    }
    
    await db.eshram_status.update_one(
        {"user_id": user_id},
        {"$set": new_status},
        upsert=True
    )
    
    return new_status

@verification_router.get("/eshram/status", response_model=eshramStatus)
async def get_eshram_status(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    status = await db.eshram_status.find_one({"user_id": user_id})
    if not status:
        return {"user_id": user_id, "is_linked": False}
    return mongo_to_dict(status)

from fastapi import APIRouter, Request, HTTPException
from database import get_db, mongo_to_dict
from models import KYCStatus, eshramStatus
from pydantic import BaseModel
from datetime import datetime

from auth_utils import get_current_user_id

verification_router = APIRouter(tags=["verification"])


class KYCRequest(BaseModel):
    document_type: str  # "aadhar", "pan", "voter_id"
    document_number: str
    document_photo_url: str | None = None


@verification_router.post("/kyc/initiate")
async def initiate_kyc(request: Request, kyc_in: KYCRequest):
    user_id = await get_current_user_id(request)
    db = get_db()

    # In Bootstrap mode, KYC starts as "pending" for manual review
    status = "pending"

    new_status = {
        "user_id": user_id,
        "status": status,
        "document_type": kyc_in.document_type,
        "document_number": kyc_in.document_number,
        "document_photo_url": kyc_in.document_photo_url,
        "submitted_at": datetime.utcnow()
    }

    await db.kyc_status.update_one(
        {"user_id": user_id},
        {"$set": new_status},
        upsert=True
    )

    # In Bootstrap mode, we don't auto-verify
    await db.worker_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"verified": False}}
    )

    return new_status


# --- ADMIN BOOTSTRAP ROUTES ---
# These use a shared secret for manual verification without a full admin panel

@verification_router.post("/admin/kyc/approve/{target_user_id}")
async def admin_approve_kyc(target_user_id: str, request: Request):
    # Verify Admin Secret
    admin_secret = request.headers.get("X-Admin-Secret")
    if not admin_secret or admin_secret != "shramsetu_bootstrap_2026": # Use env var in real prod
        raise HTTPException(status_code=401, detail="Unauthorized Admin Access")

    db = get_db()
    
    # Update KYC Status
    await db.kyc_status.update_one(
        {"user_id": target_user_id},
        {"$set": {"status": "verified", "verified_at": datetime.utcnow()}}
    )

    # Mark Worker as Verified
    await db.worker_profiles.update_one(
        {"user_id": target_user_id},
        {"$set": {"verified": True}}
    )

    return {"status": "success", "message": f"User {target_user_id} verified manually"}


@verification_router.post("/admin/kyc/reject/{target_user_id}")
async def admin_reject_kyc(target_user_id: str, request: Request, payload: dict):
    admin_secret = request.headers.get("X-Admin-Secret")
    if not admin_secret or admin_secret != "shramsetu_bootstrap_2026":
        raise HTTPException(status_code=401, detail="Unauthorized Admin Access")

    db = get_db()
    reason = payload.get("reason", "Incomplete or incorrect documentation")
    
    await db.kyc_status.update_one(
        {"user_id": target_user_id},
        {"$set": {"status": "rejected", "rejection_reason": reason, "rejected_at": datetime.utcnow()}}
    )

    return {"status": "success", "message": f"KYC for {target_user_id} rejected"}


@verification_router.post("/admin/user/toggle-suspend/{target_user_id}")
async def admin_toggle_suspend(target_user_id: str, request: Request):
    admin_secret = request.headers.get("X-Admin-Secret")
    if not admin_secret or admin_secret != "shramsetu_bootstrap_2026":
        raise HTTPException(status_code=401, detail="Unauthorized Admin Access")

    from bson import ObjectId
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(target_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("is_suspended", False)
    await db.users.update_one(
        {"_id": ObjectId(target_user_id)},
        {"$set": {"is_suspended": new_status}}
    )

    return {"status": "success", "is_suspended": new_status}


@verification_router.get("/admin/kyc/pending")
async def admin_list_pending_kyc(request: Request):
    admin_secret = request.headers.get("X-Admin-Secret")
    if not admin_secret or admin_secret != "shramsetu_bootstrap_2026":
        raise HTTPException(status_code=401, detail="Unauthorized Admin Access")

    db = get_db()
    # Join with users to get names/phone for the list
    cursor = db.kyc_status.find({"status": "pending"})
    pending_list = await cursor.to_list(100)
    
    results = []
    from bson import ObjectId
    for item in pending_list:
        user = await db.users.find_one({"_id": ObjectId(item["user_id"])})
        if user:
            item["full_name"] = user.get("full_name", "Unknown")
            item["phone"] = user.get("phone", "")
        results.append(mongo_to_dict(item))
        
    return results


@verification_router.get("/admin/users-list")
async def admin_list_all_users(request: Request, role: str = None):
    admin_secret = request.headers.get("X-Admin-Secret")
    if not admin_secret or admin_secret != "shramsetu_bootstrap_2026":
        raise HTTPException(status_code=401, detail="Unauthorized Admin Access")

    db = get_db()
    query = {}
    if role:
        query["role"] = role
        
    cursor = db.users.find(query).sort("created_at", -1)
    users = await cursor.to_list(100)
    return mongo_to_dict(users)


@verification_router.get("/admin/stats")
async def admin_get_stats(request: Request):
    admin_secret = request.headers.get("X-Admin-Secret")
    if not admin_secret or admin_secret != "shramsetu_bootstrap_2026":
        raise HTTPException(status_code=401, detail="Unauthorized Admin Access")

    db = get_db()
    total_users = await db.users.count_documents({})
    workers = await db.users.count_documents({"role": "worker"})
    employers = await db.users.count_documents({"role": "employer"})
    
    pending_kyc = await db.kyc_status.count_documents({"status": "pending"})
    verified_kyc = await db.kyc_status.count_documents({"status": "verified"})
    
    total_jobs = await db.jobs.count_documents({})
    active_jobs = await db.jobs.count_documents({"status": "open"})
    
    return {
        "users": {
            "total": total_users,
            "workers": workers,
            "employers": employers,
            "suspended": await db.users.count_documents({"is_suspended": True})
        },
        "kyc": {
            "pending": pending_kyc,
            "verified": verified_kyc
        },
        "jobs": {
            "total": total_jobs,
            "active": active_jobs
        },
        "timestamp": datetime.utcnow()
    }


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

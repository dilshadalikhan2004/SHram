from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import uuid
import os

from payment_utils import calculate_escrow_breakdown, auto_release_at
from escrow_models import EscrowAccount, CreateEscrowRequest, TargetEscrowRelease, NoShowConfirmRequest

payment_api_router = APIRouter(prefix="/payment", tags=["payment"])

from auth_utils import get_current_user_id

@payment_api_router.get("/escrow/{job_id}")
async def get_escrow(job_id: str, request: Request):
    from server import db
    escrow = await db.escrows.find_one({"job_id": job_id})
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    return escrow

@payment_api_router.post("/escrow/create")
async def create_escrow(req: CreateEscrowRequest, request: Request):
    user_id = await get_current_user_id(request)
    db = request.app.state.db if hasattr(request.app.state, 'db') else None # Will be mocked/injected in server.py
    if not db:
        # Fallback to importing server.db if needed
        from server import db
    
    # Verify employer
    job = await db.jobs.find_one({"id": req.jobId})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # In ShramSetu, employer_id might be the user_id or linked to it.
    if job.get("employer_id") != user_id and job.get("posted_by") != user_id:
         raise HTTPException(status_code=403, detail="Forbidden: You are not the employer")
         
    breakdown = calculate_escrow_breakdown(req.grossAmountPaise)
    
    existing = await db.escrows.find_one({"job_id": req.jobId})
    if existing:
        return {"escrow": existing, "razorpayOrderId": existing.get("razorpay_order_id", "mock_order_id_123")}
        
    # MOCK RAZORPAY ORDER
    mock_order_id = f"order_{uuid.uuid4().hex[:10]}"
    
    new_escrow = EscrowAccount(
        job_id=req.jobId,
        employer_id=user_id,
        amount_paise=breakdown["gross_amount_paise"],
        platform_fee_paise=breakdown["platform_fee_paise"],
        net_to_worker_paise=breakdown["net_to_worker_paise"],
        status="ESCROWED",  # Set to ESCROWED immediately for mock/manual securing
        razorpay_order_id=mock_order_id,
        deposited_at=datetime.utcnow()
    )
    
    await db.escrows.insert_one(new_escrow.dict())
    
    return {"escrow": new_escrow.dict(), "razorpayOrderId": mock_order_id}


@payment_api_router.post("/escrow/request-release")
async def request_release(req: NoShowConfirmRequest, request: Request):
    user_id = await get_current_user_id(request)
    from server import db
    
    # Verify worker
    job = await db.jobs.find_one({"id": req.jobId})
    if not job:
         raise HTTPException(status_code=404, detail="Job not found")
         
    worker_profile = await db.worker_profiles.find_one({"user_id": user_id})
    worker_id = worker_profile.get("id") if worker_profile else user_id
    
    # Check if the user is the assigned worker
    is_worker = False
    if str(job.get("worker_id")) == str(worker_id): is_worker = True
    if str(job.get("assigned_worker")) == str(worker_id): is_worker = True
    
    # Fallback to selected application check
    if not is_worker:
        app = await db.applications.find_one({"job_id": req.jobId, "worker_id": user_id, "status": "selected"})
        if app: is_worker = True

    if not is_worker:
        raise HTTPException(status_code=403, detail="Forbidden: You are not the assigned worker")
        
    escrow = await db.escrows.find_one({"job_id": req.jobId})
    # If no escrow exists for a 'selected' job, we can auto-create it or error. 
    # For now, let's just allow it if the status is matched.
    
    release_at = auto_release_at()
    
    await db.escrows.update_one(
        {"job_id": req.jobId},
        {"$set": {
            "status": "RELEASE_REQUESTED",
            "release_requested_at": datetime.utcnow(),
            "auto_release_at": release_at
        }},
        upsert=True # Handle jobs where escrow wasn't created yet
    )
    
    return {"success": True, "status": "RELEASE_REQUESTED", "auto_release_at": release_at}

@payment_api_router.post("/escrow/release")
async def release_escrow(req: TargetEscrowRelease, request: Request):
    user_id = await get_current_user_id(request)
    from server import db
    
    job = await db.jobs.find_one({"id": req.jobId})
    if not job:
         raise HTTPException(status_code=404, detail="Job not found")
         
    if job.get("employer_id") != user_id and job.get("posted_by") != user_id:
         raise HTTPException(status_code=403, detail="Forbidden")
         
    status_update = "RELEASED" if req.action == "FULL_RELEASE" else "PARTIALLY_RELEASED"
    
    await db.escrows.update_one(
        {"job_id": req.jobId},
        {"$set": {
            "status": status_update,
            "released_at": datetime.utcnow(),
            "partial_release_pct": req.partialPct
        }}
    )
    
    return {"success": True, "status": status_update}

@payment_api_router.post("/no-show/confirm")
async def confirm_no_show(req: NoShowConfirmRequest, request: Request):
    user_id = await get_current_user_id(request)
    from server import db
    
    job = await db.jobs.find_one({"id": req.jobId})
    if not job:
         raise HTTPException(status_code=404, detail="Job not found")
         
    if job.get("employer_id") != user_id and job.get("posted_by") != user_id:
         raise HTTPException(status_code=403, detail="Forbidden")
         
    await db.escrows.update_one(
        {"job_id": req.jobId},
        {"$set": {
            "status": "REFUNDED",
            "refunded_at": datetime.utcnow(),
            "refund_reason": "Worker No-Show Confirmed"
        }}
    )
    
    # Record strike
    worker_id = job.get("assigned_worker") or job.get("worker_id")
    if not worker_id:
        # Try to find the selected application
        app = await db.applications.find_one({"job_id": req.jobId, "status": "selected"})
        if app:
            worker_id = app.get("worker_id")

    if worker_id:
        await db.noshow_records.insert_one({
            "id": str(uuid.uuid4()),
            "job_id": req.jobId,
            "worker_id": worker_id,
            "confirmed_at": datetime.utcnow(),
            "strike_number": 1,
            "penalty_applied": True
        })
    
    return {"success": True, "refundInitiated": True, "strikeNumber": 1}

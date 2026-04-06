from fastapi import APIRouter, HTTPException, Request, Query
from typing import Dict, Any
from database import get_db
from auth_utils import get_current_user_id
from datetime import datetime, timedelta

earnings_router = APIRouter(prefix="/earnings", tags=["earnings"])


@earnings_router.get("")
async def get_earnings(request: Request, period: str = Query("all")):
    user_id = await get_current_user_id(request)
    db = get_db()

    now = datetime.utcnow()

    # Time boundary
    boundary_time = None
    if period == "week":
        boundary_time = now - timedelta(days=7)
    elif period == "month":
        boundary_time = now - timedelta(days=30)

    # 1. Total Cleared Balance (Jobs completely finished and not yet withdrawn)
    # Using 'completed' status to define released funds.
    completed_apps_cursor = db.applications.find({
        "worker_id": user_id,
        "status": "completed"
    })

    total_earned = 0
    history = []

    async for app in completed_apps_cursor:
        job = await db.jobs.find_one({"id": app.get("job_id")})
        # Determine amount
        amount = app.get("earned_amount") or (job.get("salary_paise", 0) / 100) if job else 0
        total_earned += amount

        # Track history
        completed_at = app.get("completed_at") or app.get("last_updated") or now
        if isinstance(completed_at, str):
            try:
                completed_at = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
            except BaseException:
                completed_at = now

        history_item = {
            "id": app.get("id"),
            "amount": amount,
            "date": completed_at.isoformat(),
            "source": job.get("title", "Unknown Job") if job else "Unknown",
            "type": "credit"
        }

        if boundary_time is None or completed_at > boundary_time:
            history.append(history_item)

    # 2. Pending Escrow (Jobs user is 'selected' for but not yet 'completed')
    pending_apps_cursor = db.applications.find({
        "worker_id": user_id,
        "status": {"$in": ["selected", "in_progress"]}
    })

    pending_release = 0
    async for app in pending_apps_cursor:
        job = await db.jobs.find_one({"id": app.get("job_id")})
        amount = app.get("proposed_rate_paise", 0) / \
            100 if app.get("proposed_rate_paise") else (job.get("salary_paise", 0) / 100 if job else 0)
        pending_release += amount

    # 3. Withdrawals calculation (mock for now since there's no withdrawal table, but simulating total logic)
    withdrawals_cursor = db.withdrawals.find({"worker_id": user_id})
    withdrawals_sum = 0
    async for w in withdrawals_cursor:
        withdrawals_sum += w.get("amount", 0)

    current_balance = total_earned - withdrawals_sum

    # Sort history by date descending
    history.sort(key=lambda x: x["date"], reverse=True)

    return {
        "balance": current_balance,
        "total_earned": total_earned,
        "pending_release": pending_release,
        "withdrawals": withdrawals_sum,
        "history": history
    }


@earnings_router.post("/withdraw")
async def withdraw_earnings(request: Request, data: Dict[str, Any]):
    user_id = await get_current_user_id(request)
    db = get_db()

    amount = data.get("amount", 0)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid withdrawal amount")

    # Standardize a withdrawal document
    withdrawal = {
        "worker_id": user_id,
        "amount": amount,
        "requested_at": datetime.utcnow(),
        "status": "processing"
    }

    await db.withdrawals.insert_one(withdrawal)

    return {"status": "success", "message": f"Withdrawal request of ₹{amount} initiated."}


@earnings_router.get("/certificate")
async def get_income_certificate(request: Request):
    await get_current_user_id(request)
    # Generate certificate logic (this remains an API footprint)
    return {"id": "cert-123", "url": "http://example.com/cert.pdf"}

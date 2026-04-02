from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import List, Optional, Dict, Any
from database import get_db
from auth_utils import get_current_user_id
from datetime import datetime, timedelta

earnings_router = APIRouter(prefix="/earnings", tags=["earnings"])

@earnings_router.get("")
async def get_earnings(request: Request, period: str = Query("all")):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Mock data for demonstration as per user's "fix dashboard" request
    # In a real app, this would query a 'transactions' collection
    now = datetime.utcnow()
    
    # Simple logic to filter results based on period
    history = [
        {"id": "t1", "amount": 1200, "date": (now - timedelta(days=2)).isoformat(), "source": "Construction Site #4", "type": "credit"},
        {"id": "t2", "amount": 800, "date": (now - timedelta(days=5)).isoformat(), "source": "Electrician Service", "type": "credit"},
        {"id": "t3", "amount": 2500, "date": (now - timedelta(days=10)).isoformat(), "source": "Wall Painting", "type": "credit"},
        {"id": "t4", "amount": 1500, "date": (now - timedelta(days=15)).isoformat(), "source": "Plumbing Maintenance", "type": "credit"},
    ]
    
    filtered_history = history
    if period == "week":
        week_ago = now - timedelta(days=7)
        filtered_history = [t for t in history if datetime.fromisoformat(t["date"]) > week_ago]
    elif period == "month":
        month_ago = now - timedelta(days=30)
        filtered_history = [t for t in history if datetime.fromisoformat(t["date"]) > month_ago]
        
    return {
        "balance": 4500,
        "total_earned": 12000,
        "pending_release": 1500,
        "withdrawals": 6000,
        "history": filtered_history
    }

@earnings_router.post("/withdraw")
async def withdraw_earnings(request: Request, data: Dict[str, Any]):
    user_id = await get_current_user_id(request)
    # Handle withdrawal logic
    return {"status": "success", "message": "Withdrawal request initiated"}

@earnings_router.get("/certificate")
async def get_income_certificate(request: Request):
    user_id = await get_current_user_id(request)
    # Generate certificate logic
    return {"id": "cert-123", "url": "http://example.com/cert.pdf"}

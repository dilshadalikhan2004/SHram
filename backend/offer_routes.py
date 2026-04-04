from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import List, Optional
from database import get_db, mongo_to_dict
from pydantic import BaseModel
from datetime import datetime
import uuid

from auth_utils import get_current_user_id

offer_router = APIRouter(tags=["offers"])

class CounterOfferRequest(BaseModel):
    application_id: str
    amount_paise: int
    message: Optional[str] = None

@offer_router.post("/offers/counter")
async def create_counter_offer(request: Request, counter_in: CounterOfferRequest):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Verify application exists
    application = await db.applications.find_one({"id": counter_in.application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Check authorization (employer or worker)
    if application["worker_id"] != user_id:
        # Check if user is the employer for this job
        job = await db.jobs.find_one({"id": application["job_id"]})
        if not job or job["employer_id"] != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized to counter this offer")
            
    # Record the counter offer
    offer_id = str(uuid.uuid4())
    new_offer = {
        "id": offer_id,
        "application_id": counter_in.application_id,
        "sender_id": user_id,
        "amount_paise": counter_in.amount_paise,
        "message": counter_in.message,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.offers.insert_one(new_offer)
    
    # Update application counter status
    await db.applications.update_one(
        {"id": counter_in.application_id},
        {"$set": {
            "counter_offer_paise": counter_in.amount_paise,
            "offer_status": "countered"
        }}
    )
    
    return new_offer

@offer_router.get("/offers/application/{app_id}")
async def get_offers_for_application(app_id: str):
    db = get_db()
    cursor = db.offers.find({"application_id": app_id}).sort("created_at", -1)
    offers = await cursor.to_list(length=50)
    return [mongo_to_dict(o) for o in offers]

@offer_router.post("/offers/{offer_id}/respond")
async def respond_to_offer(offer_id: str, action: str = Query(...)):
    # action: "accept", "reject"
    db = get_db()
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    await db.offers.update_one(
        {"id": offer_id},
        {"$set": {"status": "accepted" if action == "accept" else "rejected"}}
    )
    
    # Update application accordingly
    new_status = "accepted" if action == "accept" else "rejected"
    await db.applications.update_one(
        {"id": offer["application_id"]},
        {"$set": {"offer_status": new_status}}
    )
    
    return {"status": "success", "action": action}

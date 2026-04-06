from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from database import get_db, mongo_to_dict
from models import PortfolioItem
from pydantic import BaseModel
from datetime import datetime
import uuid

from auth_utils import get_current_user_id

portfolio_router = APIRouter(tags=["portfolio"])


@portfolio_router.get("/portfolio", response_model=List[PortfolioItem])
async def get_my_portfolio(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    cursor = db.portfolio_items.find({"user_id": user_id})
    items = await cursor.to_list(length=100)
    return [mongo_to_dict(item) for item in items]


@portfolio_router.get("/portfolio/{user_id}", response_model=List[PortfolioItem])
async def get_user_portfolio(user_id: str):
    db = get_db()
    cursor = db.portfolio_items.find({"user_id": user_id})
    items = await cursor.to_list(length=100)
    return [mongo_to_dict(item) for item in items]


@portfolio_router.post("/portfolio", response_model=PortfolioItem)
async def add_portfolio_item(request: Request, item: PortfolioItem):
    user_id = await get_current_user_id(request)
    db = get_db()

    # Ensure ID and user_id are set
    item_dict = item.dict()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["user_id"] = user_id
    item_dict["created_at"] = datetime.utcnow()

    await db.portfolio_items.insert_one(item_dict)
    return item_dict


@portfolio_router.delete("/portfolio/{item_id}")
async def delete_portfolio_item(request: Request, item_id: str):
    user_id = await get_current_user_id(request)
    db = get_db()

    result = await db.portfolio_items.delete_one({"id": item_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")

    return {"status": "success", "message": "Portfolio item deleted"}


class TestimonialRequest(BaseModel):
    employer_email: str
    message: Optional[str] = None


@portfolio_router.post("/testimonials/request")
async def request_testimonial(request: Request, t_req: TestimonialRequest):
    user_id = await get_current_user_id(request)
    db = get_db()

    # Store request for tracking, ignoring email sending for now
    await db.testimonial_requests.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "employer_email": t_req.employer_email,
        "message": t_req.message,
        "status": "pending",
        "created_at": datetime.utcnow()
    })

    return {"status": "success", "message": "Testimonial request sent"}

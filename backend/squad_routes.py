from fastapi import APIRouter, HTTPException, Request, Body
from typing import Dict, Any
from database import get_db
from auth_utils import get_current_user_id
from bson import ObjectId

squad_router = APIRouter(prefix="/squads", tags=["squads"])


@squad_router.get("")
async def get_my_squads(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    # Fetch squads where user is a member
    squads_cursor = db.squads.find({"members.user_id": user_id})
    squads = await squads_cursor.to_list(length=100)

    # Convert ObjectIDs to strings
    for s in squads:
        s["id"] = str(s.pop("_id"))

    return {"squads": squads}


@squad_router.post("")
async def create_squad(request: Request, data: Dict[str, Any] = Body(...)):
    user_id = await get_current_user_id(request)
    db = get_db()

    # Simple squad creation
    new_squad = {
        "name": data.get("name", "New Squad"),
        "description": data.get("description", ""),
        "category": data.get("category", ""),
        "leader_id": user_id,
        "members": [
            {
                "user_id": user_id,
                "role": "leader",
                "name": "You",  # Simplified
                "split_percentage": 100.0
            }
        ],
        "total_earnings": 0,
        "total_jobs_completed": 0,
        "member_count": 1
    }

    result = await db.squads.insert_one(new_squad)
    new_squad["id"] = str(result.inserted_id)
    return new_squad


@squad_router.get("/{squad_id}")
async def get_squad(squad_id: str, request: Request):
    db = get_db()
    squad = await db.squads.find_one({"_id": ObjectId(squad_id)})
    if not squad:
        raise HTTPException(status_code=404, detail="Squad not found")

    squad["id"] = str(squad.pop("_id"))
    return squad


@squad_router.post("/{squad_id}/members")
async def add_member(squad_id: str, request: Request, data: Dict[str, Any] = Body(...)):
    db = get_db()

    # Verify the requested member actually exists before pushing to roster
    member_user_id = data.get("user_id")
    if not member_user_id:
        raise HTTPException(status_code=400, detail="Missing user_id for new member")

    worker_verify = await db.worker_profiles.find_one({"user_id": member_user_id})
    if not worker_verify:
        raise HTTPException(
            status_code=404,
            detail=f"Worker with ID {member_user_id} not found registered on ShramSetu. They must create an account first.")

    # Fully dynamic addition
    update_result = await db.squads.update_one(
        {"_id": ObjectId(squad_id)},
        {
            "$push": {"members": data},
            "$inc": {"member_count": 1}
        }
    )
    if update_result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Squad not found")
    return {"status": "success"}


@squad_router.delete("/{squad_id}/members/{member_id}")
async def remove_member(squad_id: str, member_id: str, request: Request):
    db = get_db()
    await db.squads.update_one(
        {"_id": ObjectId(squad_id)},
        {
            "$pull": {"members": {"user_id": member_id}},
            "$inc": {"member_count": -1}
        }
    )
    return {"status": "success"}


@squad_router.put("/{squad_id}/splits")
async def update_splits(squad_id: str, request: Request, data: Dict[str, Any] = Body(...)):
    db = get_db()
    # data["splits"] is a list of {user_id, split_percentage}
    splits = data.get("splits", [])
    # Update each member's split
    for s in splits:
        await db.squads.update_one(
            {"_id": ObjectId(squad_id), "members.user_id": s["user_id"]},
            {"$set": {"members.$.split_percentage": s["split_percentage"]}}
        )
    return {"status": "success"}

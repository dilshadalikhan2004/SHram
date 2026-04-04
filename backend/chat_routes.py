from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
from database import get_db, mongo_to_dict, mongo_list_to_dict
from auth_utils import get_current_user_id
from models import ChatMessage
from datetime import datetime
from bson import ObjectId

chat_router = APIRouter()

@chat_router.get("/conversations")
async def get_conversations(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Aggregate to find unique chat partners and their last message
    pipeline = [
        {
            "$match": {
                "$or": [{"sender_id": user_id}, {"receiver_id": user_id}]
            }
        },
        {
            "$sort": {"timestamp": -1}
        },
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", user_id]},
                        "$receiver_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$first": "$content"},
                "timestamp": {"$first": "$timestamp"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {"$and": [{"$eq": ["$receiver_id", user_id]}, {"$eq": ["$is_read", False]}]},
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]
    
    conversation_nodes = await db.messages.aggregate(pipeline).to_list(length=100)
    
    result = []
    for node in conversation_nodes:
        other_user_id = node["_id"]
        # Fetch user details
        other_user = await db.users.find_one({"_id": ObjectId(other_user_id)} if ObjectId.is_valid(other_user_id) else {"id": other_user_id})
        
        if not other_user:
            # Fallback if user ID is a string but not in 'id' field
            other_user = await db.users.find_one({"user_id": other_user_id})

        result.append({
            "user_id": other_user_id,
            "user_name": other_user.get("full_name") or other_user.get("name") or "Unknown User",
            "user_role": other_user.get("role", "worker"),
            "profile_photo": other_user.get("profile_photo"),
            "last_message": node["last_message"],
            "timestamp": node["timestamp"],
            "unread_count": node["unread_count"]
        })
        
    return result

@chat_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # Mark messages as read
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    # Fetch chronological history
    messages = await db.messages.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id}
        ]
    }).sort("timestamp", 1).to_list(length=500)
    
    return mongo_list_to_dict(messages)

@chat_router.get("/users/{user_id}")
async def get_chat_user_details(user_id: str):
    if user_id == "support":
        return {
            "id": "support",
            "name": "ShramSetu Support",
            "role": "admin",
            "profile_photo": None
        }

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"id": user_id})
    if not user:
        # Check profiles
        user = await db.worker_profiles.find_one({"user_id": user_id})
        if not user:
             user = await db.employer_profiles.find_one({"user_id": user_id})
             
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return mongo_to_dict(user)

@chat_router.post("/messages")
async def send_message_http(request: Request):
    user_id = await get_current_user_id(request)
    data = await request.json()
    receiver_id = data.get("receiver_id")
    content = data.get("content")
    
    if not receiver_id or not content:
        raise HTTPException(status_code=400, detail="Missing receiver_id or content")
        
    db = get_db()
    
    new_msg = {
        "id": str(uuid.uuid4()),
        "sender_id": user_id,
        "receiver_id": receiver_id,
        "content": content,
        "timestamp": datetime.utcnow(),
        "is_read": False
    }
    
    await db.messages.insert_one(new_msg)
    
    # Broadcast through server manager if found
    from server import manager
    await manager.send_personal_message({
        "type": "new_message",
        "message": mongo_to_dict(new_msg.copy())
    }, receiver_id)
    
    return mongo_to_dict(new_msg)

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime
import uuid
import os
import json
import logging
from database import get_db
from auth_utils import get_current_user_id
from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)

notification_router = APIRouter(tags=["notifications"])


VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY")
VAPID_CLAIMS = {"sub": "mailto:support@shramsetu.in"}

async def send_user_notification(user_id: str, title: str, message: str, action_url: str = None):
    """
    Utility to send both an in-app notification (DB) and a Web Push notification (VAPID).
    """
    db = get_db()
    
    # 1. Store in DB for the 'bell' icon
    new_notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "action_url": action_url,
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(new_notif)
    
    # 2. Try to send Web Push
    sub_doc = await db.push_subscriptions.find_one({"user_id": user_id})
    if sub_doc and sub_doc.get("subscription") and VAPID_PRIVATE_KEY:
        try:
            webpush(
                subscription_info=sub_doc["subscription"],
                data=json.dumps({
                    "title": title,
                    "body": message,
                    "url": action_url or "/"
                }),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
        except WebPushException as ex:
            logger.error(f"Web Push Error for user {user_id}: {str(ex)}")
            # If subscription is expired/invalid, we could remove it
            if ex.response and ex.response.status_code in [404, 410]:
                await db.push_subscriptions.delete_one({"user_id": user_id})



@notification_router.post("/subscribe")
async def subscribe_push(payload: dict, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    await db.push_subscriptions.update_one(
        {"user_id": user_id},
        {"$set": {"subscription": payload, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"success": True}

@notification_router.get("/", response_model=List[dict])
async def list_notifications(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    cursor = db.notifications.find({"user_id": user_id}).sort("created_at", -1)
    notifs = await cursor.to_list(length=50)
    return notifs

@notification_router.patch("/read-all")
async def read_all_notifications(request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"success": True}

import os
import logging
import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import get_db
from auth_utils import get_current_user_id
from datetime import datetime

logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "sk_test_mock_if_not_provided")

subscription_router = APIRouter(prefix="/subscription", tags=["subscriptions"])

class CheckoutRequest(BaseModel):
    tier: str
    priceId: str | None = None

@subscription_router.post("/create-checkout")
async def create_checkout(req: CheckoutRequest, request: Request):
    user_id = await get_current_user_id(request)
    db = get_db()
    
    # 1. Verification
    profile = await db.employer_profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Employer profile not found.")
        
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    
    try:
        if req.priceId == "mock_price" or "sk_test_mock" in stripe.api_key:
            # Bypass stripe for mock mode if keys aren't fully configured
            return {"url": f"{frontend_url}/employer/subscription?status=success_mock"}

        # Dynamically build price data so we don't need real Price IDs in dashboard for prototyping
        price_data = None
        if req.priceId == "price_basic_499":
            price_data = {
                "currency": "inr",
                "product_data": {"name": "Basic Profile Plan"},
                "unit_amount": 49900, # Paise
                "recurring": {"interval": "month"}
            }
        elif req.priceId == "price_pro_1499":
            price_data = {
                "currency": "inr",
                "product_data": {"name": "Pro Profile Plan"},
                "unit_amount": 149900, # Paise
                "recurring": {"interval": "month"}
            }
            
        line_item = {'quantity': 1}
        if price_data:
            line_item['price_data'] = price_data
        else:
            line_item['price'] = req.priceId

        # 2. Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=profile.get("email"),
            line_items=[line_item],
            mode='subscription',
            success_url=f"{frontend_url}/employer/subscription?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/employer/subscription?status=canceled",
            metadata={
                'user_id': user_id,
                'tier': req.tier
            }
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Stripe Checkout Error: {e}")
        raise HTTPException(status_code=500, detail="Payment gateway initialization failed.")

@subscription_router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    endpoint_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    event = None
    try:
        if endpoint_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        else:
            # If no webhook secret, just parse JSON (insecure, but good for local dev if not strictly configured)
            import json
            event = json.loads(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    db = get_db()
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        user_id = session.get('metadata', {}).get('user_id')
        tier = session.get('metadata', {}).get('tier')
        subscription_id = session.get('subscription')
        
        if user_id and tier:
            await db.employer_profiles.update_one(
                {"user_id": user_id},
                {"$set": {
                    "subscription_tier": tier,
                    "stripe_subscription_id": subscription_id,
                    "subscription_status": "active",
                    "subscription_updated_at": datetime.utcnow()
                }}
            )
            
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        subscription_id = subscription.get('id')
        
        await db.employer_profiles.update_one(
            {"stripe_subscription_id": subscription_id},
            {"$set": {
                "subscription_tier": "Starter",
                "subscription_status": "canceled",
                "subscription_updated_at": datetime.utcnow()
            }}
        )

    return {"status": "success"}


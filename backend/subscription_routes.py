import os
import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import get_db
from auth_utils import get_current_user_id
from datetime import datetime

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

        # 2. Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=profile.get("email"),
            line_items=[{
                'price': req.priceId,
                'quantity': 1,
            }],
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
        print(f"Stripe Checkout Error: {e}")
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


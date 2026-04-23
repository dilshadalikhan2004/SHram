from fastapi import APIRouter, HTTPException, Depends, Request
from rate_limiter import limiter
from bson import ObjectId
from datetime import datetime, timedelta
import os
from database import get_db
from models import UserCreate, LoginSchema, Token, OTPRequest
from auth_utils import create_access_token, get_password_hash, verify_password, get_current_user_id
import re
import logging

logger = logging.getLogger(__name__)

def normalize_phone(phone: str) -> str:
    if not phone:
        return phone
    cleaned = re.sub(r'[^\d+]', '', phone)
    if not cleaned.startswith('+'):
        if len(cleaned) == 10:
            cleaned = f'+91{cleaned}'
        elif len(cleaned) > 10:
            cleaned = f'+{cleaned}'
    return cleaned


auth_router = APIRouter(prefix="/auth", tags=["auth"])

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_VERIFY_SERVICE_SID = os.environ.get("TWILIO_VERIFY_SERVICE_SID") or os.environ.get("TWILIO_SERVICE_SID")
try:
    from twilio.rest import Client
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID else None
except ImportError:
    twilio_client = None

# Redis Integration for OTP storage
REDIS_URL = os.environ.get("REDIS_URL")
redis_client = None
if REDIS_URL:
    try:
        import redis
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        logger.info("Redis connected for OTP storage")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")

# In-memory fallback (not recommended for production)
mock_otp_storage = {}


async def _send_otp_internal(target_phone: str):
    """Internal helper to handle OTP dispatch via Twilio or Mock/Redis."""
    if twilio_client and TWILIO_VERIFY_SERVICE_SID:
        try:
            verification = twilio_client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verifications.create(to=target_phone, channel='sms')
            logger.info(f"[TWILIO SMS] Verification sent to {target_phone}, status: {verification.status}")
        except Exception as e:
            logger.error(f"[TWILIO ERROR] {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to send SMS via Twilio: {str(e)}")
    else:
        # Fallback to mock/Redis
        import random
        otp = str(random.randint(100000, 999999))
        
        if redis_client:
            # Store in Redis with 5 min TTL
            redis_client.setex(f"otp:{target_phone}", 300, otp)
            logger.info(f"[REDIS SMS] Key set for {target_phone}: {otp}")
        else:
            # Fallback to memory
            mock_otp_storage[target_phone] = {
                "code": otp,
                "expires": datetime.utcnow() + timedelta(minutes=5)
            }
            logger.info(f"[MOCK SMS] Signal sent to {target_phone}: {otp}")
    
    return {"message": "OTP sent successfully", "phone": target_phone}


@auth_router.post("/send-otp")
@auth_router.post("/otp/send")  # Alias for compatibility
@limiter.limit("5/minute")
async def send_otp(otp_req: OTPRequest, request: Request):
    """
    Sends a 6-digit verification code to the provided phone number.
    """
    target_phone = normalize_phone(otp_req.phone)
    if not target_phone or len(target_phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    return await _send_otp_internal(target_phone)


async def _verify_otp_internal(target_phone: str, code: str) -> bool:
    """Internal helper to verify OTP across different flows."""
    if not target_phone or not code:
        return False

    # 1. Check Twilio
    if twilio_client and TWILIO_VERIFY_SERVICE_SID:
        try:
            check = twilio_client.verify.v2.services(
                TWILIO_VERIFY_SERVICE_SID).verification_checks.create(to=target_phone, code=code)
            return check.status == "approved"
        except Exception as e:
            logger.error(f"[TWILIO VERIFY ERROR] {str(e)}")
            return False

    # 2. Check Redis
    if redis_client:
        stored_otp = redis_client.get(f"otp:{target_phone}")
        if stored_otp and str(code) == str(stored_otp):
            redis_client.delete(f"otp:{target_phone}")
            return True
        return False

    # 3. Check Mock storage (Memory fallback)
    if target_phone in mock_otp_storage:
        stored = mock_otp_storage[target_phone]
        if datetime.utcnow() <= stored["expires"] and str(code) == str(stored["code"]):
            del mock_otp_storage[target_phone]
            return True
    
    return False


@auth_router.post("/verify-otp")
@limiter.limit("10/minute")
async def verify_otp(otp_data: dict, request: Request, user_id: str = Depends(get_current_user_id)):
    """
    Verifies the OTP and updates the user's phone_verified status.
    Expected payload: { "phone": "+91...", "code": "123456" }
    """
    db = get_db()
    target_phone = normalize_phone(otp_data.get("phone"))
    code = otp_data.get("code") or otp_data.get("otp")

    if not _verify_otp_internal(target_phone, code):
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")

    # Update user
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"phone": target_phone, "phone_verified": True}}
    )

    return {"message": "Phone verified successfully", "phone": target_phone}


@auth_router.post("/register", response_model=Token)
async def register(user: UserCreate):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection failed")

    # Check if user exists (only if phone is provided)
    if user.phone and user.phone.strip():
        user.phone = normalize_phone(user.phone)
        existing = await db.users.find_one({"phone": user.phone})
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    # Hash password if provided
    hashed_password = None
    if user.password:
        hashed_password = get_password_hash(user.password)

    # Handle name/full_name
    display_name = user.name or user.full_name or user.phone or user.email or "New User"

    new_user = {
        "phone": user.phone,
        "email": user.email,
        "full_name": display_name,
        "role": user.role,
        "password": hashed_password,
        "created_at": datetime.utcnow(),
        "phone_verified": False,
        "preferred_language": "en"
    }

    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)

    # Create profile based on role
    if user.role == "worker":
        from models import WorkerProfile
        profile = WorkerProfile(user_id=user_id, full_name=display_name)
        await db.worker_profiles.insert_one(profile.dict())
    else:
        from models import EmployerProfile
        profile = EmployerProfile(user_id=user_id, company_name=display_name)
        await db.employer_profiles.insert_one(profile.dict())

    access_token = create_access_token({"user_id": user_id, "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "phone": user.phone,
            "email": user.email,
            "full_name": display_name,
            "role": user.role,
            "profile_complete": False,
            "onboarding_completed": False
        }
    }


@auth_router.post("/login", response_model=Token)
async def login(user_login: LoginSchema):
    db = get_db()

    # Normalize empty strings to None
    phone = user_login.phone.strip() if user_login.phone else None
    if phone:
        phone = normalize_phone(phone)
    email = user_login.email.strip() if user_login.email else None
    password = user_login.password if user_login.password else None
    otp = user_login.otp.strip() if user_login.otp else None
    identifier = phone or email

    if not identifier:
        raise HTTPException(status_code=422, detail="Phone or email required")

    # Try to find user by phone first, then email, then treat identifier as either
    user = None
    if phone:
        user = await db.users.find_one({"phone": phone})
    if not user and email:
        user = await db.users.find_one({"email": email})
    # Fallback: if identifier looks like email, try email field; otherwise try phone
    if not user and identifier:
        if "@" in identifier:
            user = await db.users.find_one({"email": identifier})
        else:
            user = await db.users.find_one({"phone": identifier})

    if not user and not otp:
        # No user found and no OTP provided for potential registration
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # --- OTP-based login ---
    if otp:
        # If user is None, we use the phone from input for verification
        target_phone = user.get("phone") if user else phone
        if not target_phone:
            raise HTTPException(status_code=400, detail="Phone number required for OTP")

        if twilio_client and TWILIO_VERIFY_SERVICE_SID:
            try:
                verification_check = twilio_client.verify.v2.services(
                    TWILIO_VERIFY_SERVICE_SID).verification_checks.create(to=target_phone, code=otp)
                if verification_check.status != "approved":
                    raise HTTPException(status_code=401, detail="Invalid or expired OTP")
            except Exception as e:
                logger.error(f"[TWILIO VERIFY ERROR] {str(e)}")
                raise HTTPException(status_code=401, detail="Invalid OTP")
        else:
            if target_phone not in mock_otp_storage:
                raise HTTPException(status_code=401, detail="OTP expired or not requested")

            stored = mock_otp_storage[target_phone]
            if datetime.utcnow() > stored["expires"]:
                del mock_otp_storage[target_phone]
                raise HTTPException(status_code=401, detail="OTP expired")

            if otp != stored["code"]:
                raise HTTPException(status_code=401, detail="Invalid OTP")

            del mock_otp_storage[target_phone]

        # If we reach here, OTP is valid. If user is None, create them.
        if not user:
            from models import WorkerProfile
            new_user = {
                "phone": target_phone,
                "role": "worker",
                "created_at": datetime.utcnow(),
                "profile_complete": False,
                "full_name": target_phone,
                "phone_verified": True,
                "preferred_language": "en"
            }
            result = await db.users.insert_one(new_user)
            user_id = str(result.inserted_id)
            user = new_user
            user["_id"] = result.inserted_id  # Keep as ObjectId or add id string later

            # Auto-create worker profile for new phone-only accounts
            profile = WorkerProfile(user_id=user_id, full_name=target_phone)
            await db.worker_profiles.insert_one(profile.dict())

    # --- Password-based login ---
    elif password:
        stored_hash = user.get("password") or user.get("hashed_password")
        if not stored_hash or not verify_password(password, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

    else:
        raise HTTPException(status_code=401, detail="Password or OTP required")

    user_id = str(user["_id"])
    role = user.get("role", "worker")
    access_token = create_access_token({"user_id": user_id, "role": role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "phone": user.get("phone"),
            "email": user.get("email"),
            "full_name": user.get("full_name"),
            "role": role,
            "profile_complete": user.get("profile_complete", False),
            "onboarding_completed": user.get("onboarding_completed", user.get("profile_complete", False))
        }
    }


@auth_router.get("/me")
async def get_me(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user["_id"]),
        "phone": user.get("phone"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "role": user.get("role", "worker"),
        "profile_complete": user.get("profile_complete", False),
        "onboarding_completed": user.get("onboarding_completed", user.get("profile_complete", False)),
        "preferred_language": user.get("preferred_language", "en")
    }


@auth_router.patch("/role")
async def update_role(payload: dict, user_id: str = Depends(get_current_user_id)):
    """
    Updates the user's role. Typically used to upgrade a worker to 'both'.
    """
    db = get_db()
    new_role = payload.get("role")
    if new_role not in ["worker", "employer", "both"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}}
    )

    # Ensure profile exists for the new role
    if new_role in ["employer", "both"]:
        existing_employer = await db.employer_profiles.find_one({"user_id": user_id})
        if not existing_employer:
            from models import EmployerProfile
            profile = EmployerProfile(
                user_id=user_id,
                company_name=user.get("full_name", user.get("phone", "New Employer"))
            )
            await db.employer_profiles.insert_one(profile.dict())

    return {"message": "Role updated", "role": new_role}


@auth_router.post("/language")
async def update_language(language: str, user_id: str = Depends(get_current_user_id)):
    """
    Updates the user's preferred language for persistent localization.
    """
    db = get_db()
    if language not in ["en", "hi", "or"]:
        raise HTTPException(status_code=400, detail="Unsupported language")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"preferred_language": language}}
    )
    return {"message": "Language updated", "language": language}


@auth_router.post("/forgot-password")
async def forgot_password(payload: dict, request: Request):
    """
    Initiates the password reset flow by sending an OTP.
    Expected payload: { "identifier": "email@example.com" or "9999900000" }
    """
    db = get_db()
    identifier = payload.get("identifier")
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone required")

    # Find user
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"phone": normalize_phone(identifier)}
        ]
    })

    if not user:
        # For security, we might return 200 even if user doesn't exist
        # But for this platform, a 404 is often more helpful to the user
        raise HTTPException(status_code=404, detail="User not found")

    target_phone = user.get("phone")
    if not target_phone:
        # If user only has email, we'd need email OTP logic
        # For now, ShramSetu is phone-centric
        raise HTTPException(status_code=400, detail="Account does not have a verified phone number for recovery")

    # Reuse internal send_otp logic
    await _send_otp_internal(target_phone)
    
    return {"message": "Recovery code sent", "phone": target_phone}


@auth_router.post("/reset-password")
async def reset_password(payload: dict):
    """
    Verifies OTP and updates password.
    Expected payload: { "identifier": "...", "otp": "123456", "password": "newpassword" }
    """
    db = get_db()
    identifier = payload.get("identifier")
    otp = payload.get("otp")
    new_password = payload.get("password")

    if not all([identifier, otp, new_password]):
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Find user to get their normalized phone
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"phone": normalize_phone(identifier)}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    target_phone = user.get("phone")
    if not target_phone:
         raise HTTPException(status_code=400, detail="Recovery failed: No phone associated")

    # Verify OTP
    if not await _verify_otp_internal(target_phone, otp):
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")

    # Update password
    hashed_password = get_password_hash(new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_password}}
    )

    return {"message": "Password reset successfully"}

from fastapi import Request, HTTPException, Depends
from typing import Optional
from datetime import datetime, timedelta
import os
import jwt
from passlib.context import CryptContext
from database import get_db

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'f9b4c7d0e8a21f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user_id(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Bearer token missing")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id") or payload.get("id")
        if not user_id:
             raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    # Fallback to allow legacy plaintext passwords from older accounts
    if not hashed_password.startswith("$2b$"):
        return plain_password == hashed_password
    
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

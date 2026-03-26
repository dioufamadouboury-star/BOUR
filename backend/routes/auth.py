"""
Authentication Routes - Extracted from server.py
"""
from fastapi import APIRouter, Request, Response, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import secrets
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
import httpx
import os
import asyncio

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Import shared dependencies from main server
from server import (
    db, logger, User, SECRET_KEY, ALGORITHM,
    get_current_user, require_auth, require_admin,
    send_email_async, send_welcome_email, get_email_template,
    collect_marketing_contact, SITE_URL, GOOGLE_CLIENT_ID
)

# Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleCallbackRequest(BaseModel):
    credential: str
    clientId: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

# Routes
@router.post("/register")
async def register(user_data: UserCreate, response: Response):
    """Register a new user"""
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email")
    
    hashed = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt())
    user_id = f"user_{secrets.token_hex(8)}"
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email.lower(),
        "name": user_data.name,
        "phone": user_data.phone,
        "hashed_password": hashed.decode(),
        "is_admin": False,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None,
        "addresses": [],
        "wishlist": [],
        "preferences": {"newsletter": True, "notifications": True}
    }
    
    await db.users.insert_one(user_doc)
    
    # Collect marketing contact
    asyncio.create_task(collect_marketing_contact(user_data.name, user_data.email, user_data.phone, "registration"))
    
    # Send welcome email
    user_for_email = {k: v for k, v in user_doc.items() if k != "_id"}
    asyncio.create_task(send_welcome_email(user_for_email))
    
    # Generate token
    token = jwt.encode({
        "user_id": user_id,
        "email": user_data.email.lower(),
        "is_admin": False,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }, SECRET_KEY, algorithm=ALGORITHM)
    
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "token": token,
        "user": {
            "user_id": user_id,
            "email": user_data.email.lower(),
            "name": user_data.name,
            "phone": user_data.phone,
            "is_admin": False
        }
    }

@router.post("/login")
async def login(credentials: UserLogin, response: Response):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email.lower()})
    
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["hashed_password"].encode()):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Update last login
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    token = jwt.encode({
        "user_id": user["user_id"],
        "email": user["email"],
        "is_admin": user.get("is_admin", False),
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }, SECRET_KEY, algorithm=ALGORITHM)
    
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "phone": user.get("phone"),
            "is_admin": user.get("is_admin", False)
        }
    }

@router.post("/google/callback")
async def google_oauth_callback(callback_data: GoogleCallbackRequest, response: Response):
    """Handle Google OAuth callback"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={callback_data.credential}"
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            
            google_user = resp.json()
        
        email = google_user.get("email", "").lower()
        name = google_user.get("name", "")
        picture = google_user.get("picture", "")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email non disponible")
        
        # Find or create user
        user = await db.users.find_one({"email": email})
        
        if not user:
            user_id = f"user_{secrets.token_hex(8)}"
            user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "phone": None,
                "hashed_password": None,
                "is_admin": False,
                "is_active": True,
                "google_id": google_user.get("sub"),
                "avatar_url": picture,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "auth_provider": "google"
            }
            await db.users.insert_one(user)
            asyncio.create_task(collect_marketing_contact(name, email, None, "registration"))
        else:
            user_id = user["user_id"]
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
            )
        
        token = jwt.encode({
            "user_id": user.get("user_id") or user_id,
            "email": email,
            "is_admin": user.get("is_admin", False),
            "exp": datetime.now(timezone.utc) + timedelta(days=7)
        }, SECRET_KEY, algorithm=ALGORITHM)
        
        response.set_cookie(
            key="auth_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60
        )
        
        return {
            "token": token,
            "user": {
                "user_id": user.get("user_id") or user_id,
                "email": email,
                "name": user.get("name") or name,
                "is_admin": user.get("is_admin", False)
            }
        }
    except Exception as e:
        logger.error(f"Google OAuth error: {e}")
        raise HTTPException(status_code=500, detail="Erreur d'authentification Google")

@router.get("/me")
async def get_me(user: User = Depends(require_auth)):
    """Get current user profile"""
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "is_admin": user.is_admin,
        "addresses": user.addresses
    }

@router.put("/profile")
async def update_profile(profile_data: ProfileUpdate, user: User = Depends(require_auth)):
    """Update user profile"""
    update_fields = {}
    if profile_data.name:
        update_fields["name"] = profile_data.name
    if profile_data.phone:
        update_fields["phone"] = profile_data.phone
    
    if update_fields:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_fields}
        )
    
    return {"message": "Profil mis à jour"}

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    response.delete_cookie(key="auth_token", samesite="none", secure=True)
    return {"message": "Déconnexion réussie"}

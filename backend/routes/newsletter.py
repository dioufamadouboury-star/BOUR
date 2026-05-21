"""
Newsletter Routes Module
Handles newsletter subscriptions
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["newsletter"])

# Dependencies injected from main server
db = None

def init_newsletter_routes(database):
    """Initialize module with dependencies"""
    global db
    db = database


class NewsletterSubscribe(BaseModel):
    email: EmailStr
    name: str = ""


@router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    """Subscribe to newsletter"""
    existing = await db.newsletter.find_one({"email": data.email.lower()})
    
    if existing:
        if existing.get("active", True):
            return {"message": "Vous êtes déjà inscrit", "already_subscribed": True}
        else:
            await db.newsletter.update_one(
                {"email": data.email.lower()},
                {"$set": {"active": True, "resubscribed_at": datetime.now(timezone.utc).isoformat()}}
            )
            return {"message": "Réinscription réussie", "resubscribed": True}
    
    subscriber_doc = {
        "email": data.email.lower(),
        "name": data.name,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "active": True,
        "spin_used": False,
        "source": "website"
    }
    
    await db.newsletter.insert_one(subscriber_doc)
    
    return {"message": "Inscription réussie", "subscribed": True}


@router.post("/newsletter/unsubscribe")
async def unsubscribe_newsletter(email: str):
    """Unsubscribe from newsletter"""
    result = await db.newsletter.update_one(
        {"email": email.lower()},
        {"$set": {"active": False, "unsubscribed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Email non trouvé")
    
    return {"message": "Désinscription réussie"}


@router.get("/newsletter/check/{email}")
async def check_subscription(email: str):
    """Check if email is subscribed"""
    subscriber = await db.newsletter.find_one({"email": email.lower()}, {"_id": 0})
    
    return {
        "subscribed": subscriber is not None and subscriber.get("active", True),
        "spin_used": subscriber.get("spin_used", False) if subscriber else False
    }

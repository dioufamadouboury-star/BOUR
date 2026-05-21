"""
Push Notifications module for YAMA+
Handles web push notifications for promotions, orders, etc.
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json
import os

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# In-memory storage for subscriptions (in production, use database)
# We'll use MongoDB in server.py
SUBSCRIPTIONS = []

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict
    user_id: Optional[str] = None

class NotificationPayload(BaseModel):
    title: str
    body: str
    icon: Optional[str] = "/assets/images/logo_yama_full.png"
    badge: Optional[str] = "/assets/images/logo_yama_full.png"
    url: Optional[str] = "/"
    tag: Optional[str] = None
    image: Optional[str] = None

class CampaignNotification(BaseModel):
    title: str
    body: str
    url: Optional[str] = "/"
    image: Optional[str] = None
    target: str = "all"  # all, subscribers, customers

# Notification templates
NOTIFICATION_TEMPLATES = {
    "order_confirmed": {
        "title": "Commande confirmée ✅",
        "body": "Votre commande #{order_id} a été confirmée !",
        "url": "/account/orders"
    },
    "order_shipped": {
        "title": "Commande expédiée 🚚",
        "body": "Votre commande #{order_id} est en route !",
        "url": "/account/orders"
    },
    "order_delivered": {
        "title": "Commande livrée 📦",
        "body": "Votre commande #{order_id} a été livrée !",
        "url": "/account/orders"
    },
    "flash_sale": {
        "title": "🔥 Vente Flash !",
        "body": "Jusqu'à -50% pendant 24h seulement !",
        "url": "/promotions"
    },
    "new_products": {
        "title": "✨ Nouveautés",
        "body": "Découvrez nos dernières arrivées !",
        "url": "/nouveautes"
    },
    "cart_reminder": {
        "title": "🛒 Panier abandonné",
        "body": "Vos articles vous attendent ! Finalisez votre commande.",
        "url": "/checkout"
    },
    "price_drop": {
        "title": "📉 Baisse de prix !",
        "body": "Un produit de votre wishlist est en promo !",
        "url": "/wishlist"
    },
    "welcome": {
        "title": "Bienvenue chez YAMA+ 🎉",
        "body": "Merci de vous être inscrit ! Profitez de -10% avec le code BIENVENUE",
        "url": "/"
    }
}

@router.post("/subscribe")
async def subscribe(subscription: PushSubscription, request: Request):
    """Subscribe to push notifications"""
    from server import db
    
    # Check if already subscribed
    existing = await db.push_subscriptions.find_one({"endpoint": subscription.endpoint})
    if existing:
        # Update existing subscription
        await db.push_subscriptions.update_one(
            {"endpoint": subscription.endpoint},
            {"$set": {
                "keys": subscription.keys,
                "user_id": subscription.user_id,
                "updated_at": datetime.utcnow()
            }}
        )
        return {"success": True, "message": "Subscription updated"}
    
    # Create new subscription
    await db.push_subscriptions.insert_one({
        "endpoint": subscription.endpoint,
        "keys": subscription.keys,
        "user_id": subscription.user_id,
        "created_at": datetime.utcnow(),
        "active": True
    })
    
    return {"success": True, "message": "Subscribed successfully"}

@router.post("/unsubscribe")
async def unsubscribe(endpoint: str):
    """Unsubscribe from push notifications"""
    from server import db
    
    await db.push_subscriptions.update_one(
        {"endpoint": endpoint},
        {"$set": {"active": False}}
    )
    
    return {"success": True, "message": "Unsubscribed"}

@router.get("/templates")
async def get_templates():
    """Get available notification templates"""
    return {
        "templates": [
            {"id": k, **v} for k, v in NOTIFICATION_TEMPLATES.items()
        ]
    }

@router.post("/send")
async def send_notification(payload: NotificationPayload, request: Request):
    """Send notification to a specific subscription (admin only)"""
    # This would typically use pywebpush library
    # For now, we'll store it as a pending notification
    from server import db, get_current_admin
    
    admin = await get_current_admin(request)
    if not admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Store notification for polling
    notification = {
        "notification_id": f"notif_{datetime.utcnow().timestamp()}",
        "title": payload.title,
        "body": payload.body,
        "icon": payload.icon,
        "url": payload.url,
        "image": payload.image,
        "created_at": datetime.utcnow(),
        "read": False
    }
    
    # Broadcast to all active subscriptions (in real implementation)
    count = await db.push_subscriptions.count_documents({"active": True})
    
    return {
        "success": True,
        "message": f"Notification queued for {count} subscribers",
        "notification": notification
    }

@router.post("/campaign")
async def send_campaign(campaign: CampaignNotification, request: Request):
    """Send promotional campaign to subscribers"""
    from server import db, get_current_admin
    
    admin = await get_current_admin(request)
    if not admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Count target subscribers
    query = {"active": True}
    if campaign.target == "customers":
        query["user_id"] = {"$ne": None}
    
    count = await db.push_subscriptions.count_documents(query)
    
    # Store campaign for analytics
    campaign_doc = {
        "campaign_id": f"camp_{datetime.utcnow().timestamp()}",
        "title": campaign.title,
        "body": campaign.body,
        "url": campaign.url,
        "image": campaign.image,
        "target": campaign.target,
        "sent_count": count,
        "created_at": datetime.utcnow(),
        "created_by": admin.get("email", "admin")
    }
    
    await db.notification_campaigns.insert_one(campaign_doc)
    
    return {
        "success": True,
        "campaign_id": campaign_doc["campaign_id"],
        "sent_to": count,
        "message": f"Campaign sent to {count} subscribers"
    }

@router.get("/campaigns")
async def get_campaigns(request: Request):
    """Get notification campaigns history"""
    from server import db, get_current_admin
    
    admin = await get_current_admin(request)
    if not admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    campaigns = await db.notification_campaigns.find().sort("created_at", -1).limit(50).to_list(50)
    
    for c in campaigns:
        c["_id"] = str(c["_id"])
    
    return {"campaigns": campaigns}

@router.get("/stats")
async def get_notification_stats(request: Request):
    """Get push notification statistics"""
    from server import db, get_current_admin
    
    admin = await get_current_admin(request)
    if not admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_subs = await db.push_subscriptions.count_documents({})
    active_subs = await db.push_subscriptions.count_documents({"active": True})
    total_campaigns = await db.notification_campaigns.count_documents({})
    
    return {
        "total_subscribers": total_subs,
        "active_subscribers": active_subs,
        "total_campaigns": total_campaigns
    }

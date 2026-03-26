"""
Marketing Routes - Extracted from server.py
"""
from fastapi import APIRouter, Request, Depends, HTTPException
from typing import Optional
import secrets
from datetime import datetime, timezone

router = APIRouter(prefix="/admin/marketing", tags=["Marketing"])

# Import shared dependencies
from server import (
    db, logger, User, require_admin,
    send_email_mailersend, get_email_template,
    send_sms_notification
)

# Helper function
async def collect_marketing_contact(name: str, email: Optional[str], phone: Optional[str], source: str):
    """Auto-collect marketing contacts from various sources"""
    if not email and not phone:
        return
    
    contact = {
        "name": name or "Anonyme",
        "email": email,
        "phone": phone,
        "source": source,
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "is_subscribed": True,
        "last_activity": datetime.now(timezone.utc).isoformat()
    }
    
    if email:
        await db.marketing_contacts.update_one(
            {"email": email},
            {"$set": contact, "$setOnInsert": {"contact_id": f"MC-{secrets.token_hex(4).upper()}"}},
            upsert=True
        )
    elif phone:
        await db.marketing_contacts.update_one(
            {"phone": phone},
            {"$set": contact, "$setOnInsert": {"contact_id": f"MC-{secrets.token_hex(4).upper()}"}},
            upsert=True
        )

# Routes
@router.get("/contacts")
async def get_marketing_contacts(
    source: Optional[str] = None,
    has_email: Optional[bool] = None,
    has_phone: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin)
):
    """Get collected marketing contacts"""
    query = {}
    if source:
        query["source"] = source
    if has_email:
        query["email"] = {"$exists": True, "$ne": None}
    if has_phone:
        query["phone"] = {"$exists": True, "$ne": None}
    
    contacts = await db.marketing_contacts.find(query, {"_id": 0}).sort("collected_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.marketing_contacts.count_documents(query)
    
    total_emails = await db.marketing_contacts.count_documents({"email": {"$exists": True, "$ne": None}})
    total_phones = await db.marketing_contacts.count_documents({"phone": {"$exists": True, "$ne": None}})
    
    return {
        "contacts": contacts,
        "total": total,
        "stats": {
            "total_contacts": await db.marketing_contacts.count_documents({}),
            "total_emails": total_emails,
            "total_phones": total_phones
        }
    }

@router.post("/campaign")
async def send_marketing_campaign(request: Request, user: User = Depends(require_admin)):
    """Send a marketing campaign (email or SMS)"""
    body = await request.json()
    campaign_type = body.get("type")
    subject = body.get("subject")
    message = body.get("message")
    target = body.get("target", "all")
    
    query = {"is_subscribed": True}
    if target == "emails_only":
        query["email"] = {"$exists": True, "$ne": None}
    elif target == "phones_only":
        query["phone"] = {"$exists": True, "$ne": None}
    
    contacts = await db.marketing_contacts.find(query, {"_id": 0}).to_list(1000)
    
    sent_count = 0
    if campaign_type == "email":
        for contact in contacts:
            if contact.get("email"):
                try:
                    await send_email_mailersend(
                        to_email=contact["email"],
                        to_name=contact.get("name", ""),
                        subject=subject,
                        html_content=get_email_template(message, subject)
                    )
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Campaign email error: {e}")
    elif campaign_type == "sms":
        for contact in contacts:
            if contact.get("phone"):
                try:
                    await send_sms_notification(contact["phone"], message)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Campaign SMS error: {e}")
    
    # Log campaign
    await db.marketing_campaigns.insert_one({
        "campaign_id": f"CAMP-{secrets.token_hex(4).upper()}",
        "type": campaign_type,
        "subject": subject,
        "message": message,
        "target": target,
        "total_contacts": len(contacts),
        "sent_count": sent_count,
        "created_by": user.email,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "sent": sent_count, "total": len(contacts)}

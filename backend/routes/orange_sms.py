"""
Orange SMS API Integration for Senegal
Supports: SMS sending with custom sender name "GROUPE YAMA"
"""
import os
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sms/orange", tags=["Orange SMS"])

# Orange API Configuration
ORANGE_CLIENT_ID = os.environ.get("ORANGE_CLIENT_ID", "")
ORANGE_CLIENT_SECRET = os.environ.get("ORANGE_CLIENT_SECRET", "")
ORANGE_AUTH_HEADER = os.environ.get("ORANGE_AUTH_HEADER", "")
ORANGE_SENDER_NAME = os.environ.get("ORANGE_SENDER_NAME", "GROUPE YAMA")

# Orange API URLs
ORANGE_TOKEN_URL = "https://api.orange.com/oauth/v3/token"
ORANGE_SMS_URL = "https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B2210000/requests"

# Cache for access token
_token_cache = {
    "access_token": None,
    "expires_at": None
}


def get_db():
    """Get database instance"""
    from server import db
    return db


async def get_current_user(request):
    """Get current user from request"""
    from server import get_current_user as _get_current_user
    return await _get_current_user(request)


class SMSRequest(BaseModel):
    phone: str  # Format: +221XXXXXXXXX or 221XXXXXXXXX or 7XXXXXXXX
    message: str


class BulkSMSRequest(BaseModel):
    phones: list[str]
    message: str


async def get_orange_access_token() -> str:
    """Get OAuth access token from Orange API"""
    global _token_cache
    
    # Check if cached token is still valid
    if _token_cache["access_token"] and _token_cache["expires_at"]:
        if datetime.now(timezone.utc).timestamp() < _token_cache["expires_at"]:
            return _token_cache["access_token"]
    
    # Get new token
    if not ORANGE_AUTH_HEADER:
        raise HTTPException(status_code=500, detail="Orange API non configurée")
    
    headers = {
        "Authorization": ORANGE_AUTH_HEADER,
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = "grant_type=client_credentials"
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(ORANGE_TOKEN_URL, headers=headers, content=data)
        
        if response.status_code != 200:
            logger.error(f"Orange token error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=502, detail="Erreur d'authentification Orange")
        
        result = response.json()
        access_token = result.get("access_token")
        expires_in = result.get("expires_in", 3600)
        
        # Cache the token
        _token_cache["access_token"] = access_token
        _token_cache["expires_at"] = datetime.now(timezone.utc).timestamp() + expires_in - 60  # 1 min buffer
        
        logger.info("Orange access token obtained successfully")
        return access_token


def format_phone_number(phone: str) -> str:
    """Format phone number to international format for Orange API"""
    # Remove spaces, dashes, and other characters
    phone = phone.replace(" ", "").replace("-", "").replace(".", "")
    
    # Handle different formats
    if phone.startswith("+221"):
        return phone
    elif phone.startswith("00221"):
        return "+" + phone[2:]
    elif phone.startswith("221"):
        return "+" + phone
    elif phone.startswith("7") or phone.startswith("6"):
        return "+221" + phone
    elif phone.startswith("0"):
        return "+221" + phone[1:]
    else:
        return "+221" + phone


async def send_sms(phone: str, message: str) -> dict:
    """Send SMS via Orange API"""
    
    access_token = await get_orange_access_token()
    
    formatted_phone = format_phone_number(phone)
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Orange SMS API payload
    payload = {
        "outboundSMSMessageRequest": {
            "address": f"tel:{formatted_phone}",
            "senderAddress": "tel:+2210000",
            "senderName": ORANGE_SENDER_NAME,
            "outboundSMSTextMessage": {
                "message": message
            }
        }
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(ORANGE_SMS_URL, headers=headers, json=payload)
        
        logger.info(f"Orange SMS response: {response.status_code} - {response.text[:500]}")
        
        if response.status_code in [200, 201]:
            return {
                "success": True,
                "phone": formatted_phone,
                "message_id": response.json().get("outboundSMSMessageRequest", {}).get("resourceURL", "")
            }
        else:
            error_msg = response.json() if response.text else {"error": "Unknown error"}
            logger.error(f"Orange SMS error: {error_msg}")
            return {
                "success": False,
                "phone": formatted_phone,
                "error": str(error_msg)
            }


@router.post("/send")
async def send_single_sms(sms: SMSRequest, request: Request):
    """Send a single SMS message"""
    db = get_db()
    user = await get_current_user(request)
    
    # Admin only
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    result = await send_sms(sms.phone, sms.message)
    
    # Log the SMS
    await db.sms_logs.insert_one({
        "phone": sms.phone,
        "message": sms.message,
        "status": "sent" if result["success"] else "failed",
        "provider": "orange",
        "response": result,
        "sent_by": user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=f"Erreur d'envoi: {result.get('error')}")
    
    return {
        "message": "SMS envoyé avec succès",
        "phone": result["phone"]
    }


@router.post("/send-bulk")
async def send_bulk_sms(bulk: BulkSMSRequest, request: Request):
    """Send SMS to multiple recipients"""
    db = get_db()
    user = await get_current_user(request)
    
    # Admin only
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    results = []
    success_count = 0
    fail_count = 0
    
    for phone in bulk.phones:
        result = await send_sms(phone, bulk.message)
        results.append(result)
        
        if result["success"]:
            success_count += 1
        else:
            fail_count += 1
        
        # Log each SMS
        await db.sms_logs.insert_one({
            "phone": phone,
            "message": bulk.message,
            "status": "sent" if result["success"] else "failed",
            "provider": "orange",
            "response": result,
            "sent_by": user.user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {
        "message": f"{success_count} SMS envoyés, {fail_count} échecs",
        "success_count": success_count,
        "fail_count": fail_count,
        "results": results
    }


@router.post("/send-order-confirmation")
async def send_order_sms(order_id: str, request: Request):
    """Send order confirmation SMS to customer"""
    db = get_db()
    user = await get_current_user(request)
    
    # Admin only
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Get order
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    # Get customer phone
    phone = order.get("shipping", {}).get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="Numéro de téléphone non disponible")
    
    # Format message
    customer_name = order.get("shipping", {}).get("full_name", "").split()[0] if order.get("shipping", {}).get("full_name") else "Client"
    total = order.get("total", 0)
    
    message = f"""GROUPE YAMA+
Bonjour {customer_name},
Votre commande #{order_id} ({total:,} FCFA) a été confirmée.
Livraison sous 24-48h à Dakar.
Questions? +221 78 382 75 75
Merci!""".replace(",", " ")
    
    result = await send_sms(phone, message)
    
    # Log
    await db.sms_logs.insert_one({
        "phone": phone,
        "message": message,
        "order_id": order_id,
        "status": "sent" if result["success"] else "failed",
        "provider": "orange",
        "response": result,
        "sent_by": user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=f"Erreur d'envoi: {result.get('error')}")
    
    return {
        "message": "SMS de confirmation envoyé",
        "phone": result["phone"],
        "order_id": order_id
    }


@router.get("/logs")
async def get_sms_logs(request: Request, limit: int = 50):
    """Get SMS sending logs (Admin only)"""
    db = get_db()
    user = await get_current_user(request)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    logs = await db.sms_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Stats
    total_sent = await db.sms_logs.count_documents({"status": "sent"})
    total_failed = await db.sms_logs.count_documents({"status": "failed"})
    
    return {
        "logs": logs,
        "stats": {
            "total_sent": total_sent,
            "total_failed": total_failed
        }
    }


@router.get("/test-token")
async def test_orange_token(request: Request):
    """Test Orange API connection (Admin only)"""
    db = get_db()
    user = await get_current_user(request)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    try:
        token = await get_orange_access_token()
        return {
            "success": True,
            "message": "Connexion Orange API réussie",
            "token_preview": token[:20] + "..." if token else None
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

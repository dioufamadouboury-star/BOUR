"""
WhatsApp Cloud API Integration for GROUPE YAMA+
Sends automated order confirmations via Meta's WhatsApp Business API.

Required environment variables:
- META_ACCESS_TOKEN: System user token from Meta Business Settings
- META_PHONE_NUMBER_ID: WhatsApp Business phone number ID
- META_API_VERSION: Graph API version (default: v23.0)
- WA_TEMPLATE_NAME: Approved template name (default: order_confirmation)
- WA_TEMPLATE_LANGUAGE: Template language (default: fr)

Setup instructions:
1. Create a Meta for Developers account
2. Create an app with WhatsApp Business API
3. Create and approve an order_confirmation template
4. Generate a system user token with whatsapp_business_messaging permission
"""

import os
import logging
import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])

# Meta WhatsApp Cloud API Configuration
META_TOKEN = os.environ.get("META_ACCESS_TOKEN", "")
PHONE_NUMBER_ID = os.environ.get("META_PHONE_NUMBER_ID", "")
API_VERSION = os.environ.get("META_API_VERSION", "v23.0")
TEMPLATE_NAME = os.environ.get("WA_TEMPLATE_NAME", "order_confirmation")
TEMPLATE_LANGUAGE = os.environ.get("WA_TEMPLATE_LANGUAGE", "fr")
VERIFY_TOKEN = os.environ.get("WA_VERIFY_TOKEN", "yamaplus_webhook_verify_2024")

# Store name and contact
STORE_NAME = "GROUPE YAMA+"
STORE_PHONE = "+221 78 382 75 75"
SITE_URL = os.environ.get("SITE_URL", "https://groupeyamaplus.com")


def is_whatsapp_configured() -> bool:
    """Check if WhatsApp Cloud API is configured"""
    return bool(META_TOKEN and PHONE_NUMBER_ID)


def format_phone_e164(phone: str) -> str:
    """Format phone number to E.164 format for WhatsApp"""
    clean = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    if not clean.startswith("+"):
        if clean.startswith("00"):
            clean = "+" + clean[2:]
        elif clean.startswith("221"):
            clean = "+" + clean
        elif clean.startswith("7") or clean.startswith("0"):
            clean = "+221" + clean.lstrip("0")
        else:
            clean = "+221" + clean
    
    return clean


async def send_whatsapp_template(
    to_phone: str,
    template_name: str,
    template_params: list[dict],
    language: str = "fr"
) -> dict:
    """
    Send a WhatsApp template message via Meta Cloud API.
    
    Args:
        to_phone: Recipient phone in E.164 format
        template_name: Approved template name
        template_params: List of parameter objects for template body
        language: Template language code
    
    Returns:
        Meta API response with message ID
    """
    if not is_whatsapp_configured():
        logger.warning("WhatsApp Cloud API not configured. Message not sent.")
        return {"success": False, "error": "WhatsApp not configured"}
    
    url = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages"
    
    # Remove + for Graph API
    recipient = to_phone.replace("+", "")
    
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language},
            "components": [
                {
                    "type": "body",
                    "parameters": template_params
                }
            ]
        }
    }
    
    headers = {
        "Authorization": f"Bearer {META_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, json=payload, headers=headers)
            
        if response.is_error:
            error_data = response.json()
            logger.error(f"WhatsApp API error: {error_data}")
            return {"success": False, "error": error_data.get("error", {}).get("message", "Unknown error")}
        
        result = response.json()
        message_id = result.get("messages", [{}])[0].get("id")
        
        logger.info(f"WhatsApp message sent successfully: {message_id}")
        return {"success": True, "message_id": message_id, "response": result}
        
    except httpx.TimeoutException:
        logger.error("WhatsApp API timeout")
        return {"success": False, "error": "Request timeout"}
    except Exception as e:
        logger.error(f"WhatsApp send error: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_order_confirmation_whatsapp(order: dict, db) -> dict:
    """
    Send order confirmation via WhatsApp Cloud API.
    Falls back to queuing for manual send if API not configured.
    
    Args:
        order: Order document from MongoDB
        db: Database connection
    
    Returns:
        Result dict with success status
    """
    import secrets
    
    phone = order.get("shipping", {}).get("phone", "")
    if not phone:
        return {"success": False, "error": "No phone number"}
    
    clean_phone = format_phone_e164(phone)
    order_id = order.get("order_id", "")
    customer_name = order.get("shipping", {}).get("full_name", "Client").split()[0]
    total = order.get("total", 0)
    
    # Format items for message
    items = order.get("items", [])
    items_summary = ""
    if items:
        first_item = items[0].get("name", "Produit")[:30]
        qty = items[0].get("quantity", 1)
        items_summary = f"{first_item} x{qty}"
        if len(items) > 1:
            items_summary += f" +{len(items)-1} autre(s)"
    
    total_formatted = f"{total:,}".replace(",", " ")
    tracking_url = f"{SITE_URL}/order/{order_id}"
    
    # If WhatsApp Cloud API is configured, send automatically
    if is_whatsapp_configured():
        # Template parameters (must match your approved template)
        # Example template: "Bonjour {{1}}, votre commande #{{2}} est confirmée! {{3}} - Total: {{4}} FCFA. Suivi: {{5}}"
        params = [
            {"type": "text", "text": customer_name},
            {"type": "text", "text": order_id},
            {"type": "text", "text": items_summary},
            {"type": "text", "text": total_formatted},
            {"type": "text", "text": tracking_url}
        ]
        
        result = await send_whatsapp_template(
            to_phone=clean_phone,
            template_name=TEMPLATE_NAME,
            template_params=params,
            language=TEMPLATE_LANGUAGE
        )
        
        if result.get("success"):
            # Log successful send
            await db.whatsapp_notifications.insert_one({
                "notification_id": f"WA-{secrets.token_hex(4).upper()}",
                "type": "order_confirmation",
                "order_id": order_id,
                "phone": clean_phone,
                "status": "sent",
                "message_id": result.get("message_id"),
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            return result
    
    # Fallback: Queue for manual send via WhatsApp Web link
    message = f"""🎉 *Commande confirmée - {STORE_NAME}*

Bonjour {customer_name},

Votre commande *#{order_id}* a bien été confirmée.

📦 *Produit(s):* {items_summary}
💰 *Total:* {total_formatted} FCFA

🔗 *Suivi:* {tracking_url}

Livraison sous 24-48h à Dakar.

📞 Questions ? Répondez à ce message.

Merci pour votre confiance !
_L'équipe {STORE_NAME}_"""
    
    # Generate WhatsApp click-to-chat link
    encoded_message = message.replace("\n", "%0A").replace(" ", "%20").replace("*", "").replace("_", "")
    whatsapp_link = f"https://wa.me/{clean_phone.replace('+', '')}?text={encoded_message}"
    
    # Store for manual sending
    await db.whatsapp_notifications.insert_one({
        "notification_id": f"WA-{secrets.token_hex(4).upper()}",
        "type": "order_confirmation",
        "order_id": order_id,
        "phone": clean_phone,
        "message": message,
        "whatsapp_link": whatsapp_link,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"WhatsApp notification queued for manual send: {order_id}")
    return {"success": True, "queued": True, "whatsapp_link": whatsapp_link}


# ============== API Routes ==============

@router.get("/status")
async def whatsapp_status():
    """Check WhatsApp Cloud API configuration status"""
    return {
        "configured": is_whatsapp_configured(),
        "api_version": API_VERSION,
        "template_name": TEMPLATE_NAME,
        "template_language": TEMPLATE_LANGUAGE,
        "phone_configured": bool(PHONE_NUMBER_ID)
    }


@router.get("/webhook")
async def verify_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    Meta webhook verification endpoint.
    Called by Meta when setting up webhooks.
    """
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully")
        return int(hub_challenge or "0")
    
    logger.warning(f"WhatsApp webhook verification failed: mode={hub_mode}, token_match={hub_verify_token == VERIFY_TOKEN}")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_webhook(request: Request):
    """
    Receive webhook events from Meta WhatsApp Cloud API.
    Handles message status updates (sent, delivered, read).
    """
    try:
        body = await request.json()
        
        # Import db here to avoid circular imports
        from server import db
        
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                
                # Handle status updates
                for status in value.get("statuses", []):
                    message_id = status.get("id")
                    status_value = status.get("status")  # sent, delivered, read, failed
                    
                    if message_id and status_value:
                        await db.whatsapp_notifications.update_one(
                            {"message_id": message_id},
                            {
                                "$set": {
                                    "status": status_value,
                                    "status_updated_at": datetime.now(timezone.utc).isoformat()
                                }
                            }
                        )
                        logger.info(f"WhatsApp message {message_id} status: {status_value}")
                
                # Handle incoming messages (optional - for customer replies)
                for msg in value.get("messages", []):
                    from_phone = msg.get("from")
                    msg_body = msg.get("text", {}).get("body", "")
                    
                    if from_phone and msg_body:
                        # Store incoming message for admin review
                        await db.whatsapp_messages.insert_one({
                            "from": from_phone,
                            "body": msg_body,
                            "type": msg.get("type"),
                            "timestamp": msg.get("timestamp"),
                            "received_at": datetime.now(timezone.utc).isoformat()
                        })
                        logger.info(f"Received WhatsApp message from {from_phone}")
        
        return {"ok": True}
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {str(e)}")
        return {"ok": True}  # Always return 200 to prevent Meta retries


@router.get("/pending")
async def get_pending_notifications(limit: int = 20):
    """Get pending WhatsApp notifications for manual sending"""
    from server import db
    
    notifications = await db.whatsapp_notifications.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"notifications": notifications, "count": len(notifications)}


@router.post("/mark-sent/{notification_id}")
async def mark_notification_sent(notification_id: str):
    """Mark a notification as manually sent"""
    from server import db
    
    result = await db.whatsapp_notifications.update_one(
        {"notification_id": notification_id},
        {
            "$set": {
                "status": "manual_sent",
                "sent_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True, "notification_id": notification_id}

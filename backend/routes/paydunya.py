"""
PayDunya Payment Integration for Senegal
Supports: Wave, Orange Money, Card, Free Money, Expresso, Djamo
"""
import os
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments/paydunya", tags=["PayDunya Payments"])

# PayDunya Configuration
PAYDUNYA_MODE = os.environ.get("PAYDUNYA_MODE", "test")
PAYDUNYA_MASTER_KEY = os.environ.get("PAYDUNYA_MASTER_KEY", "")
PAYDUNYA_PRIVATE_KEY = os.environ.get("PAYDUNYA_PRIVATE_KEY", "")
PAYDUNYA_TOKEN = os.environ.get("PAYDUNYA_TOKEN", "")
PAYDUNYA_PUBLIC_KEY = os.environ.get("PAYDUNYA_PUBLIC_KEY", "")

# API URLs
PAYDUNYA_API_ROOT = (
    "https://app.paydunya.com/api/v1"
    if PAYDUNYA_MODE == "live"
    else "https://app.paydunya.com/sandbox-api/v1"
)

# Manager notification settings
MANAGER_EMAIL = os.environ.get("MANAGER_EMAIL", "")
MANAGER_WHATSAPP = os.environ.get("MANAGER_WHATSAPP", "")

# Store info
STORE_NAME = "GROUPE YAMA+"
SITE_URL = os.environ.get("SITE_URL", "https://groupeyamaplus.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://groupeyamaplus.com")


class PayDunyaCheckoutRequest(BaseModel):
    order_id: str
    success_url: str
    cancel_url: str
    payment_channel: Optional[str] = None  # card, wave-senegal, orange-money-senegal, etc.


class PayDunyaClient:
    """Async client for PayDunya API"""
    
    def __init__(self):
        self.headers = {
            "Content-Type": "application/json",
            "PAYDUNYA-MASTER-KEY": PAYDUNYA_MASTER_KEY,
            "PAYDUNYA-PRIVATE-KEY": PAYDUNYA_PRIVATE_KEY,
            "PAYDUNYA-TOKEN": PAYDUNYA_TOKEN,
        }
    
    async def create_invoice(self, body: dict) -> dict:
        """Create a payment invoice"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{PAYDUNYA_API_ROOT}/checkout-invoice/create",
                headers=self.headers,
                json=body
            )
            response.raise_for_status()
            return response.json()
    
    async def confirm_payment(self, token: str) -> dict:
        """Confirm payment status by token"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{PAYDUNYA_API_ROOT}/checkout-invoice/confirm/{token}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()


paydunya_client = PayDunyaClient()


def get_db():
    """Get database instance - imported from main server"""
    from server import db
    return db


async def send_manager_notification(order: dict, payment_status: str):
    """Send notification to manager via email and create WhatsApp link"""
    from server import send_email_async, db
    
    order_id = order.get("order_id", "N/A")
    total = order.get("total", 0)
    shipping = order.get("shipping", {})
    items = order.get("items", [])
    payment_method = order.get("payment_method_used", order.get("payment_method", "N/A"))
    
    # Format items list
    items_text = "\n".join([
        f"• {item.get('name', 'Produit')} x{item.get('quantity', 1)} : {item.get('price', 0):,} FCFA".replace(',', ' ')
        for item in items
    ])
    
    # Status emoji
    status_emoji = "✅" if payment_status == "paid" else "❌" if payment_status == "failed" else "⏳"
    status_text = {
        "paid": "Paiement réussi",
        "failed": "Paiement échoué",
        "pending": "En attente de paiement",
        "cancelled": "Paiement annulé"
    }.get(payment_status, payment_status)
    
    # Email to manager
    if MANAGER_EMAIL:
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
                <h1 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 15px;">
                    {status_emoji} Nouvelle commande - {status_text}
                </h1>
                
                <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Commande #{order_id}</h3>
                    <p><strong>Statut:</strong> {status_text}</p>
                    <p><strong>Mode de paiement:</strong> {payment_method}</p>
                </div>
                
                <h3>📦 Produits commandés:</h3>
                <div style="background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px;">
                    {items_text.replace(chr(10), '<br>')}
                </div>
                
                <div style="margin: 20px 0; padding: 15px; background: #f0f7ff; border-radius: 8px;">
                    <p><strong>Sous-total:</strong> {order.get('subtotal', 0):,} FCFA</p>
                    <p><strong>Livraison:</strong> {order.get('shipping_cost', 0):,} FCFA</p>
                    <p style="font-size: 1.2em; font-weight: bold; color: #000;">
                        <strong>Total:</strong> {total:,} FCFA
                    </p>
                </div>
                
                <h3>👤 Informations client:</h3>
                <div style="background: #f8f8f8; padding: 15px; border-radius: 8px;">
                    <p><strong>Nom:</strong> {shipping.get('full_name', 'N/A')}</p>
                    <p><strong>Téléphone:</strong> {shipping.get('phone', 'N/A')}</p>
                    <p><strong>Email:</strong> {shipping.get('email', 'N/A')}</p>
                    <p><strong>Adresse:</strong> {shipping.get('address', 'N/A')}</p>
                    <p><strong>Ville:</strong> {shipping.get('city', 'N/A')}</p>
                    <p><strong>Région:</strong> {shipping.get('region', 'N/A')}</p>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <a href="{SITE_URL}/admin" style="background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                        Voir dans l'Admin
                    </a>
                </div>
            </div>
        </body>
        </html>
        """.replace(',', ' ')
        
        subject = f"{status_emoji} Commande #{order_id} - {status_text} - GROUPE YAMA+"
        await send_email_async(MANAGER_EMAIL, subject, html_content)
        logger.info(f"Manager email sent to {MANAGER_EMAIL} for order {order_id}")
    
    # Create WhatsApp notification for manager
    if MANAGER_WHATSAPP:
        clean_phone = MANAGER_WHATSAPP.replace(" ", "").replace("-", "")
        if not clean_phone.startswith("+"):
            clean_phone = "+221" + clean_phone.lstrip("0")
        
        whatsapp_message = f"""🛒 *Nouvelle commande - GROUPE YAMA+*

*Commande:* #{order_id}
*Statut:* {status_text}
*Mode de paiement:* {payment_method}

*Produits:*
{items_text}

*Sous-total:* {order.get('subtotal', 0):,} FCFA
*Livraison:* {order.get('shipping_cost', 0):,} FCFA
*Total:* {total:,} FCFA

*Informations client:*
Nom: {shipping.get('full_name', 'N/A')}
Téléphone: {shipping.get('phone', 'N/A')}
Adresse: {shipping.get('address', 'N/A')}
Ville: {shipping.get('city', 'N/A')}
Région: {shipping.get('region', 'N/A')}
""".replace(',', ' ')
        
        encoded_message = whatsapp_message.replace("\n", "%0A").replace(" ", "%20").replace("*", "")
        whatsapp_link = f"https://wa.me/{clean_phone.replace('+', '')}?text={encoded_message}"
        
        await db.manager_notifications.insert_one({
            "notification_id": f"MGR-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "type": "order_notification",
            "order_id": order_id,
            "payment_status": payment_status,
            "phone": clean_phone,
            "message": whatsapp_message,
            "whatsapp_link": whatsapp_link,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Manager WhatsApp notification queued for order {order_id}")


async def update_order_payment_status(order_id: str, status: str, payment_method: str = None, provider_data: dict = None):
    """Update order payment status and send appropriate notifications"""
    db = get_db()
    
    # Determine order status based on payment
    order_status_map = {
        "paid": "processing",
        "completed": "processing",
        "failed": "payment_failed",
        "cancelled": "cancelled",
        "pending": "pending"
    }
    
    update_data = {
        "payment_status": status if status != "completed" else "paid",
        "order_status": order_status_map.get(status, "pending"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if payment_method:
        update_data["payment_method_used"] = payment_method
    
    if status in ["paid", "completed"]:
        update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
    
    if provider_data:
        update_data["paydunya_response"] = provider_data
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": update_data}
    )
    
    if result.modified_count > 0:
        # Get updated order for notifications
        order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
        if order:
            # Send manager notification
            await send_manager_notification(order, status if status != "completed" else "paid")
            
            # If payment successful, send customer confirmation
            if status in ["paid", "completed"]:
                from server import send_order_confirmation_email, send_order_whatsapp_confirmation
                import asyncio
                
                # Send email confirmation
                asyncio.create_task(send_order_confirmation_email(order))
                
                # Send WhatsApp confirmation
                customer_phone = order.get("shipping", {}).get("phone")
                if customer_phone:
                    asyncio.create_task(send_order_whatsapp_confirmation(order, customer_phone))
                    
                    # Send SMS confirmation via Orange
                    asyncio.create_task(send_order_sms_confirmation(order, customer_phone))
    
    return result.modified_count > 0


async def send_order_sms_confirmation(order: dict, phone: str):
    """Send SMS confirmation to customer via Orange API"""
    try:
        from routes.orange_sms import send_sms
        
        order_id = order.get("order_id", "")
        total = order.get("total", 0)
        
        # Get customer first name from full_name
        full_name = order.get("shipping", {}).get("full_name", "")
        customer_name = full_name.split()[0] if full_name else "Client"
        
        # Get product(s) info - show up to 2 products
        items = order.get("items", [])
        products_text = ""
        if items:
            first_item = items[0]
            product_name = first_item.get("name", "Produit")[:30]  # Limit to 30 chars
            qty = first_item.get("quantity", 1)
            products_text = f"{product_name} x{qty}"
            
            if len(items) > 1:
                products_text += f" +{len(items)-1} autre(s)"
        
        # Build tracking link
        from server import SITE_URL
        tracking_link = f"{SITE_URL}/order/{order_id}"
        
        # Format total without comma (for SMS compatibility)
        total_formatted = f"{total:,}".replace(",", " ")
        
        message = f"""GROUPE YAMA+
Bonjour {customer_name}, commande #{order_id} confirmee!
{products_text}
Total: {total_formatted} FCFA
Livraison 24-48h Dakar
Suivi: {tracking_link}
Assistance: +221 78 382 75 75
Merci!"""
        
        result = await send_sms(phone, message)
        
        if result.get("success"):
            logger.info(f"SMS confirmation sent for order {order_id} to {phone}")
        else:
            logger.error(f"Failed to send SMS for order {order_id}: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Error sending SMS confirmation: {str(e)}")


@router.post("/initiate")
async def initiate_paydunya_payment(request: PayDunyaCheckoutRequest):
    """Initiate a PayDunya payment (Wave, Orange Money, Card, etc.)"""
    
    if not PAYDUNYA_MASTER_KEY or not PAYDUNYA_PRIVATE_KEY:
        raise HTTPException(status_code=500, detail="PayDunya API non configurée")
    
    db = get_db()
    
    # Get order details
    order = await db.orders.find_one({"order_id": request.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    total_amount = order.get("total", 0)
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Montant de commande invalide")
    
    # Check if payment already initiated
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Cette commande a déjà été payée")
    
    # Prepare item description
    items = order.get("items", [])
    item_description = ", ".join([
        f"{item.get('name', 'Produit')[:30]} x{item.get('quantity', 1)}"
        for item in items[:3]
    ])
    if len(items) > 3:
        item_description += f" +{len(items) - 3} autres"
    
    # Get customer info
    shipping = order.get("shipping", {})
    
    # Build callback URL
    backend_url = os.environ.get("SITE_URL", FRONTEND_URL)
    callback_url = f"{backend_url}/api/payments/paydunya/callback"
    
    # Determine channels based on payment_channel
    # If specific channel requested, use only that channel
    if request.payment_channel:
        channels = [request.payment_channel]
    else:
        channels = [
            "wave-senegal",
            "orange-money-senegal",
            "card",
            "free-money-senegal",
            "expresso-sn",
            "djamo-sn"
        ]
    
    # Prepare PayDunya invoice
    invoice_body = {
        "invoice": {
            "total_amount": int(total_amount),
            "description": f"Commande GROUPE YAMA+ - {item_description}",
            "channels": channels,
            "customer": {
                "name": shipping.get("full_name", ""),
                "email": shipping.get("email", ""),
                "phone": shipping.get("phone", "")
            }
        },
        "store": {
            "name": STORE_NAME
        },
        "custom_data": {
            "order_id": request.order_id,
            "amount": total_amount,
            "payment_channel": request.payment_channel or "all"
        },
        "actions": {
            "return_url": request.success_url,
            "cancel_url": request.cancel_url,
            "callback_url": callback_url
        }
    }
    
    # If card payment is selected, add target_payment to force card UI display
    # This is required by PayDunya to display the card payment option on the checkout page
    if request.payment_channel == "card":
        invoice_body["invoice"]["target_payment"] = "Carte Bancaire"
        logger.info(f"Card payment requested - adding target_payment parameter")
    
    logger.info(f"PayDunya payment initiation for order {request.order_id}: {total_amount} FCFA, channels: {channels}")
    
    try:
        result = await paydunya_client.create_invoice(invoice_body)
        
        if result.get("response_code") == "00":
            checkout_url = result.get("response_text")
            token = result.get("token")
            
            if not checkout_url or not token:
                raise HTTPException(status_code=502, detail="Réponse PayDunya invalide")
            
            # Store payment reference
            await db.orders.update_one(
                {"order_id": request.order_id},
                {"$set": {
                    "paydunya_token": token,
                    "payment_initiated_at": datetime.now(timezone.utc).isoformat(),
                    "payment_provider": "paydunya"
                }}
            )
            
            # Log payment attempt
            await db.payment_attempts.insert_one({
                "order_id": request.order_id,
                "provider": "paydunya",
                "token": token,
                "amount": total_amount,
                "status": "initiated",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            return {
                "success": True,
                "checkout_url": checkout_url,
                "token": token
            }
        else:
            error_msg = result.get("response_text", "Erreur lors de la création du paiement")
            logger.error(f"PayDunya error: {error_msg}")
            raise HTTPException(status_code=400, detail=f"Erreur PayDunya: {error_msg}")
            
    except httpx.HTTPError as e:
        logger.error(f"PayDunya connection error: {str(e)}")
        raise HTTPException(status_code=502, detail="Erreur de connexion à PayDunya")


@router.post("/callback")
async def paydunya_callback(request: Request):
    """Handle PayDunya IPN (Instant Payment Notification) callback"""
    
    db = get_db()
    
    try:
        # PayDunya sends form-encoded data with JSON in 'data' field
        form_data = await request.form()
        raw_data = form_data.get("data")
        
        if not raw_data:
            # Try JSON body
            try:
                data = await request.json()
            except Exception:
                logger.error("PayDunya callback: No data received")
                return JSONResponse(content={"status": "error", "message": "No data"}, status_code=400)
        else:
            data = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
        
        logger.info(f"PayDunya callback received: {json.dumps(data, default=str)[:500]}")
        
        # Verify signature (SHA-512 of master key)
        expected_hash = hashlib.sha512(PAYDUNYA_MASTER_KEY.encode()).hexdigest()
        received_hash = data.get("hash", "")
        
        if received_hash and received_hash != expected_hash:
            logger.error("PayDunya callback: Invalid signature")
            return JSONResponse(content={"status": "error", "message": "Invalid signature"}, status_code=403)
        
        # Extract payment info
        status = str(data.get("status", "")).lower()
        invoice_data = data.get("invoice", {})
        token = invoice_data.get("token") or data.get("token")
        custom_data = data.get("custom_data", {})
        order_id = custom_data.get("order_id")
        
        # If no order_id in custom_data, try to find by token
        if not order_id and token:
            order = await db.orders.find_one({"paydunya_token": token}, {"_id": 0})
            if order:
                order_id = order.get("order_id")
        
        if not order_id:
            logger.error("PayDunya callback: No order_id found")
            return JSONResponse(content={"status": "error", "message": "Order not found"}, status_code=404)
        
        # Get payment method from response
        payment_method = data.get("actions", {}).get("payment_method", "PayDunya")
        
        # Map PayDunya status to our status
        status_map = {
            "completed": "paid",
            "pending": "pending",
            "cancelled": "cancelled",
            "failed": "failed"
        }
        our_status = status_map.get(status, status)
        
        # Update order status
        updated = await update_order_payment_status(
            order_id=order_id,
            status=our_status,
            payment_method=payment_method,
            provider_data=data
        )
        
        # Log payment result
        await db.payment_attempts.update_one(
            {"order_id": order_id, "provider": "paydunya"},
            {"$set": {
                "status": our_status,
                "payment_method": payment_method,
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "provider_response": data
            }},
            upsert=True
        )
        
        logger.info(f"PayDunya callback processed: order={order_id}, status={our_status}")
        return JSONResponse(content={"status": "OK"})
        
    except Exception as e:
        logger.error(f"PayDunya callback error: {str(e)}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)


@router.get("/verify/{order_id}")
async def verify_paydunya_payment(order_id: str):
    """Verify payment status for an order"""
    
    db = get_db()
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    result = {
        "order_id": order_id,
        "payment_status": order.get("payment_status", "pending"),
        "order_status": order.get("order_status", "pending"),
        "payment_method": order.get("payment_method_used"),
        "paid_at": order.get("paid_at")
    }
    
    # If we have a PayDunya token, verify with provider
    token = order.get("paydunya_token")
    if token and order.get("payment_status") == "pending":
        try:
            provider_result = await paydunya_client.confirm_payment(token)
            provider_status = str(provider_result.get("status", "")).lower()
            
            if provider_status in ["completed", "paid"]:
                # Update order if payment completed
                await update_order_payment_status(
                    order_id=order_id,
                    status="paid",
                    payment_method=provider_result.get("payment_method", "PayDunya"),
                    provider_data=provider_result
                )
                result["payment_status"] = "paid"
                result["order_status"] = "processing"
                
        except httpx.HTTPError as e:
            logger.error(f"PayDunya verification error: {str(e)}")
    
    return result


@router.get("/methods")
async def get_payment_methods():
    """Get available payment methods"""
    return {
        "methods": [
            {
                "id": "wave",
                "name": "Wave",
                "channel": "wave-senegal",
                "icon": "/assets/images/payment_wave.webp"
            },
            {
                "id": "orange_money",
                "name": "Orange Money",
                "channel": "orange-money-senegal",
                "icon": "/assets/images/payment_orange_money.png"
            },
            {
                "id": "card",
                "name": "Carte Bancaire",
                "channel": "card",
                "description": "Visa, Mastercard",
                "icons": ["/assets/images/payment_visa.png", "/assets/images/payment_mastercard.svg"]
            },
            {
                "id": "free_money",
                "name": "Free Money",
                "channel": "free-money-senegal",
                "icon": "/assets/images/payment_free.png"
            },
            {
                "id": "expresso",
                "name": "Expresso",
                "channel": "expresso-sn"
            },
            {
                "id": "djamo",
                "name": "Djamo",
                "channel": "djamo-sn"
            }
        ]
    }


@router.post("/retry/{order_id}")
async def retry_payment(order_id: str, request: Request):
    """Retry payment for a failed/pending order"""
    db = get_db()
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    # Only allow retry for pending or failed payments
    if order.get("payment_status") in ["paid", "cod_pending"]:
        raise HTTPException(status_code=400, detail="Cette commande est déjà confirmée")
    
    body = await request.json()
    success_url = body.get("success_url", f"{FRONTEND_URL}/order/{order_id}?payment=success")
    cancel_url = body.get("cancel_url", f"{FRONTEND_URL}/order/{order_id}?payment=cancelled")
    payment_channel = body.get("payment_channel")
    
    # Create new payment request
    checkout_request = PayDunyaCheckoutRequest(
        order_id=order_id,
        success_url=success_url,
        cancel_url=cancel_url,
        payment_channel=payment_channel
    )
    
    # Track retry attempt
    await db.orders.update_one(
        {"order_id": order_id},
        {
            "$inc": {"payment_retry_count": 1},
            "$set": {"last_payment_attempt": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return await initiate_paydunya_payment(checkout_request)


@router.post("/switch-to-cod/{order_id}")
async def switch_to_cod(order_id: str):
    """Switch a failed/pending payment order to Cash on Delivery"""
    db = get_db()
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    # Only allow switch for pending or failed payments
    if order.get("payment_status") in ["paid", "cod_pending"]:
        raise HTTPException(status_code=400, detail="Cette commande est déjà confirmée")
    
    # Update order to COD
    await db.orders.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "payment_method": "cash",
                "payment_status": "cod_pending",
                "order_status": "confirmed",
                "switched_to_cod": True,
                "switched_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Reload updated order
    updated_order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    # Send confirmations
    from server import send_order_confirmation_email, send_order_whatsapp_confirmation, send_order_sms_orange
    import asyncio
    
    asyncio.create_task(send_order_confirmation_email(updated_order))
    
    customer_phone = updated_order.get("shipping", {}).get("phone")
    if customer_phone:
        asyncio.create_task(send_order_whatsapp_confirmation(updated_order, customer_phone))
        asyncio.create_task(send_order_sms_orange(updated_order, customer_phone))
    
    # Send manager notification
    asyncio.create_task(send_manager_notification(updated_order, "cod_pending"))
    
    logger.info(f"Order {order_id} switched to Cash on Delivery")
    
    return {
        "success": True,
        "message": "Commande confirmée en paiement à la livraison",
        "order_id": order_id,
        "payment_status": "cod_pending"
    }


@router.get("/pending-orders/{phone}")
async def get_pending_orders_by_phone(phone: str):
    """Get pending payment orders for a customer by phone number"""
    db = get_db()
    
    # Clean phone number
    clean_phone = phone.replace(" ", "").replace("-", "")
    if not clean_phone.startswith("+"):
        if clean_phone.startswith("221"):
            clean_phone = f"+{clean_phone}"
        elif clean_phone.startswith("7") or clean_phone.startswith("0"):
            clean_phone = f"+221{clean_phone.lstrip('0')}"
    
    # Find pending orders
    orders = await db.orders.find({
        "$or": [
            {"shipping.phone": {"$regex": phone.replace("+", "\\+"), "$options": "i"}},
            {"shipping.phone": {"$regex": clean_phone.replace("+", "\\+"), "$options": "i"}}
        ],
        "payment_status": {"$in": ["pending", "failed", "awaiting_payment"]}
    }, {"_id": 0}).sort("created_at", -1).to_list(10)
    
    return {
        "orders": orders,
        "count": len(orders)
    }


"""
Orders Routes Module
Handles order creation, retrieval, and tracking
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import secrets
import asyncio

router = APIRouter(prefix="/api", tags=["orders"])

# Dependencies injected from main server
db = None
get_current_user = None
require_auth = None
send_order_confirmation_email = None
send_admin_order_notification = None
track_purchase = None
send_push_to_user = None
SITE_URL = ""

def init_orders_routes(database, user_getter, auth_dep, email_fn, admin_notif_fn, track_fn, push_fn, site_url):
    """Initialize module with dependencies"""
    global db, get_current_user, require_auth, send_order_confirmation_email
    global send_admin_order_notification, track_purchase, send_push_to_user, SITE_URL
    db = database
    get_current_user = user_getter
    require_auth = auth_dep
    send_order_confirmation_email = email_fn
    send_admin_order_notification = admin_notif_fn
    track_purchase = track_fn
    send_push_to_user = push_fn
    SITE_URL = site_url


class OrderItem(BaseModel):
    product_id: str
    quantity: int
    name: str = ""
    price: int = 0
    image: str = ""


class ShippingInfo(BaseModel):
    full_name: str
    phone: str
    email: str = ""
    address: str
    city: str
    region: str = ""
    postal_code: str = ""


class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping: ShippingInfo
    payment_method: str = "cash_on_delivery"
    subtotal: int = 0
    shipping_cost: int = 0
    discount: int = 0
    total: int = 0
    promo_code: Optional[str] = None
    notes: str = ""
    reseller_code: Optional[str] = None


class Order(BaseModel):
    order_id: str
    user_id: Optional[str] = None
    items: List[OrderItem]
    shipping: ShippingInfo
    payment_method: str
    payment_status: str = "pending"
    order_status: str = "pending"
    subtotal: int = 0
    shipping_cost: int = 0
    discount: int = 0
    total: int
    promo_code: Optional[str] = None
    notes: str = ""
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, request: Request):
    user = await get_current_user(request)
    
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc)
    
    order_doc = order_data.model_dump()
    order_doc["order_id"] = order_id
    order_doc["user_id"] = user.user_id if user else None
    order_doc["payment_status"] = "pending"
    order_doc["order_status"] = "pending"
    order_doc["created_at"] = now.isoformat()
    
    # Check for reseller referral
    reseller_code = order_data.reseller_code or request.headers.get("X-Reseller-Code")
    if reseller_code:
        reseller = await db.resellers.find_one({"reseller_code": reseller_code, "is_active": True})
        if reseller:
            order_doc["reseller_code"] = reseller_code
            order_doc["reseller_id"] = reseller["reseller_id"]
            order_doc["reseller_commission_rate"] = reseller["commission_rate"]
            commission = order_doc.get("total", 0) * (reseller["commission_rate"] / 100)
            order_doc["reseller_commission"] = commission
            
            await db.resellers.update_one(
                {"reseller_id": reseller["reseller_id"]},
                {
                    "$inc": {
                        "total_sales": order_doc.get("total", 0),
                        "total_commission": commission,
                        "pending_commission": commission
                    }
                }
            )
            
            await db.reseller_commissions.insert_one({
                "commission_id": f"COM-{secrets.token_hex(4).upper()}",
                "reseller_id": reseller["reseller_id"],
                "order_id": order_id,
                "type": "earning",
                "amount": commission,
                "order_total": order_doc.get("total", 0),
                "commission_rate": reseller["commission_rate"],
                "created_at": now.isoformat()
            })
    
    # Update stock
    for item in order_data.items:
        await db.products.update_one(
            {"product_id": item.product_id},
            {"$inc": {"stock": -item.quantity}}
        )
    
    await db.orders.insert_one(order_doc)
    
    # Clear user's cart
    if user:
        await db.carts.delete_one({"user_id": user.user_id})
    
    # Async notifications
    if send_order_confirmation_email:
        asyncio.create_task(send_order_confirmation_email(order_doc))
    if send_admin_order_notification:
        asyncio.create_task(send_admin_order_notification(order_doc))
    if track_purchase:
        asyncio.create_task(track_purchase(order_doc))
    if user and send_push_to_user:
        asyncio.create_task(send_push_to_user(
            user.user_id,
            "Commande confirmée !",
            f"Votre commande #{order_id} a été reçue.",
            f"{SITE_URL}/order/{order_id}"
        ))
    
    order_doc["created_at"] = now
    return order_doc


@router.get("/orders")
async def get_user_orders(user = Depends(lambda: require_auth)):
    orders = await db.orders.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders


@router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    """Get order details - public for basic tracking, full for owner/admin"""
    user = await get_current_user(request)
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    is_owner = user and (user.role == "admin" or order.get("user_id") == user.user_id)
    
    if not is_owner:
        return {
            "order_id": order.get("order_id"),
            "order_status": order.get("order_status"),
            "payment_status": order.get("payment_status"),
            "payment_method": order.get("payment_method"),
            "total": order.get("total"),
            "shipping_cost": order.get("shipping_cost"),
            "created_at": order.get("created_at"),
            "status_history": order.get("status_history", []),
            "items": [{"name": item.get("name"), "quantity": item.get("quantity"), "image": item.get("image")} for item in order.get("items", [])],
            "shipping": {
                "city": order.get("shipping", {}).get("city"),
                "region": order.get("shipping", {}).get("region"),
            }
        }
    
    return order


@router.get("/orders/track")
async def track_order(order_id: str, email: str):
    """Public endpoint to track order by order_id and email"""
    order = await db.orders.find_one({"order_id": order_id.upper()}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    order_email = order.get("shipping", {}).get("email") or order.get("customer_email")
    
    if order.get("user_id"):
        user = await db.users.find_one({"user_id": order["user_id"]}, {"_id": 0, "email": 1})
        if user:
            order_email = user.get("email")
    
    shipping_email = order.get("shipping", {}).get("email")
    email_lower = email.lower().strip()
    valid_email = False
    
    if order_email and order_email.lower() == email_lower:
        valid_email = True
    if shipping_email and shipping_email.lower() == email_lower:
        valid_email = True
    
    shipping_phone = order.get("shipping", {}).get("phone", "")
    if shipping_phone and email_lower in shipping_phone.replace(" ", ""):
        valid_email = True
    
    if not valid_email:
        raise HTTPException(status_code=404, detail="Commande non trouvée pour cet email")
    
    status_mapping = {
        "pending": "pending",
        "confirmed": "processing",
        "processing": "processing",
        "shipped": "shipped",
        "delivered": "delivered",
        "cancelled": "cancelled"
    }
    
    tracking_status = status_mapping.get(order.get("order_status", "pending"), "pending")
    
    return {
        "order_id": order["order_id"],
        "status": tracking_status,
        "order_status": order.get("order_status", "pending"),
        "payment_status": order.get("payment_status", "pending"),
        "created_at": order.get("created_at"),
        "items": order.get("items", []),
        "shipping": {
            "name": order.get("shipping", {}).get("full_name"),
            "address": order.get("shipping", {}).get("address"),
            "city": order.get("shipping", {}).get("city"),
            "region": order.get("shipping", {}).get("region"),
            "phone": order.get("shipping", {}).get("phone")
        },
        "subtotal": order.get("subtotal", 0),
        "shipping_cost": order.get("shipping_cost", 0),
        "discount": order.get("discount", 0),
        "total": order.get("total", 0)
    }

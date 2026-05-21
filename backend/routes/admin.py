"""
Admin Routes Module
Handles admin dashboard, analytics, orders management, users, and exports
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from typing import Optional
import io
import asyncio

router = APIRouter(prefix="/api", tags=["admin"])

# Dependencies injected from main server
db = None
require_admin = None
send_shipping_email = None
send_order_status_update_email = None
track_order_status = None
send_push_to_user = None
SITE_URL = ""

def init_admin_routes(
    database, 
    admin_dep,
    shipping_email_fn=None,
    status_email_fn=None,
    track_fn=None,
    push_fn=None,
    site_url=""
):
    """Initialize module with dependencies"""
    global db, require_admin, send_shipping_email, send_order_status_update_email
    global track_order_status, send_push_to_user, SITE_URL
    db = database
    require_admin = admin_dep
    send_shipping_email = shipping_email_fn
    send_order_status_update_email = status_email_fn
    track_order_status = track_fn
    send_push_to_user = push_fn
    SITE_URL = site_url


# ============== ANALYTICS ==============

@router.get("/admin/analytics")
async def get_analytics(
    period: str = "month",
    user = Depends(lambda: require_admin)
):
    """Get comprehensive analytics data"""
    now = datetime.now(timezone.utc)
    
    if period == "day":
        period_start = now - timedelta(days=1)
    elif period == "week":
        period_start = now - timedelta(weeks=1)
    elif period == "month":
        period_start = now - timedelta(days=30)
    else:
        period_start = now - timedelta(days=365)
    
    period_start_str = period_start.isoformat()
    
    orders_in_period = await db.orders.find({
        "created_at": {"$gte": period_start_str}
    }, {"_id": 0}).to_list(10000)
    
    total_orders = len(orders_in_period)
    total_revenue = sum(o.get("total", 0) for o in orders_in_period)
    paid_orders = [o for o in orders_in_period if o.get("payment_status") == "paid"]
    paid_revenue = sum(o.get("total", 0) for o in paid_orders)
    
    status_counts = {}
    for order in orders_in_period:
        status = order.get("order_status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    daily_data = {}
    for order in orders_in_period:
        date_str = order.get("created_at", "")[:10]
        if date_str:
            if date_str not in daily_data:
                daily_data[date_str] = {"orders": 0, "revenue": 0}
            daily_data[date_str]["orders"] += 1
            daily_data[date_str]["revenue"] += order.get("total", 0)
    
    daily_chart = [
        {"date": date, "orders": data["orders"], "revenue": data["revenue"]}
        for date, data in sorted(daily_data.items())
    ]
    
    product_sales = {}
    for order in orders_in_period:
        for item in order.get("items", []):
            pid = item.get("product_id", item.get("name", "unknown"))
            if pid not in product_sales:
                product_sales[pid] = {
                    "product_id": pid,
                    "name": item.get("name", "Produit"),
                    "quantity": 0,
                    "revenue": 0
                }
            product_sales[pid]["quantity"] += item.get("quantity", 1)
            product_sales[pid]["revenue"] += item.get("price", 0) * item.get("quantity", 1)
    
    top_products = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:10]
    
    payment_methods = {}
    for order in orders_in_period:
        method = order.get("payment_method", "unknown")
        payment_methods[method] = payment_methods.get(method, 0) + 1
    
    prev_period_start = period_start - (now - period_start)
    prev_orders = await db.orders.find({
        "created_at": {"$gte": prev_period_start.isoformat(), "$lt": period_start_str}
    }, {"_id": 0, "total": 1}).to_list(10000)
    prev_revenue = sum(o.get("total", 0) for o in prev_orders)
    prev_order_count = len(prev_orders)
    
    revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
    orders_growth = ((total_orders - prev_order_count) / prev_order_count * 100) if prev_order_count > 0 else 0
    
    total_customers = await db.users.count_documents({})
    newsletter_subs = await db.newsletter.count_documents({"active": True})
    
    low_stock = await db.products.find(
        {"stock": {"$lte": 5, "$gt": 0}},
        {"_id": 0, "product_id": 1, "name": 1, "stock": 1}
    ).to_list(20)
    
    out_of_stock = await db.products.count_documents({"stock": {"$lte": 0}})
    
    return {
        "period": period,
        "summary": {
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "paid_revenue": paid_revenue,
            "average_order_value": total_revenue // total_orders if total_orders > 0 else 0,
            "revenue_growth": round(revenue_growth, 1),
            "orders_growth": round(orders_growth, 1)
        },
        "orders_by_status": status_counts,
        "payment_methods": payment_methods,
        "daily_chart": daily_chart[-30:],
        "top_products": top_products,
        "customers": {
            "total": total_customers,
            "newsletter_subscribers": newsletter_subs
        },
        "inventory": {
            "low_stock_products": low_stock,
            "out_of_stock_count": out_of_stock
        }
    }


# ============== ORDERS MANAGEMENT ==============

@router.get("/admin/orders")
async def get_all_orders(
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    user = Depends(lambda: require_admin)
):
    query = {}
    if status:
        query["order_status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    total = await db.orders.count_documents(query)
    
    return {"orders": orders, "total": total}


@router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    request: Request,
    user = Depends(lambda: require_admin)
):
    body = await request.json()
    order_status = body.get("order_status")
    payment_status = body.get("payment_status")
    note = body.get("note", "")
    
    update_doc = {}
    if order_status:
        update_doc["order_status"] = order_status
    if payment_status:
        update_doc["payment_status"] = payment_status
    
    if not update_doc:
        raise HTTPException(status_code=400, detail="Aucune mise à jour fournie")
    
    history_entry = {
        "status": order_status or payment_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": note
    }
    
    result = await db.orders.update_one(
        {"order_id": order_id}, 
        {
            "$set": update_doc,
            "$push": {"status_history": history_entry}
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if track_order_status and order and order_status:
        asyncio.create_task(track_order_status(order_id, order_status, order.get("user_id")))
    
    if order_status == "shipped" and send_shipping_email:
        shipping_email = order.get("shipping", {}).get("email")
        if shipping_email:
            asyncio.create_task(send_shipping_email(shipping_email, order_id, note))
    
    elif order_status in ["processing", "delivered", "cancelled"] and send_order_status_update_email:
        shipping_email = order.get("shipping", {}).get("email")
        if shipping_email:
            asyncio.create_task(send_order_status_update_email(shipping_email, order_id, order_status, note))
    
    if order and order.get("user_id") and send_push_to_user:
        status_messages = {
            "processing": ("📦 Commande en préparation", f"Votre commande #{order_id} est en cours de préparation."),
            "shipped": ("🚚 Commande expédiée", f"Votre commande #{order_id} est en route !"),
            "delivered": ("✅ Commande livrée", f"Votre commande #{order_id} a été livrée. Merci !"),
            "cancelled": ("❌ Commande annulée", f"Votre commande #{order_id} a été annulée.")
        }
        if order_status in status_messages:
            title, body = status_messages[order_status]
            asyncio.create_task(send_push_to_user(
                order.get("user_id"),
                title,
                body,
                f"{SITE_URL}/order/{order_id}"
            ))
    
    return {"message": "Statut mis à jour"}


@router.get("/admin/stats")
async def get_admin_stats(user = Depends(lambda: require_admin)):
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"order_status": "pending"})
    total_products = await db.products.count_documents({})
    total_users = await db.users.count_documents({})
    
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_products": total_products,
        "total_users": total_users,
        "total_revenue": total_revenue
    }


# ============== USERS MANAGEMENT ==============

@router.get("/admin/users")
async def get_all_users(
    limit: int = 50,
    skip: int = 0,
    user = Depends(lambda: require_admin)
):
    users = await db.users.find({}, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total}


# ============== EXPORTS ==============

@router.get("/admin/export/orders")
async def export_orders_csv(user = Depends(lambda: require_admin)):
    """Export all orders as CSV"""
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    if not orders:
        return Response(content="Aucune commande", media_type="text/plain")
    
    output = io.StringIO()
    output.write("order_id,date,client,email,telephone,adresse,ville,total,statut,methode_paiement\n")
    
    for order in orders:
        shipping = order.get("shipping", {})
        date = order.get("created_at", "")[:10] if order.get("created_at") else ""
        row = [
            order.get("order_id", ""),
            date,
            shipping.get("full_name", "").replace(",", " "),
            shipping.get("email", ""),
            shipping.get("phone", ""),
            shipping.get("address", "").replace(",", " "),
            shipping.get("city", ""),
            str(order.get("total", 0)),
            order.get("order_status", ""),
            order.get("payment_method", "")
        ]
        output.write(",".join(row) + "\n")
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=commandes_yama.csv"}
    )


@router.get("/admin/export/clients")
async def export_clients_csv(user = Depends(lambda: require_admin)):
    """Export all clients as CSV"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(1000)
    
    if not users:
        return Response(content="Aucun client", media_type="text/plain")
    
    output = io.StringIO()
    output.write("user_id,nom,email,telephone,date_inscription,role,commandes\n")
    
    for u in users:
        order_count = await db.orders.count_documents({"user_id": u.get("user_id")})
        date = u.get("created_at", "")[:10] if u.get("created_at") else ""
        row = [
            u.get("user_id", ""),
            u.get("name", "").replace(",", " "),
            u.get("email", ""),
            u.get("phone", ""),
            date,
            u.get("role", "customer"),
            str(order_count)
        ]
        output.write(",".join(row) + "\n")
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=clients_yama.csv"}
    )


# ============== RESELLERS ADMIN ==============

@router.get("/admin/resellers")
async def get_all_resellers(user = Depends(lambda: require_admin)):
    """Get all resellers for admin"""
    resellers = await db.resellers.find({}, {"_id": 0, "hashed_password": 0}).sort("created_at", -1).to_list(100)
    return {"resellers": resellers}


@router.put("/admin/resellers/{reseller_id}")
async def update_reseller(reseller_id: str, request: Request, user = Depends(lambda: require_admin)):
    """Update reseller status or commission rate"""
    body = await request.json()
    
    update_data = {}
    if "is_active" in body:
        update_data["is_active"] = body["is_active"]
    if "commission_rate" in body:
        update_data["commission_rate"] = body["commission_rate"]
    if "status" in body:
        update_data["status"] = body["status"]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune mise à jour")
    
    result = await db.resellers.update_one(
        {"reseller_id": reseller_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Revendeur non trouvé")
    
    return {"message": "Revendeur mis à jour"}


@router.get("/admin/resellers/withdrawals")
async def get_withdrawal_requests(user = Depends(lambda: require_admin)):
    """Get all withdrawal requests"""
    withdrawals = await db.reseller_withdrawals.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"withdrawals": withdrawals}


@router.put("/admin/resellers/withdrawals/{withdrawal_id}")
async def process_withdrawal(withdrawal_id: str, request: Request, user = Depends(lambda: require_admin)):
    """Process a withdrawal request"""
    body = await request.json()
    status = body.get("status")  # approved, rejected
    
    withdrawal = await db.reseller_withdrawals.find_one({"withdrawal_id": withdrawal_id})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    await db.reseller_withdrawals.update_one(
        {"withdrawal_id": withdrawal_id},
        {"$set": {"status": status, "processed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if status == "approved":
        amount = withdrawal.get("amount", 0)
        await db.resellers.update_one(
            {"reseller_id": withdrawal["reseller_id"]},
            {
                "$inc": {
                    "pending_commission": -amount,
                    "paid_commission": amount
                }
            }
        )
    
    return {"message": f"Demande {status}"}


# ============== NEWSLETTER ADMIN ==============

@router.get("/admin/newsletter/subscribers")
async def get_newsletter_subscribers(user = Depends(lambda: require_admin)):
    """Get all newsletter subscribers"""
    subscribers = await db.newsletter.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(1000)
    return {"subscribers": subscribers, "total": len(subscribers)}


@router.get("/admin/export/newsletter")
async def export_newsletter_csv(user = Depends(lambda: require_admin)):
    """Export newsletter subscribers as CSV"""
    subscribers = await db.newsletter.find({}, {"_id": 0}).to_list(10000)
    
    output = io.StringIO()
    output.write("email,nom,date_inscription,source,actif\n")
    
    for sub in subscribers:
        row = [
            sub.get("email", ""),
            sub.get("name", "").replace(",", " "),
            sub.get("subscribed_at", "")[:10] if sub.get("subscribed_at") else "",
            sub.get("source", "website"),
            "Oui" if sub.get("active", True) else "Non"
        ]
        output.write(",".join(row) + "\n")
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=newsletter_yama.csv"}
    )

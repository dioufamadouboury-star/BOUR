"""
B2B Portal Routes Module
Handles B2B client/partner portal: quotes, wholesale pricing, bulk orders, partner dashboard
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Response
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import jwt
import bcrypt
import asyncio

router = APIRouter(prefix="/api", tags=["b2b"])

# Dependencies injected from main server
db = None
JWT_SECRET = ""
JWT_ALGORITHM = "HS256"
SITE_URL = ""
send_email_async = None
get_email_template = None
ADMIN_NOTIFICATION_EMAIL = ""

def init_b2b_routes(database, jwt_secret, jwt_algorithm, site_url, email_fn=None, template_fn=None, admin_email=""):
    """Initialize module with dependencies"""
    global db, JWT_SECRET, JWT_ALGORITHM, SITE_URL, send_email_async, get_email_template, ADMIN_NOTIFICATION_EMAIL
    db = database
    JWT_SECRET = jwt_secret
    JWT_ALGORITHM = jwt_algorithm
    SITE_URL = site_url
    send_email_async = email_fn
    get_email_template = template_fn
    ADMIN_NOTIFICATION_EMAIL = admin_email


# ============== MODELS ==============

class B2BPartnerRegister(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: str
    password: str
    business_type: str = "retailer"  # retailer, wholesaler, enterprise
    ninea: Optional[str] = None  # Tax ID
    rccm: Optional[str] = None   # Business registration
    address: str = ""
    city: str = "Dakar"
    description: str = ""


class QuoteRequest(BaseModel):
    items: List[dict]  # [{product_id, quantity}]
    notes: str = ""
    delivery_address: str = ""
    delivery_city: str = "Dakar"


class BulkOrderCreate(BaseModel):
    quote_id: Optional[str] = None
    items: List[dict]
    shipping_address: str
    shipping_city: str
    payment_method: str = "bank_transfer"
    notes: str = ""


# ============== WHOLESALE PRICING ==============

WHOLESALE_TIERS = [
    {"min_qty": 1, "max_qty": 9, "discount": 0, "label": "Standard"},
    {"min_qty": 10, "max_qty": 24, "discount": 5, "label": "Bronze"},
    {"min_qty": 25, "max_qty": 49, "discount": 10, "label": "Argent"},
    {"min_qty": 50, "max_qty": 99, "discount": 15, "label": "Or"},
    {"min_qty": 100, "max_qty": 999999, "discount": 20, "label": "Platine"},
]

def get_wholesale_price(base_price: int, quantity: int) -> dict:
    """Calculate wholesale price based on quantity"""
    for tier in WHOLESALE_TIERS:
        if tier["min_qty"] <= quantity <= tier["max_qty"]:
            discount = tier["discount"]
            unit_price = base_price * (100 - discount) // 100
            return {
                "unit_price": unit_price,
                "total_price": unit_price * quantity,
                "discount_percent": discount,
                "tier": tier["label"],
                "savings": (base_price - unit_price) * quantity
            }
    return {"unit_price": base_price, "total_price": base_price * quantity, "discount_percent": 0, "tier": "Standard", "savings": 0}


# ============== PARTNER AUTHENTICATION ==============

async def get_current_partner(request: Request) -> dict:
    """Get current B2B partner from token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "b2b_partner":
            raise HTTPException(status_code=403, detail="Accès non autorisé")
        
        partner = await db.b2b_partners.find_one(
            {"partner_id": payload["partner_id"]},
            {"_id": 0, "hashed_password": 0}
        )
        if not partner:
            raise HTTPException(status_code=404, detail="Partenaire non trouvé")
        if not partner.get("is_active"):
            raise HTTPException(status_code=403, detail="Compte désactivé")
        return partner
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


@router.post("/b2b/register")
async def register_b2b_partner(data: B2BPartnerRegister):
    """Register a new B2B partner"""
    existing = await db.b2b_partners.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    partner_id = f"B2B-{uuid.uuid4().hex[:8].upper()}"
    partner_code = f"PRO{secrets.token_hex(3).upper()}"
    hashed_password = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    now = datetime.now(timezone.utc).isoformat()
    
    partner_doc = {
        "partner_id": partner_id,
        "partner_code": partner_code,
        "company_name": data.company_name,
        "contact_name": data.contact_name,
        "email": data.email.lower(),
        "phone": data.phone,
        "hashed_password": hashed_password,
        "business_type": data.business_type,
        "ninea": data.ninea,
        "rccm": data.rccm,
        "address": data.address,
        "city": data.city,
        "description": data.description,
        "status": "pending",  # pending, approved, rejected
        "is_active": False,
        "credit_limit": 0,
        "current_credit": 0,
        "discount_tier": "standard",
        "total_orders": 0,
        "total_spent": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.b2b_partners.insert_one(partner_doc)
    
    # Notify admin
    if send_email_async and ADMIN_NOTIFICATION_EMAIL:
        html = f"""
        <h2>🏢 Nouvelle demande partenaire B2B</h2>
        <p><strong>Entreprise:</strong> {data.company_name}</p>
        <p><strong>Contact:</strong> {data.contact_name}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Téléphone:</strong> {data.phone}</p>
        <p><strong>Type:</strong> {data.business_type}</p>
        <p><strong>NINEA:</strong> {data.ninea or 'Non fourni'}</p>
        <p><strong>RCCM:</strong> {data.rccm or 'Non fourni'}</p>
        <hr/>
        <p>Connectez-vous à l'admin pour approuver cette demande.</p>
        """
        asyncio.create_task(send_email_async(
            to=ADMIN_NOTIFICATION_EMAIL,
            subject=f"🏢 Nouvelle demande B2B - {data.company_name}",
            html=get_email_template(html, "Demande B2B") if get_email_template else html
        ))
    
    return {"message": "Demande envoyée. Vous serez contacté après validation.", "partner_id": partner_id}


@router.post("/b2b/login")
async def login_b2b_partner(request: Request):
    """B2B partner login"""
    body = await request.json()
    email = body.get("email", "").lower()
    password = body.get("password", "")
    
    partner = await db.b2b_partners.find_one({"email": email})
    if not partner:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not bcrypt.checkpw(password.encode(), partner["hashed_password"].encode()):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if partner.get("status") == "pending":
        raise HTTPException(status_code=403, detail="Votre compte est en attente de validation")
    
    if not partner.get("is_active"):
        raise HTTPException(status_code=403, detail="Compte désactivé")
    
    token = jwt.encode({
        "partner_id": partner["partner_id"],
        "email": email,
        "type": "b2b_partner",
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    await db.b2b_partners.update_one(
        {"partner_id": partner["partner_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "token": token,
        "partner": {
            "partner_id": partner["partner_id"],
            "partner_code": partner["partner_code"],
            "company_name": partner["company_name"],
            "contact_name": partner["contact_name"],
            "email": partner["email"],
            "business_type": partner["business_type"],
            "discount_tier": partner.get("discount_tier", "standard"),
            "credit_limit": partner.get("credit_limit", 0)
        }
    }


@router.get("/b2b/me")
async def get_partner_profile(request: Request):
    """Get current partner profile"""
    partner = await get_current_partner(request)
    return {"partner": partner}


# ============== B2B DASHBOARD ==============

@router.get("/b2b/dashboard")
async def get_b2b_dashboard(request: Request):
    """Get B2B partner dashboard data"""
    partner = await get_current_partner(request)
    
    # Get orders
    orders = await db.b2b_orders.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Get quotes
    quotes = await db.b2b_quotes.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    # Stats
    total_orders = len(orders)
    total_spent = sum(o.get("total", 0) for o in orders)
    pending_orders = len([o for o in orders if o.get("status") == "pending"])
    
    # This month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_orders = [o for o in orders if o.get("created_at", "") >= month_start.isoformat()]
    this_month_spent = sum(o.get("total", 0) for o in this_month_orders)
    
    return {
        "partner": partner,
        "stats": {
            "total_orders": total_orders,
            "total_spent": total_spent,
            "pending_orders": pending_orders,
            "this_month_orders": len(this_month_orders),
            "this_month_spent": this_month_spent,
            "credit_available": partner.get("credit_limit", 0) - partner.get("current_credit", 0)
        },
        "recent_orders": orders[:10],
        "pending_quotes": [q for q in quotes if q.get("status") == "pending"][:5],
        "wholesale_tiers": WHOLESALE_TIERS
    }


# ============== PRODUCTS CATALOG ==============

@router.get("/b2b/products")
async def get_b2b_products(request: Request, category: Optional[str] = None):
    """Get products with wholesale pricing"""
    partner = await get_current_partner(request)
    
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(500)
    
    # Add wholesale pricing info
    for product in products:
        product["wholesale_pricing"] = [
            {
                "min_qty": tier["min_qty"],
                "max_qty": tier["max_qty"],
                "discount": tier["discount"],
                "tier": tier["label"],
                "unit_price": product["price"] * (100 - tier["discount"]) // 100
            }
            for tier in WHOLESALE_TIERS
        ]
    
    return {"products": products}


# ============== QUOTES ==============

@router.post("/b2b/quotes")
async def create_quote_request(data: QuoteRequest, request: Request):
    """Request a quote for bulk order"""
    partner = await get_current_partner(request)
    
    quote_id = f"QT-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate preliminary pricing
    items_with_pricing = []
    subtotal = 0
    
    for item in data.items:
        product = await db.products.find_one({"product_id": item.get("product_id")}, {"_id": 0})
        if product:
            qty = item.get("quantity", 1)
            pricing = get_wholesale_price(product["price"], qty)
            items_with_pricing.append({
                "product_id": product["product_id"],
                "name": product["name"],
                "image": product["images"][0] if product.get("images") else "",
                "quantity": qty,
                "base_price": product["price"],
                "unit_price": pricing["unit_price"],
                "total_price": pricing["total_price"],
                "discount_percent": pricing["discount_percent"],
                "tier": pricing["tier"]
            })
            subtotal += pricing["total_price"]
    
    quote_doc = {
        "quote_id": quote_id,
        "partner_id": partner["partner_id"],
        "company_name": partner["company_name"],
        "contact_email": partner["email"],
        "items": items_with_pricing,
        "subtotal": subtotal,
        "shipping_estimate": 0,  # Admin will fill this
        "total_estimate": subtotal,
        "final_total": None,  # Admin will finalize
        "notes": data.notes,
        "delivery_address": data.delivery_address,
        "delivery_city": data.delivery_city,
        "status": "pending",  # pending, quoted, accepted, rejected, expired
        "valid_until": None,
        "admin_notes": "",
        "created_at": now,
        "updated_at": now
    }
    
    await db.b2b_quotes.insert_one(quote_doc)
    
    # Notify admin
    if send_email_async and ADMIN_NOTIFICATION_EMAIL:
        items_html = "".join([f"<li>{i['name']} x {i['quantity']} = {i['total_price']:,} FCFA</li>" for i in items_with_pricing])
        html = f"""
        <h2>📋 Nouvelle demande de devis B2B</h2>
        <p><strong>Entreprise:</strong> {partner['company_name']}</p>
        <p><strong>Contact:</strong> {partner['contact_name']} ({partner['email']})</p>
        <p><strong>Devis N°:</strong> {quote_id}</p>
        <h3>Articles:</h3>
        <ul>{items_html}</ul>
        <p><strong>Sous-total estimé:</strong> {subtotal:,} FCFA</p>
        <p><strong>Notes:</strong> {data.notes or 'Aucune'}</p>
        """
        asyncio.create_task(send_email_async(
            to=ADMIN_NOTIFICATION_EMAIL,
            subject=f"📋 Devis B2B - {partner['company_name']} - {quote_id}",
            html=get_email_template(html, "Demande de devis") if get_email_template else html
        ))
    
    return {"message": "Demande de devis envoyée", "quote_id": quote_id, "estimate": subtotal}


@router.get("/b2b/quotes")
async def get_partner_quotes(request: Request):
    """Get all quotes for partner"""
    partner = await get_current_partner(request)
    
    quotes = await db.b2b_quotes.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"quotes": quotes}


@router.get("/b2b/quotes/{quote_id}")
async def get_quote_detail(quote_id: str, request: Request):
    """Get quote details"""
    partner = await get_current_partner(request)
    
    quote = await db.b2b_quotes.find_one(
        {"quote_id": quote_id, "partner_id": partner["partner_id"]},
        {"_id": 0}
    )
    
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    return quote


@router.post("/b2b/quotes/{quote_id}/accept")
async def accept_quote(quote_id: str, request: Request):
    """Accept a quote and create order"""
    partner = await get_current_partner(request)
    
    quote = await db.b2b_quotes.find_one(
        {"quote_id": quote_id, "partner_id": partner["partner_id"]},
        {"_id": 0}
    )
    
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    if quote.get("status") != "quoted":
        raise HTTPException(status_code=400, detail="Ce devis n'est pas prêt à être accepté")
    
    if quote.get("valid_until"):
        valid_until = datetime.fromisoformat(quote["valid_until"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > valid_until:
            raise HTTPException(status_code=400, detail="Ce devis a expiré")
    
    # Create B2B order from quote
    order_id = f"B2B-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    order_doc = {
        "order_id": order_id,
        "quote_id": quote_id,
        "partner_id": partner["partner_id"],
        "company_name": partner["company_name"],
        "items": quote["items"],
        "subtotal": quote.get("subtotal", 0),
        "shipping_cost": quote.get("shipping_estimate", 0),
        "total": quote.get("final_total") or quote.get("total_estimate", 0),
        "delivery_address": quote.get("delivery_address", ""),
        "delivery_city": quote.get("delivery_city", ""),
        "status": "pending",  # pending, confirmed, processing, shipped, delivered
        "payment_status": "pending",
        "payment_method": "bank_transfer",
        "created_at": now,
        "updated_at": now
    }
    
    await db.b2b_orders.insert_one(order_doc)
    
    # Update quote status
    await db.b2b_quotes.update_one(
        {"quote_id": quote_id},
        {"$set": {"status": "accepted", "order_id": order_id, "updated_at": now}}
    )
    
    # Update partner stats
    await db.b2b_partners.update_one(
        {"partner_id": partner["partner_id"]},
        {"$inc": {"total_orders": 1}}
    )
    
    return {"message": "Commande créée", "order_id": order_id}


# ============== ORDERS ==============

@router.get("/b2b/orders")
async def get_partner_orders(request: Request):
    """Get all orders for partner"""
    partner = await get_current_partner(request)
    
    orders = await db.b2b_orders.find(
        {"partner_id": partner["partner_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"orders": orders}


@router.get("/b2b/orders/{order_id}")
async def get_order_detail(order_id: str, request: Request):
    """Get order details"""
    partner = await get_current_partner(request)
    
    order = await db.b2b_orders.find_one(
        {"order_id": order_id, "partner_id": partner["partner_id"]},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    return order


# ============== ADMIN B2B MANAGEMENT ==============

@router.get("/admin/b2b/partners")
async def admin_get_partners(request: Request):
    """Get all B2B partners (admin)"""
    # Note: require_admin dependency should be added when integrating
    partners = await db.b2b_partners.find({}, {"_id": 0, "hashed_password": 0}).sort("created_at", -1).to_list(100)
    return {"partners": partners}


@router.put("/admin/b2b/partners/{partner_id}")
async def admin_update_partner(partner_id: str, request: Request):
    """Update B2B partner (admin)"""
    body = await request.json()
    
    update_data = {}
    for field in ["status", "is_active", "credit_limit", "discount_tier"]:
        if field in body:
            update_data[field] = body[field]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune mise à jour")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.b2b_partners.update_one(
        {"partner_id": partner_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partenaire non trouvé")
    
    # If approved, send welcome email
    if body.get("status") == "approved" and body.get("is_active"):
        partner = await db.b2b_partners.find_one({"partner_id": partner_id})
        if partner and send_email_async:
            html = f"""
            <h2>🎉 Bienvenue dans l'espace B2B YAMA+!</h2>
            <p>Bonjour {partner['contact_name']},</p>
            <p>Votre compte partenaire B2B a été approuvé !</p>
            <p>Vous pouvez maintenant accéder à:</p>
            <ul>
                <li>Catalogue produits avec prix de gros</li>
                <li>Demandes de devis</li>
                <li>Commandes en volume</li>
                <li>Suivi de vos commandes</li>
            </ul>
            <p><a href="{SITE_URL}/b2b/login">Connectez-vous ici</a></p>
            """
            asyncio.create_task(send_email_async(
                to=partner["email"],
                subject="🎉 Compte B2B approuvé - GROUPE YAMA+",
                html=get_email_template(html, "Compte approuvé") if get_email_template else html
            ))
    
    return {"message": "Partenaire mis à jour"}


@router.get("/admin/b2b/quotes")
async def admin_get_quotes(request: Request):
    """Get all B2B quotes (admin)"""
    quotes = await db.b2b_quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"quotes": quotes}


@router.put("/admin/b2b/quotes/{quote_id}")
async def admin_update_quote(quote_id: str, request: Request):
    """Update B2B quote (admin) - finalize pricing"""
    body = await request.json()
    
    update_data = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "final_total" in body:
        update_data["final_total"] = body["final_total"]
    if "shipping_estimate" in body:
        update_data["shipping_estimate"] = body["shipping_estimate"]
    if "admin_notes" in body:
        update_data["admin_notes"] = body["admin_notes"]
    if "valid_until" in body:
        update_data["valid_until"] = body["valid_until"]
    if "status" in body:
        update_data["status"] = body["status"]
    
    await db.b2b_quotes.update_one(
        {"quote_id": quote_id},
        {"$set": update_data}
    )
    
    # If status changed to "quoted", notify partner
    if body.get("status") == "quoted":
        quote = await db.b2b_quotes.find_one({"quote_id": quote_id})
        if quote and send_email_async:
            partner = await db.b2b_partners.find_one({"partner_id": quote["partner_id"]})
            if partner:
                html = f"""
                <h2>📋 Votre devis est prêt!</h2>
                <p>Bonjour {partner['contact_name']},</p>
                <p>Votre devis N° <strong>{quote_id}</strong> est prêt.</p>
                <p><strong>Total:</strong> {body.get('final_total', quote.get('total_estimate', 0)):,} FCFA</p>
                <p>Connectez-vous à votre espace B2B pour l'accepter.</p>
                <p><a href="{SITE_URL}/b2b/quotes/{quote_id}">Voir le devis</a></p>
                """
                asyncio.create_task(send_email_async(
                    to=partner["email"],
                    subject=f"📋 Devis prêt - {quote_id}",
                    html=get_email_template(html, "Devis prêt") if get_email_template else html
                ))
    
    return {"message": "Devis mis à jour"}


@router.get("/admin/b2b/orders")
async def admin_get_b2b_orders(request: Request):
    """Get all B2B orders (admin)"""
    orders = await db.b2b_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}


@router.put("/admin/b2b/orders/{order_id}")
async def admin_update_b2b_order(order_id: str, request: Request):
    """Update B2B order status (admin)"""
    body = await request.json()
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    for field in ["status", "payment_status", "tracking_number", "admin_notes"]:
        if field in body:
            update_data[field] = body[field]
    
    await db.b2b_orders.update_one(
        {"order_id": order_id},
        {"$set": update_data}
    )
    
    return {"message": "Commande mise à jour"}

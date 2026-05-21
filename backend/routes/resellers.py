"""
Reseller Portal Routes Module
Handles reseller authentication, dashboard, and commission tracking
"""
from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import secrets
import asyncio

router = APIRouter(prefix="/api", tags=["reseller"])

# Dependencies injected from main server
db = None
JWT_SECRET = ""
JWT_ALGORITHM = "HS256"
SITE_URL = ""
send_email_async = None
get_email_template = None
ADMIN_NOTIFICATION_EMAIL = ""

def init_reseller_routes(database, jwt_secret, jwt_algorithm, site_url, email_fn=None, template_fn=None, admin_email=""):
    """Initialize module with dependencies"""
    global db, JWT_SECRET, JWT_ALGORITHM, SITE_URL, send_email_async, get_email_template, ADMIN_NOTIFICATION_EMAIL
    db = database
    JWT_SECRET = jwt_secret
    JWT_ALGORITHM = jwt_algorithm
    SITE_URL = site_url
    send_email_async = email_fn
    get_email_template = template_fn
    ADMIN_NOTIFICATION_EMAIL = admin_email


async def get_current_reseller(request: Request) -> dict:
    """Get current reseller from token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "reseller":
            raise HTTPException(status_code=403, detail="Accès non autorisé")
        
        reseller = await db.resellers.find_one(
            {"reseller_id": payload["reseller_id"]},
            {"_id": 0, "hashed_password": 0}
        )
        if not reseller:
            raise HTTPException(status_code=404, detail="Revendeur non trouvé")
        return reseller
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


@router.post("/reseller/login")
async def reseller_login(request: Request, response: Response):
    """Reseller login"""
    body = await request.json()
    email = body.get("email", "").lower()
    password = body.get("password", "")
    
    reseller = await db.resellers.find_one({"email": email})
    if not reseller:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not bcrypt.checkpw(password.encode(), reseller["hashed_password"].encode()):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not reseller.get("is_active"):
        raise HTTPException(status_code=403, detail="Compte désactivé")
    
    token = jwt.encode({
        "reseller_id": reseller["reseller_id"],
        "email": email,
        "type": "reseller",
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    await db.resellers.update_one(
        {"reseller_id": reseller["reseller_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "token": token,
        "reseller": {
            "reseller_id": reseller["reseller_id"],
            "reseller_code": reseller["reseller_code"],
            "name": reseller["name"],
            "email": reseller["email"],
            "commission_rate": reseller["commission_rate"],
            "referral_link": reseller["referral_link"]
        }
    }


@router.get("/reseller/me")
async def get_reseller_profile(request: Request):
    """Get current reseller profile"""
    reseller = await get_current_reseller(request)
    return {"reseller": reseller}


@router.get("/reseller/dashboard")
async def get_reseller_dashboard(request: Request):
    """Get reseller dashboard data"""
    reseller = await get_current_reseller(request)
    reseller_code = reseller["reseller_code"]
    
    sales = await db.orders.find(
        {"reseller_code": reseller_code},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    total_sales = sum(s.get("total", 0) for s in sales)
    total_orders = len(sales)
    
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_sales = [s for s in sales if s.get("created_at", "") >= month_start.isoformat()]
    this_month_total = sum(s.get("total", 0) for s in this_month_sales)
    this_month_commission = this_month_total * (reseller["commission_rate"] / 100)
    
    recent_orders = sales[:10]
    
    commissions = await db.reseller_commissions.find(
        {"reseller_id": reseller["reseller_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return {
        "stats": {
            "total_sales": total_sales,
            "total_orders": total_orders,
            "total_commission": reseller.get("total_commission", 0),
            "pending_commission": reseller.get("pending_commission", 0),
            "paid_commission": reseller.get("paid_commission", 0),
            "this_month_sales": this_month_total,
            "this_month_commission": this_month_commission,
            "commission_rate": reseller["commission_rate"]
        },
        "recent_orders": recent_orders,
        "commissions": commissions,
        "referral_link": f"{SITE_URL}/r/{reseller_code}"
    }


@router.get("/reseller/products")
async def get_reseller_products(request: Request):
    """Get products for reseller to share"""
    reseller = await get_current_reseller(request)
    
    products = await db.products.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    
    for product in products:
        product["reseller_link"] = f"{SITE_URL}/product/{product['product_id']}?ref={reseller['reseller_code']}"
    
    return {"products": products}


@router.post("/reseller/withdrawal-request")
async def request_withdrawal(request: Request):
    """Request commission withdrawal"""
    reseller = await get_current_reseller(request)
    body = await request.json()
    
    amount = body.get("amount", 0)
    payment_method = body.get("payment_method", "wave")
    payment_details = body.get("payment_details", "")
    
    pending = reseller.get("pending_commission", 0)
    if amount > pending:
        raise HTTPException(status_code=400, detail=f"Solde insuffisant ({pending} FCFA disponible)")
    
    if amount < 5000:
        raise HTTPException(status_code=400, detail="Retrait minimum: 5000 FCFA")
    
    withdrawal_id = f"WD-{secrets.token_hex(4).upper()}"
    
    await db.reseller_withdrawals.insert_one({
        "withdrawal_id": withdrawal_id,
        "reseller_id": reseller["reseller_id"],
        "amount": amount,
        "payment_method": payment_method,
        "payment_details": payment_details,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "withdrawal_id": withdrawal_id}


@router.get("/r/{reseller_code}")
async def track_referral(reseller_code: str, response: Response):
    """Track referral visit and redirect to home"""
    reseller = await db.resellers.find_one({"reseller_code": reseller_code, "is_active": True})
    if reseller:
        await db.reseller_visits.insert_one({
            "reseller_code": reseller_code,
            "visited_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"reseller_code": reseller_code, "valid": reseller is not None}

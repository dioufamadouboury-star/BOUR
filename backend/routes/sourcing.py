"""
International Sourcing Module
Handles orders from China/Dubai to Senegal with shipping calculations
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import asyncio

router = APIRouter(prefix="/api", tags=["sourcing"])

# Dependencies injected from main server
db = None
send_email_async = None
get_email_template = None
ADMIN_NOTIFICATION_EMAIL = ""
SITE_URL = ""

def init_sourcing_routes(database, email_fn=None, template_fn=None, admin_email="", site_url=""):
    """Initialize module with dependencies"""
    global db, send_email_async, get_email_template, ADMIN_NOTIFICATION_EMAIL, SITE_URL
    db = database
    send_email_async = email_fn
    get_email_template = template_fn
    ADMIN_NOTIFICATION_EMAIL = admin_email
    SITE_URL = site_url


# ============== SHIPPING RATES ==============

SHIPPING_RATES = {
    "air_general": {
        "name": "Avion - Marchandise Générale",
        "icon": "✈️",
        "duration": "8-12 jours",
        "tiers": [
            {"min_kg": 0, "max_kg": 10, "price_per_kg": 8000},
            {"min_kg": 10.01, "max_kg": 50, "price_per_kg": 7000},
            {"min_kg": 50.01, "max_kg": 200, "price_per_kg": 6800},
            {"min_kg": 200.01, "max_kg": 999999, "price_per_kg": 6600},
        ],
        "description": "Transport aérien standard pour marchandises générales"
    },
    "air_sensitive": {
        "name": "Avion - Marchandise Sensible",
        "icon": "✈️",
        "duration": "12-16 jours",
        "tiers": [
            {"min_kg": 0, "max_kg": 10, "price_per_kg": 8000},
            {"min_kg": 10.01, "max_kg": 50, "price_per_kg": 7200},
            {"min_kg": 50.01, "max_kg": 200, "price_per_kg": 7000},
            {"min_kg": 200.01, "max_kg": 999999, "price_per_kg": 6800},
        ],
        "extras": {
            "phone": 300  # +300 CFA par téléphone
        },
        "description": "Transport aérien pour marchandises sensibles (électronique, batteries, etc.)"
    },
    "maritime": {
        "name": "Maritime (par CBM)",
        "icon": "🚢",
        "duration": "30-45 jours",
        "price_per_cbm": None,  # To be configured by admin
        "cbm_to_kg": 167,  # 1 CBM = 167 KG
        "description": "Transport maritime économique pour gros volumes"
    }
}

# Additional fees
EXTRA_FEES = {
    "route_change": 3000,  # Changement de voie de transport
    "formal_customs_min_kg": 100,  # Douane formelle minimum 100KG
    "phone_surcharge": 300,  # Par téléphone
}


# ============== MODELS ==============

class SourcingRequest(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    customer_address: str = ""
    customer_city: str = "Dakar"
    
    # Product info
    product_link: str  # URL du produit (AliExpress, 1688, Taobao, etc.)
    product_name: str = ""
    product_description: str = ""
    quantity: int = 1
    estimated_weight_kg: Optional[float] = None
    estimated_dimensions: Optional[str] = None  # LxWxH en cm
    
    # Shipping preference
    shipping_method: str = "air_general"  # air_general, air_sensitive, maritime
    is_sensitive: bool = False  # Batteries, liquids, etc.
    contains_phones: int = 0  # Number of phones
    
    # Additional notes
    notes: str = ""


class ShippingCalculation(BaseModel):
    weight_kg: float
    shipping_method: str = "air_general"
    contains_phones: int = 0
    length_cm: Optional[float] = None
    width_cm: Optional[float] = None
    height_cm: Optional[float] = None


# ============== SHIPPING CALCULATOR ==============

def calculate_volumetric_weight(length_cm: float, width_cm: float, height_cm: float) -> float:
    """Calculate volumetric weight (1 CBM = 167 KG)"""
    cbm = (length_cm * width_cm * height_cm) / 1000000  # Convert to CBM
    return cbm * 167  # Convert CBM to KG


def get_shipping_cost(weight_kg: float, method: str, contains_phones: int = 0) -> dict:
    """Calculate shipping cost based on weight and method"""
    if method not in SHIPPING_RATES:
        method = "air_general"
    
    rate = SHIPPING_RATES[method]
    
    # Find applicable tier
    price_per_kg = rate["tiers"][-1]["price_per_kg"]  # Default to highest tier
    for tier in rate["tiers"]:
        if tier["min_kg"] <= weight_kg <= tier["max_kg"]:
            price_per_kg = tier["price_per_kg"]
            break
    
    # Calculate base shipping cost
    shipping_cost = int(weight_kg * price_per_kg)
    
    # Add phone surcharge for sensitive method
    phone_surcharge = 0
    if method == "air_sensitive" and contains_phones > 0:
        phone_surcharge = contains_phones * EXTRA_FEES["phone_surcharge"]
    
    total_cost = shipping_cost + phone_surcharge
    
    return {
        "method": method,
        "method_name": rate["name"],
        "duration": rate["duration"],
        "weight_kg": weight_kg,
        "price_per_kg": price_per_kg,
        "base_cost": shipping_cost,
        "phone_surcharge": phone_surcharge,
        "total_shipping_cost": total_cost
    }


@router.get("/sourcing/rates")
async def get_shipping_rates():
    """Get all shipping rates and methods"""
    return {
        "rates": SHIPPING_RATES,
        "extra_fees": EXTRA_FEES,
        "notes": [
            "Le poids facturé dépend de la mesure des colis reçus",
            "1 CBM = 167 KG pour les colis volumineux",
            "Douane formelle en Chine: minimum 100KG",
            "Changement de voie de transport: 3000 CFA/fois",
            "Transport de la Chine au Sénégal, entrepôt à entrepôt, douane et taxe comprises"
        ]
    }


@router.post("/sourcing/calculate")
async def calculate_shipping(data: ShippingCalculation):
    """Calculate shipping cost estimate"""
    actual_weight = data.weight_kg
    
    # Calculate volumetric weight if dimensions provided
    volumetric_weight = None
    if data.length_cm and data.width_cm and data.height_cm:
        volumetric_weight = calculate_volumetric_weight(
            data.length_cm, data.width_cm, data.height_cm
        )
    
    # Use the higher of actual or volumetric weight
    billable_weight = max(actual_weight, volumetric_weight or 0)
    
    # Calculate for all methods
    calculations = {}
    for method_key in ["air_general", "air_sensitive"]:
        calc = get_shipping_cost(billable_weight, method_key, data.contains_phones)
        calculations[method_key] = calc
    
    return {
        "actual_weight_kg": actual_weight,
        "volumetric_weight_kg": volumetric_weight,
        "billable_weight_kg": billable_weight,
        "calculations": calculations,
        "recommended": data.shipping_method,
        "note": "Prix indicatif. Le prix final sera confirmé après réception du colis en entrepôt."
    }


# ============== SOURCING REQUESTS ==============

@router.post("/sourcing/request")
async def create_sourcing_request(data: SourcingRequest):
    """Create a new sourcing/import request"""
    request_id = f"IMP-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate estimated shipping if weight provided
    shipping_estimate = None
    if data.estimated_weight_kg:
        shipping_estimate = get_shipping_cost(
            data.estimated_weight_kg,
            data.shipping_method,
            data.contains_phones
        )
    
    request_doc = {
        "request_id": request_id,
        "customer": {
            "name": data.customer_name,
            "email": data.customer_email,
            "phone": data.customer_phone,
            "address": data.customer_address,
            "city": data.customer_city
        },
        "product": {
            "link": data.product_link,
            "name": data.product_name,
            "description": data.product_description,
            "quantity": data.quantity,
            "estimated_weight_kg": data.estimated_weight_kg,
            "estimated_dimensions": data.estimated_dimensions
        },
        "shipping": {
            "method": data.shipping_method,
            "is_sensitive": data.is_sensitive,
            "contains_phones": data.contains_phones,
            "estimate": shipping_estimate
        },
        "pricing": {
            "product_cost": None,  # Admin will fill
            "shipping_cost": None,  # Admin will fill after weighing
            "commission": None,
            "total": None,
            "deposit_required": None,
            "deposit_paid": False
        },
        "status": "pending",  # pending, quoted, deposit_paid, ordered, in_transit_china, 
                              # arrived_warehouse, shipping_to_senegal, customs, delivered, cancelled
        "tracking": {
            "china_tracking": None,
            "international_tracking": None,
            "events": []
        },
        "notes": data.notes,
        "admin_notes": "",
        "created_at": now,
        "updated_at": now
    }
    
    await db.sourcing_requests.insert_one(request_doc)
    
    # Notify admin
    if send_email_async and ADMIN_NOTIFICATION_EMAIL:
        html = f"""
        <h2>📦 Nouvelle demande d'import Chine</h2>
        <p><strong>Client:</strong> {data.customer_name}</p>
        <p><strong>Téléphone:</strong> {data.customer_phone}</p>
        <p><strong>Email:</strong> {data.customer_email}</p>
        <hr/>
        <p><strong>Lien produit:</strong> <a href="{data.product_link}">{data.product_link}</a></p>
        <p><strong>Quantité:</strong> {data.quantity}</p>
        <p><strong>Poids estimé:</strong> {data.estimated_weight_kg or 'Non spécifié'} kg</p>
        <p><strong>Méthode:</strong> {SHIPPING_RATES.get(data.shipping_method, {}).get('name', data.shipping_method)}</p>
        <p><strong>Téléphones:</strong> {data.contains_phones}</p>
        <hr/>
        <p><strong>Notes:</strong> {data.notes or 'Aucune'}</p>
        """
        asyncio.create_task(send_email_async(
            to=ADMIN_NOTIFICATION_EMAIL,
            subject=f"📦 Import Chine - {data.customer_name} - {request_id}",
            html=get_email_template(html, "Demande d'import") if get_email_template else html
        ))
    
    # Send confirmation to customer
    if send_email_async:
        customer_html = f"""
        <h2>📦 Demande d'import reçue!</h2>
        <p>Bonjour {data.customer_name},</p>
        <p>Votre demande d'import a été enregistrée avec succès.</p>
        <div style="background: #f8f8f8; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p><strong>Numéro de demande:</strong> {request_id}</p>
            <p><strong>Produit:</strong> {data.product_name or 'Voir lien'}</p>
            <p><strong>Quantité:</strong> {data.quantity}</p>
            <p><strong>Méthode de transport:</strong> {SHIPPING_RATES.get(data.shipping_method, {}).get('name', data.shipping_method)}</p>
        </div>
        <p>Notre équipe va analyser votre demande et vous enverra un devis détaillé sous 24-48h.</p>
        <p>Pour suivre votre commande: <a href="{SITE_URL}/sourcing/track/{request_id}">Cliquez ici</a></p>
        """
        asyncio.create_task(send_email_async(
            to=data.customer_email,
            subject=f"📦 Demande d'import reçue - {request_id}",
            html=get_email_template(customer_html, "Confirmation") if get_email_template else customer_html
        ))
    
    return {
        "message": "Demande envoyée avec succès",
        "request_id": request_id,
        "shipping_estimate": shipping_estimate
    }


@router.get("/sourcing/track/{request_id}")
async def track_sourcing_request(request_id: str, email: Optional[str] = None):
    """Track a sourcing request"""
    query = {"request_id": request_id}
    
    request = await db.sourcing_requests.find_one(query, {"_id": 0})
    
    if not request:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    # If email provided, verify it matches
    if email and request.get("customer", {}).get("email", "").lower() != email.lower():
        raise HTTPException(status_code=404, detail="Demande non trouvée pour cet email")
    
    # Return limited info for public tracking
    return {
        "request_id": request["request_id"],
        "status": request["status"],
        "product": {
            "name": request.get("product", {}).get("name", ""),
            "quantity": request.get("product", {}).get("quantity", 1)
        },
        "shipping": {
            "method": request.get("shipping", {}).get("method", ""),
            "method_name": SHIPPING_RATES.get(request.get("shipping", {}).get("method", ""), {}).get("name", "")
        },
        "pricing": {
            "total": request.get("pricing", {}).get("total"),
            "deposit_paid": request.get("pricing", {}).get("deposit_paid", False)
        },
        "tracking": request.get("tracking", {}),
        "created_at": request.get("created_at"),
        "updated_at": request.get("updated_at")
    }


@router.get("/sourcing/my-requests")
async def get_my_requests(email: str, phone: str):
    """Get all requests for a customer"""
    requests = await db.sourcing_requests.find(
        {
            "$or": [
                {"customer.email": email.lower()},
                {"customer.phone": phone}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"requests": requests}


# ============== ADMIN MANAGEMENT ==============

@router.get("/admin/sourcing/requests")
async def admin_get_sourcing_requests(status: Optional[str] = None):
    """Get all sourcing requests (admin)"""
    query = {}
    if status:
        query["status"] = status
    
    requests = await db.sourcing_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"requests": requests}


@router.get("/admin/sourcing/requests/{request_id}")
async def admin_get_request_detail(request_id: str):
    """Get sourcing request details (admin)"""
    request = await db.sourcing_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    return request


@router.put("/admin/sourcing/requests/{request_id}")
async def admin_update_sourcing_request(request_id: str, request: Request):
    """Update sourcing request (admin)"""
    body = await request.json()
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {"updated_at": now}
    
    # Status update
    if "status" in body:
        update_data["status"] = body["status"]
        
        # Add tracking event
        tracking_event = {
            "status": body["status"],
            "timestamp": now,
            "note": body.get("status_note", "")
        }
        await db.sourcing_requests.update_one(
            {"request_id": request_id},
            {"$push": {"tracking.events": tracking_event}}
        )
    
    # Pricing update
    if "product_cost" in body:
        update_data["pricing.product_cost"] = body["product_cost"]
    if "shipping_cost" in body:
        update_data["pricing.shipping_cost"] = body["shipping_cost"]
    if "commission" in body:
        update_data["pricing.commission"] = body["commission"]
    if "total" in body:
        update_data["pricing.total"] = body["total"]
    if "deposit_required" in body:
        update_data["pricing.deposit_required"] = body["deposit_required"]
    if "deposit_paid" in body:
        update_data["pricing.deposit_paid"] = body["deposit_paid"]
    
    # Tracking update
    if "china_tracking" in body:
        update_data["tracking.china_tracking"] = body["china_tracking"]
    if "international_tracking" in body:
        update_data["tracking.international_tracking"] = body["international_tracking"]
    
    # Shipping update
    if "actual_weight_kg" in body:
        update_data["shipping.actual_weight_kg"] = body["actual_weight_kg"]
    if "shipping_method" in body:
        update_data["shipping.method"] = body["shipping_method"]
    
    # Admin notes
    if "admin_notes" in body:
        update_data["admin_notes"] = body["admin_notes"]
    
    result = await db.sourcing_requests.update_one(
        {"request_id": request_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    # Send notification to customer on important status changes
    if body.get("status") in ["quoted", "ordered", "in_transit_china", "arrived_warehouse", "shipping_to_senegal", "customs", "delivered"]:
        req = await db.sourcing_requests.find_one({"request_id": request_id})
        if req and send_email_async:
            customer = req.get("customer", {})
            status_messages = {
                "quoted": ("💰 Devis disponible", "Votre devis est prêt. Connectez-vous pour le consulter et procéder au paiement de l'acompte."),
                "ordered": ("✅ Commande passée", "Votre produit a été commandé auprès du fournisseur."),
                "in_transit_china": ("🚚 En transit Chine", "Votre colis est en route vers notre entrepôt en Chine."),
                "arrived_warehouse": ("📦 Arrivé entrepôt", "Votre colis est arrivé à notre entrepôt en Chine. Préparation pour l'expédition vers le Sénégal."),
                "shipping_to_senegal": ("✈️ En route vers le Sénégal", f"Votre colis est en route! Numéro de suivi: {req.get('tracking', {}).get('international_tracking', 'N/A')}"),
                "customs": ("🛃 En douane", "Votre colis est en cours de dédouanement à Dakar."),
                "delivered": ("🎉 Livré!", "Votre colis a été livré. Merci pour votre confiance!")
            }
            
            if body["status"] in status_messages:
                title, message = status_messages[body["status"]]
                html = f"""
                <h2>{title}</h2>
                <p>Bonjour {customer.get('name', '')},</p>
                <p>{message}</p>
                <p><strong>N° de demande:</strong> {request_id}</p>
                <p><a href="{SITE_URL}/sourcing/track/{request_id}">Suivre ma commande</a></p>
                """
                asyncio.create_task(send_email_async(
                    to=customer.get("email"),
                    subject=f"{title} - {request_id}",
                    html=get_email_template(html, title) if get_email_template else html
                ))
    
    return {"message": "Demande mise à jour"}


@router.get("/admin/sourcing/stats")
async def admin_get_sourcing_stats():
    """Get sourcing statistics (admin)"""
    total = await db.sourcing_requests.count_documents({})
    pending = await db.sourcing_requests.count_documents({"status": "pending"})
    quoted = await db.sourcing_requests.count_documents({"status": "quoted"})
    in_progress = await db.sourcing_requests.count_documents({
        "status": {"$in": ["deposit_paid", "ordered", "in_transit_china", "arrived_warehouse", "shipping_to_senegal", "customs"]}
    })
    delivered = await db.sourcing_requests.count_documents({"status": "delivered"})
    
    # Revenue this month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    pipeline = [
        {"$match": {"status": "delivered", "updated_at": {"$gte": month_start.isoformat()}}},
        {"$group": {"_id": None, "total": {"$sum": "$pricing.total"}}}
    ]
    revenue_result = await db.sourcing_requests.aggregate(pipeline).to_list(1)
    monthly_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total": total,
        "pending": pending,
        "quoted": quoted,
        "in_progress": in_progress,
        "delivered": delivered,
        "monthly_revenue": monthly_revenue
    }

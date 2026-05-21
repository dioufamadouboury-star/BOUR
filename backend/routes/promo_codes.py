"""
Promo Codes Routes Module
Handles promotional codes and discounts
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import secrets

router = APIRouter(prefix="/api", tags=["promo"])

# Dependencies injected from main server
db = None
require_admin = None

def init_promo_routes(database, admin_dep):
    """Initialize module with dependencies"""
    global db, require_admin
    db = database
    require_admin = admin_dep


class PromoCodeCreate(BaseModel):
    code: Optional[str] = None
    type: str = "percentage"  # percentage, fixed, free_shipping
    value: int = 10
    min_purchase: int = 0
    max_uses: Optional[int] = None
    expires_at: Optional[str] = None
    is_active: bool = True
    description: str = ""


@router.get("/promo/validate/{code}")
async def validate_promo_code(code: str, cart_total: int = 0):
    """Validate a promo code and return discount"""
    promo = await db.promo_codes.find_one({"code": code.upper()}, {"_id": 0})
    
    if not promo:
        raise HTTPException(status_code=404, detail="Code promo invalide")
    
    if not promo.get("is_active", True):
        raise HTTPException(status_code=400, detail="Ce code n'est plus actif")
    
    if promo.get("expires_at"):
        expires = datetime.fromisoformat(promo["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Ce code a expiré")
    
    if promo.get("max_uses") and promo.get("used_count", 0) >= promo["max_uses"]:
        raise HTTPException(status_code=400, detail="Ce code a atteint sa limite d'utilisation")
    
    if promo.get("min_purchase", 0) > cart_total:
        min_purchase = promo["min_purchase"]
        raise HTTPException(status_code=400, detail=f"Achat minimum requis: {min_purchase} FCFA")
    
    # Calculate discount
    discount = 0
    if promo["type"] == "percentage":
        discount = cart_total * promo["value"] // 100
    elif promo["type"] == "fixed":
        discount = promo["value"]
    elif promo["type"] == "free_shipping":
        discount = 0  # Handled separately
    
    return {
        "valid": True,
        "code": promo["code"],
        "type": promo["type"],
        "value": promo["value"],
        "discount": discount,
        "free_shipping": promo["type"] == "free_shipping"
    }


@router.post("/promo/use/{code}")
async def use_promo_code(code: str):
    """Mark promo code as used (increment counter)"""
    result = await db.promo_codes.update_one(
        {"code": code.upper()},
        {"$inc": {"used_count": 1}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Code non trouvé")
    
    return {"message": "Code utilisé"}


# ============== ADMIN PROMO MANAGEMENT ==============

@router.get("/admin/promo-codes")
async def get_all_promo_codes(user = Depends(lambda: require_admin)):
    """Get all promo codes"""
    codes = await db.promo_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"promo_codes": codes}


@router.post("/admin/promo-codes")
async def create_promo_code(data: PromoCodeCreate, user = Depends(lambda: require_admin)):
    """Create a new promo code"""
    code = data.code or f"YAMA{secrets.token_hex(3).upper()}"
    
    existing = await db.promo_codes.find_one({"code": code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Ce code existe déjà")
    
    promo_doc = {
        "code": code.upper(),
        "type": data.type,
        "value": data.value,
        "min_purchase": data.min_purchase,
        "max_uses": data.max_uses,
        "used_count": 0,
        "expires_at": data.expires_at,
        "is_active": data.is_active,
        "description": data.description,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.promo_codes.insert_one(promo_doc)
    
    return {"message": "Code créé", "code": code.upper()}


@router.put("/admin/promo-codes/{code}")
async def update_promo_code(code: str, request: Request, user = Depends(lambda: require_admin)):
    """Update a promo code"""
    body = await request.json()
    
    update_data = {}
    for field in ["is_active", "value", "max_uses", "expires_at", "min_purchase", "description"]:
        if field in body:
            update_data[field] = body[field]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune mise à jour")
    
    result = await db.promo_codes.update_one(
        {"code": code.upper()},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Code non trouvé")
    
    return {"message": "Code mis à jour"}


@router.delete("/admin/promo-codes/{code}")
async def delete_promo_code(code: str, user = Depends(lambda: require_admin)):
    """Delete a promo code"""
    result = await db.promo_codes.delete_one({"code": code.upper()})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Code non trouvé")
    
    return {"message": "Code supprimé"}

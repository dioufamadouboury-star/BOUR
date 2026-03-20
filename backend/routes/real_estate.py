"""
Real Estate (Immobilier) routes - Property listings, rentals, sales.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

from database import db
from auth_deps import require_admin, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


# ============== MODELS ==============

class PropertyCreate(BaseModel):
    title: str
    description: str
    property_type: str  # apartment, house, land, commercial, studio, villa
    listing_type: str  # rent_short, rent_long, sale
    price: int
    price_period: Optional[str] = None  # per_night, per_month, per_year, total
    location_city: str = "Dakar"
    location_area: str = ""
    location_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    surface: Optional[int] = None  # m2
    rooms: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    images: List[str] = []
    amenities: List[str] = []
    is_furnished: bool = False
    is_available: bool = True
    available_from: Optional[str] = None
    contact_phone: str = ""
    contact_whatsapp: str = ""
    contact_name: str = ""
    featured: bool = False


class PropertyUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    price: Optional[int] = None
    price_period: Optional[str] = None
    location_city: Optional[str] = None
    location_area: Optional[str] = None
    location_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    surface: Optional[int] = None
    rooms: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    images: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    is_furnished: Optional[bool] = None
    is_available: Optional[bool] = None
    available_from: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    contact_name: Optional[str] = None
    featured: Optional[bool] = None


# ============== PUBLIC ROUTES ==============

@router.get("/properties")
async def get_properties(
    listing_type: Optional[str] = None,
    property_type: Optional[str] = None,
    city: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    bedrooms: Optional[int] = None,
    is_furnished: Optional[bool] = None,
    featured: Optional[bool] = None,
    sort: str = "newest",
    skip: int = 0,
    limit: int = 20,
):
    query = {"is_available": True}

    if listing_type:
        query["listing_type"] = listing_type
    if property_type:
        query["property_type"] = property_type
    if city:
        query["location_city"] = {"$regex": city, "$options": "i"}
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})
        if isinstance(query["price"], dict):
            query["price"]["$lte"] = max_price
        else:
            query["price"] = {"$gte": min_price, "$lte": max_price}
    if bedrooms is not None:
        query["bedrooms"] = {"$gte": bedrooms}
    if is_furnished is not None:
        query["is_furnished"] = is_furnished
    if featured:
        query["featured"] = True

    sort_options = {
        "newest": ("created_at", -1),
        "price_asc": ("price", 1),
        "price_desc": ("price", -1),
        "surface_desc": ("surface", -1),
    }
    sort_field, sort_dir = sort_options.get(sort, ("created_at", -1))

    total = await db.properties.count_documents(query)
    properties = await db.properties.find(query, {"_id": 0}).sort(sort_field, sort_dir).skip(skip).limit(min(limit, 50)).to_list(50)

    return {"properties": properties, "total": total, "skip": skip, "limit": limit}


@router.get("/properties/featured")
async def get_featured_properties():
    properties = await db.properties.find(
        {"is_available": True, "featured": True}, {"_id": 0}
    ).sort("created_at", -1).limit(6).to_list(6)
    if not properties:
        properties = await db.properties.find(
            {"is_available": True}, {"_id": 0}
        ).sort("created_at", -1).limit(6).to_list(6)
    return properties


@router.get("/properties/stats")
async def get_property_stats():
    total = await db.properties.count_documents({"is_available": True})
    by_type = {}
    for lt in ["rent_short", "rent_long", "sale"]:
        by_type[lt] = await db.properties.count_documents({"is_available": True, "listing_type": lt})

    cities = await db.properties.distinct("location_city", {"is_available": True})

    return {
        "total": total,
        "by_listing_type": by_type,
        "cities": cities,
    }


@router.get("/properties/{property_id}")
async def get_property(property_id: str):
    prop = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Bien non trouvé")

    # Increment views
    await db.properties.update_one({"property_id": property_id}, {"$inc": {"views": 1}})

    # Get similar properties
    similar = await db.properties.find(
        {
            "property_id": {"$ne": property_id},
            "listing_type": prop.get("listing_type"),
            "location_city": prop.get("location_city"),
            "is_available": True,
        },
        {"_id": 0},
    ).limit(4).to_list(4)

    return {"property": prop, "similar": similar}


# ============== ADMIN ROUTES ==============

@router.get("/admin/properties")
async def get_admin_properties(
    user=Depends(require_admin),
    listing_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    query = {}
    if listing_type:
        query["listing_type"] = listing_type

    total = await db.properties.count_documents(query)
    properties = await db.properties.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"properties": properties, "total": total}


@router.post("/admin/properties")
async def create_property(data: PropertyCreate, user=Depends(require_admin)):
    property_id = f"prop_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "property_id": property_id,
        "title": data.title,
        "description": data.description,
        "property_type": data.property_type,
        "listing_type": data.listing_type,
        "price": data.price,
        "price_period": data.price_period or _default_period(data.listing_type),
        "location_city": data.location_city,
        "location_area": data.location_area,
        "location_address": data.location_address,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "surface": data.surface,
        "rooms": data.rooms,
        "bedrooms": data.bedrooms,
        "bathrooms": data.bathrooms,
        "images": data.images,
        "amenities": data.amenities,
        "is_furnished": data.is_furnished,
        "is_available": data.is_available,
        "available_from": data.available_from,
        "contact_phone": data.contact_phone,
        "contact_whatsapp": data.contact_whatsapp,
        "contact_name": data.contact_name,
        "featured": data.featured,
        "views": 0,
        "created_at": now,
        "updated_at": now,
    }

    await db.properties.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/admin/properties/{property_id}")
async def update_property(property_id: str, data: PropertyUpdate, user=Depends(require_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.properties.update_one({"property_id": property_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    return {"message": "Bien mis à jour"}


@router.delete("/admin/properties/{property_id}")
async def delete_property(property_id: str, user=Depends(require_admin)):
    result = await db.properties.delete_one({"property_id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    return {"message": "Bien supprimé"}


@router.put("/admin/properties/{property_id}/toggle-featured")
async def toggle_featured(property_id: str, user=Depends(require_admin)):
    prop = await db.properties.find_one({"property_id": property_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    new_value = not prop.get("featured", False)
    await db.properties.update_one({"property_id": property_id}, {"$set": {"featured": new_value}})
    return {"message": f"{'Mis en avant' if new_value else 'Retiré des favoris'}", "featured": new_value}


@router.put("/admin/properties/{property_id}/toggle-availability")
async def toggle_availability(property_id: str, user=Depends(require_admin)):
    prop = await db.properties.find_one({"property_id": property_id})
    if not prop:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    new_value = not prop.get("is_available", True)
    await db.properties.update_one({"property_id": property_id}, {"$set": {"is_available": new_value}})
    return {"message": f"{'Disponible' if new_value else 'Indisponible'}", "is_available": new_value}


def _default_period(listing_type):
    if listing_type == "rent_short":
        return "per_night"
    elif listing_type == "rent_long":
        return "per_month"
    return "total"

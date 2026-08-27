"""
Custom Requests Routes
Handles vehicle requests, sofa orders, and reupholstery quotes
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import secrets

router = APIRouter(prefix="/api/custom-requests", tags=["custom-requests"])

# Database reference - will be injected
db = None

def init_custom_requests_routes(database):
    """Initialize module with database"""
    global db
    db = database


class VehicleRequest(BaseModel):
    brand: str
    model: Optional[str] = ""
    year_min: Optional[str] = ""
    year_max: Optional[str] = ""
    budget_min: Optional[str] = ""
    budget_max: Optional[str] = ""
    km_max: Optional[str] = ""
    fuel: Optional[str] = ""
    transmission: Optional[str] = ""
    color: Optional[str] = ""
    customs_status: str = "sous_douane"  # sous_douane or dedouane
    desired_date: Optional[str] = ""
    full_name: str
    phone: str
    whatsapp: Optional[str] = ""
    address: Optional[str] = ""
    city: str = "Dakar"
    comments: Optional[str] = ""
    reference_images: List[str] = []


class SofaRequest(BaseModel):
    sofa_type: str
    width: Optional[str] = ""
    depth: Optional[str] = ""
    height: Optional[str] = ""
    seat_height: Optional[str] = ""
    fabric: Optional[str] = ""
    color: Optional[str] = ""
    cushion_type: Optional[str] = ""
    quantity: str = "1"
    with_armrests: bool = True
    with_headrests: bool = False
    with_storage: bool = False
    full_name: str
    phone: str
    whatsapp: Optional[str] = ""
    address: Optional[str] = ""
    city: str = "Dakar"
    budget_range: Optional[str] = ""
    comments: Optional[str] = ""
    reference_images: List[str] = []


class ReupholsteryRequest(BaseModel):
    furniture_type: str
    service_type: str = "rehoussage"
    piece_count: str = "1"
    fabric_preference: Optional[str] = ""
    current_condition: Optional[str] = ""
    pickup_needed: bool = True
    full_name: str
    phone: str
    whatsapp: Optional[str] = ""
    address: str
    city: str = "Dakar"
    urgency: str = "normal"
    comments: Optional[str] = ""
    photos: List[str] = []


@router.post("/vehicle")
async def create_vehicle_request(request: VehicleRequest):
    """Create a new vehicle search request"""
    request_number = f"VEH-{secrets.token_hex(4).upper()}"
    
    doc = request.model_dump()
    doc["request_number"] = request_number
    doc["request_type"] = "vehicle"
    doc["status"] = "pending"  # pending, searching, found, quoted, accepted, cancelled
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    doc["admin_notes"] = ""
    doc["proposed_vehicles"] = []  # Admin will add found vehicles here
    doc["quote_sent"] = False
    doc["quote_amount"] = None
    
    await db.custom_requests.insert_one(doc)
    
    return {
        "success": True,
        "request_number": request_number,
        "message": "Votre demande de véhicule a été enregistrée"
    }


@router.post("/sofa")
async def create_sofa_request(request: SofaRequest):
    """Create a new custom sofa order request"""
    request_number = f"SAL-{secrets.token_hex(4).upper()}"
    
    doc = request.model_dump()
    doc["request_number"] = request_number
    doc["request_type"] = "sofa"
    doc["status"] = "pending"  # pending, quoted, accepted, production, ready, delivered, cancelled
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    doc["admin_notes"] = ""
    doc["quote_sent"] = False
    doc["quote_amount"] = None
    doc["estimated_delivery"] = None
    
    await db.custom_requests.insert_one(doc)
    
    return {
        "success": True,
        "request_number": request_number,
        "message": "Votre demande de salon sur commande a été enregistrée"
    }


@router.post("/reupholstery")
async def create_reupholstery_request(request: ReupholsteryRequest):
    """Create a new reupholstery quote request"""
    request_number = f"REH-{secrets.token_hex(4).upper()}"
    
    doc = request.model_dump()
    doc["request_number"] = request_number
    doc["request_type"] = "reupholstery"
    doc["status"] = "pending"  # pending, quoted, accepted, pickup, in_progress, ready, delivered, cancelled
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    doc["admin_notes"] = ""
    doc["quote_sent"] = False
    doc["quote_amount"] = None
    doc["pickup_date"] = None
    doc["estimated_completion"] = None
    
    await db.custom_requests.insert_one(doc)
    
    return {
        "success": True,
        "request_number": request_number,
        "message": "Votre demande de rehoussage a été enregistrée"
    }


@router.get("/track/{request_number}")
async def track_request(request_number: str):
    """Track a request by its number"""
    doc = await db.custom_requests.find_one(
        {"request_number": request_number.upper()},
        {"_id": 0}
    )
    
    if not doc:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    # Return limited info for public tracking
    return {
        "request_number": doc["request_number"],
        "request_type": doc["request_type"],
        "status": doc["status"],
        "created_at": doc["created_at"],
        "quote_sent": doc.get("quote_sent", False),
        "quote_amount": doc.get("quote_amount"),
    }


# ============== ADMIN ENDPOINTS ==============

@router.get("/admin/list")
async def admin_list_requests(
    request_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """Admin: List all custom requests"""
    query = {}
    
    if request_type:
        query["request_type"] = request_type
    if status:
        query["status"] = status
    
    requests = await db.custom_requests.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "total": len(requests),
        "requests": requests
    }


@router.get("/admin/stats")
async def admin_stats():
    """Admin: Get statistics for custom requests"""
    pipeline = [
        {
            "$group": {
                "_id": {
                    "type": "$request_type",
                    "status": "$status"
                },
                "count": {"$sum": 1}
            }
        }
    ]
    
    results = await db.custom_requests.aggregate(pipeline).to_list(100)
    
    # Organize by type
    stats = {
        "vehicle": {"total": 0, "pending": 0, "found": 0, "quoted": 0, "accepted": 0},
        "sofa": {"total": 0, "pending": 0, "quoted": 0, "production": 0, "delivered": 0},
        "reupholstery": {"total": 0, "pending": 0, "quoted": 0, "in_progress": 0, "delivered": 0}
    }
    
    for r in results:
        req_type = r["_id"]["type"]
        status = r["_id"]["status"]
        count = r["count"]
        
        if req_type in stats:
            stats[req_type]["total"] += count
            if status in stats[req_type]:
                stats[req_type][status] = count
    
    return stats


@router.get("/admin/{request_number}")
async def admin_get_request(request_number: str):
    """Admin: Get full details of a request"""
    doc = await db.custom_requests.find_one(
        {"request_number": request_number.upper()},
        {"_id": 0}
    )
    
    if not doc:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    return doc


class UpdateRequestStatus(BaseModel):
    status: str
    admin_notes: Optional[str] = None
    quote_amount: Optional[int] = None
    estimated_delivery: Optional[str] = None
    pickup_date: Optional[str] = None


@router.put("/admin/{request_number}/status")
async def admin_update_status(request_number: str, update: UpdateRequestStatus):
    """Admin: Update request status"""
    doc = await db.custom_requests.find_one({"request_number": request_number.upper()})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    update_fields = {
        "status": update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if update.admin_notes is not None:
        update_fields["admin_notes"] = update.admin_notes
    if update.quote_amount is not None:
        update_fields["quote_amount"] = update.quote_amount
        update_fields["quote_sent"] = True
    if update.estimated_delivery:
        update_fields["estimated_delivery"] = update.estimated_delivery
    if update.pickup_date:
        update_fields["pickup_date"] = update.pickup_date
    
    await db.custom_requests.update_one(
        {"request_number": request_number.upper()},
        {"$set": update_fields}
    )
    
    return {"success": True, "message": "Statut mis à jour"}


class ProposedVehicle(BaseModel):
    title: str
    price: int
    price_type: str = "sous_douane"  # sous_douane or dedouane
    images: List[str] = []
    specs: dict = {}
    notes: str = ""


@router.post("/admin/{request_number}/propose-vehicle")
async def admin_propose_vehicle(request_number: str, vehicle: ProposedVehicle):
    """Admin: Add a proposed vehicle to a request"""
    doc = await db.custom_requests.find_one({"request_number": request_number.upper()})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    if doc.get("request_type") != "vehicle":
        raise HTTPException(status_code=400, detail="Cette demande n'est pas une recherche de véhicule")
    
    vehicle_doc = vehicle.model_dump()
    vehicle_doc["proposed_at"] = datetime.now(timezone.utc).isoformat()
    vehicle_doc["vehicle_id"] = f"prop_{secrets.token_hex(4)}"
    
    await db.custom_requests.update_one(
        {"request_number": request_number.upper()},
        {
            "$push": {"proposed_vehicles": vehicle_doc},
            "$set": {
                "status": "found",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Véhicule proposé ajouté"}

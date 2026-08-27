"""
Private Quotes Routes
Handles secure private quotes sent to clients for signature and deposit payment
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import secrets
import hashlib

router = APIRouter(prefix="/api/private-quotes", tags=["private-quotes"])

# Database reference - will be injected
db = None

def init_private_quotes_routes(database):
    """Initialize module with database"""
    global db
    db = database


class QuoteItem(BaseModel):
    description: str
    quantity: int = 1
    unit_price: int
    image: Optional[str] = None


class CreateQuoteRequest(BaseModel):
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    request_number: Optional[str] = None  # Link to custom request if applicable
    quote_type: str = "vehicle"  # vehicle, sofa, reupholstery, custom
    title: str
    items: List[QuoteItem]
    deposit_percentage: int = 30  # Default 30% deposit
    valid_days: int = 7  # Quote valid for 7 days
    notes: Optional[str] = None
    terms: Optional[str] = None
    images: List[str] = []


class SignQuoteRequest(BaseModel):
    client_signature: str  # Base64 signature image
    client_name: str
    accept_terms: bool = True


def generate_secure_token():
    """Generate a secure token for private quote access"""
    return secrets.token_urlsafe(32)


def generate_quote_number(quote_type: str):
    """Generate a unique quote number"""
    prefix = {
        "vehicle": "QV",
        "sofa": "QS",
        "reupholstery": "QR",
        "custom": "QC"
    }.get(quote_type, "QX")
    return f"{prefix}-{secrets.token_hex(4).upper()}"


@router.post("/create")
async def create_private_quote(request: CreateQuoteRequest):
    """Admin: Create a new private quote for a client"""
    quote_number = generate_quote_number(request.quote_type)
    access_token = generate_secure_token()
    
    # Calculate totals
    subtotal = sum(item.quantity * item.unit_price for item in request.items)
    deposit_amount = int(subtotal * request.deposit_percentage / 100)
    
    # Set expiration date
    expires_at = datetime.now(timezone.utc) + timedelta(days=request.valid_days)
    
    doc = {
        "quote_number": quote_number,
        "access_token": access_token,
        "access_token_hash": hashlib.sha256(access_token.encode()).hexdigest(),
        "quote_type": request.quote_type,
        "request_number": request.request_number,
        "title": request.title,
        "client": {
            "name": request.client_name,
            "phone": request.client_phone,
            "email": request.client_email
        },
        "items": [item.model_dump() for item in request.items],
        "subtotal": subtotal,
        "deposit_percentage": request.deposit_percentage,
        "deposit_amount": deposit_amount,
        "balance_due": subtotal - deposit_amount,
        "notes": request.notes,
        "terms": request.terms or "Acompte non remboursable. Solde à payer à la livraison.",
        "images": request.images,
        "status": "pending",  # pending, viewed, signed, deposit_paid, completed, expired, cancelled
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat(),
        "viewed_at": None,
        "signed_at": None,
        "signature": None,
        "deposit_paid_at": None,
        "deposit_payment_ref": None,
    }
    
    await db.private_quotes.insert_one(doc)
    
    # Generate the secure link
    secure_link = f"https://groupeyamaplus.com/devis/{quote_number}?token={access_token}"
    
    return {
        "success": True,
        "quote_number": quote_number,
        "secure_link": secure_link,
        "access_token": access_token,
        "subtotal": subtotal,
        "deposit_amount": deposit_amount,
        "expires_at": expires_at.isoformat()
    }


@router.get("/view/{quote_number}")
async def view_quote(quote_number: str, token: str):
    """Public: View a private quote using secure token"""
    quote = await db.private_quotes.find_one(
        {"quote_number": quote_number.upper()},
        {"_id": 0, "access_token": 0}  # Don't return the plain token
    )
    
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Verify token
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    if token_hash != quote.get("access_token_hash"):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Check expiration
    expires_at = datetime.fromisoformat(quote["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at and quote["status"] == "pending":
        await db.private_quotes.update_one(
            {"quote_number": quote_number.upper()},
            {"$set": {"status": "expired"}}
        )
        quote["status"] = "expired"
    
    # Mark as viewed if first time
    if not quote.get("viewed_at"):
        await db.private_quotes.update_one(
            {"quote_number": quote_number.upper()},
            {"$set": {
                "viewed_at": datetime.now(timezone.utc).isoformat(),
                "status": "viewed" if quote["status"] == "pending" else quote["status"]
            }}
        )
        quote["viewed_at"] = datetime.now(timezone.utc).isoformat()
        if quote["status"] == "pending":
            quote["status"] = "viewed"
    
    # Remove internal fields
    quote.pop("access_token_hash", None)
    
    return quote


@router.post("/sign/{quote_number}")
async def sign_quote(quote_number: str, token: str, signature: SignQuoteRequest):
    """Public: Sign a quote with electronic signature"""
    quote = await db.private_quotes.find_one({"quote_number": quote_number.upper()})
    
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Verify token
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    if token_hash != quote.get("access_token_hash"):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    if quote["status"] in ["expired", "cancelled"]:
        raise HTTPException(status_code=400, detail="Ce devis n'est plus valide")
    
    if quote["status"] in ["signed", "deposit_paid", "completed"]:
        raise HTTPException(status_code=400, detail="Ce devis a déjà été signé")
    
    if not signature.accept_terms:
        raise HTTPException(status_code=400, detail="Vous devez accepter les conditions")
    
    await db.private_quotes.update_one(
        {"quote_number": quote_number.upper()},
        {"$set": {
            "status": "signed",
            "signed_at": datetime.now(timezone.utc).isoformat(),
            "signature": {
                "image": signature.client_signature,
                "name": signature.client_name,
                "accepted_terms": signature.accept_terms,
                "ip_address": None,  # Could be captured from request
                "user_agent": None
            }
        }}
    )
    
    return {
        "success": True,
        "message": "Devis signé avec succès. Vous pouvez maintenant procéder au paiement de l'acompte.",
        "quote_number": quote_number,
        "deposit_amount": quote["deposit_amount"]
    }


@router.post("/deposit/{quote_number}")
async def record_deposit_payment(quote_number: str, payment_ref: str, payment_method: str = "paydunya"):
    """Admin: Record deposit payment for a quote"""
    quote = await db.private_quotes.find_one({"quote_number": quote_number.upper()})
    
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    if quote["status"] != "signed":
        raise HTTPException(status_code=400, detail="Le devis doit être signé avant le paiement")
    
    await db.private_quotes.update_one(
        {"quote_number": quote_number.upper()},
        {"$set": {
            "status": "deposit_paid",
            "deposit_paid_at": datetime.now(timezone.utc).isoformat(),
            "deposit_payment_ref": payment_ref,
            "deposit_payment_method": payment_method
        }}
    )
    
    # Update linked custom request if exists
    if quote.get("request_number"):
        await db.custom_requests.update_one(
            {"request_number": quote["request_number"]},
            {"$set": {
                "status": "accepted",
                "quote_amount": quote["subtotal"],
                "deposit_paid": True
            }}
        )
    
    return {"success": True, "message": "Paiement enregistré"}


# ============== ADMIN ENDPOINTS ==============

@router.get("/admin/list")
async def admin_list_quotes(
    status: Optional[str] = None,
    quote_type: Optional[str] = None,
    limit: int = 50
):
    """Admin: List all private quotes"""
    query = {}
    if status:
        query["status"] = status
    if quote_type:
        query["quote_type"] = quote_type
    
    quotes = await db.private_quotes.find(
        query,
        {"_id": 0, "access_token": 0, "access_token_hash": 0, "signature.image": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"total": len(quotes), "quotes": quotes}


@router.get("/admin/stats")
async def admin_quotes_stats():
    """Admin: Get quote statistics"""
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_value": {"$sum": "$subtotal"},
                "deposits_collected": {
                    "$sum": {
                        "$cond": [{"$eq": ["$status", "deposit_paid"]}, "$deposit_amount", 0]
                    }
                }
            }
        }
    ]
    
    results = await db.private_quotes.aggregate(pipeline).to_list(20)
    
    stats = {
        "total": 0,
        "pending": 0,
        "viewed": 0,
        "signed": 0,
        "deposit_paid": 0,
        "completed": 0,
        "expired": 0,
        "cancelled": 0,
        "total_value": 0,
        "deposits_collected": 0
    }
    
    for r in results:
        status = r["_id"]
        if status in stats:
            stats[status] = r["count"]
        stats["total"] += r["count"]
        stats["total_value"] += r.get("total_value", 0)
        stats["deposits_collected"] += r.get("deposits_collected", 0)
    
    return stats


@router.get("/admin/{quote_number}")
async def admin_get_quote(quote_number: str):
    """Admin: Get full quote details"""
    quote = await db.private_quotes.find_one(
        {"quote_number": quote_number.upper()},
        {"_id": 0}
    )
    
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    return quote


@router.put("/admin/{quote_number}/cancel")
async def admin_cancel_quote(quote_number: str, reason: Optional[str] = None):
    """Admin: Cancel a quote"""
    result = await db.private_quotes.update_one(
        {"quote_number": quote_number.upper()},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancel_reason": reason
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    return {"success": True, "message": "Devis annulé"}


@router.post("/admin/{quote_number}/resend")
async def admin_resend_quote(quote_number: str):
    """Admin: Generate a new access token and resend quote link"""
    quote = await db.private_quotes.find_one({"quote_number": quote_number.upper()})
    
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    new_token = generate_secure_token()
    new_expires = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.private_quotes.update_one(
        {"quote_number": quote_number.upper()},
        {"$set": {
            "access_token": new_token,
            "access_token_hash": hashlib.sha256(new_token.encode()).hexdigest(),
            "expires_at": new_expires.isoformat(),
            "status": "pending" if quote["status"] in ["expired", "viewed"] else quote["status"]
        }}
    )
    
    secure_link = f"https://groupeyamaplus.com/devis/{quote_number}?token={new_token}"
    
    return {
        "success": True,
        "secure_link": secure_link,
        "expires_at": new_expires.isoformat()
    }

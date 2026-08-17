"""
Customer Reviews API
Supports: Star ratings, comments, photos, verified purchase badge, admin moderation
"""
import os
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reviews", tags=["Customer Reviews"])

def get_db():
    """Get database instance - imported from main server"""
    from server import db
    return db

def get_current_user(request):
    """Get current user from request"""
    from server import get_current_user as _get_current_user
    return _get_current_user(request)

def require_admin(user):
    """Require admin privileges"""
    from server import require_admin as _require_admin
    return _require_admin(user)


class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=1000)
    reviewer_name: str = Field(min_length=2, max_length=100)
    photos: List[str] = []  # List of photo URLs


class ReviewUpdate(BaseModel):
    status: str  # approved, rejected, pending


@router.post("/")
async def create_review(review: ReviewCreate, request: Request):
    """Submit a new product review"""
    db = get_db()
    user = await get_current_user(request)
    
    # Check if product exists
    product = await db.products.find_one({"product_id": review.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    # Check if user already reviewed this product
    if user:
        existing_review = await db.reviews.find_one({
            "product_id": review.product_id,
            "user_id": user.user_id
        })
        if existing_review:
            raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis pour ce produit")
    
    # Check for verified purchase
    is_verified_purchase = False
    if user:
        # Check if user has a delivered order containing this product
        delivered_order = await db.orders.find_one({
            "user_id": user.user_id,
            "order_status": "delivered",
            "items.product_id": review.product_id
        })
        is_verified_purchase = delivered_order is not None
    
    review_doc = {
        "review_id": f"REV-{secrets.token_hex(4).upper()}",
        "product_id": review.product_id,
        "user_id": user.user_id if user else None,
        "reviewer_name": review.reviewer_name,
        "rating": review.rating,
        "comment": review.comment,
        "photos": review.photos[:3],  # Max 3 photos
        "is_verified_purchase": is_verified_purchase,
        "status": "pending",  # pending, approved, rejected
        "helpful_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update product rating stats
    await update_product_rating(review.product_id)
    
    return {
        "message": "Merci pour votre avis ! Il sera publié après modération.",
        "review_id": review_doc["review_id"]
    }


async def update_product_rating(product_id: str):
    """Recalculate product average rating"""
    db = get_db()
    
    # Get all approved reviews for this product
    pipeline = [
        {"$match": {"product_id": product_id, "status": "approved"}},
        {"$group": {
            "_id": None,
            "average_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1},
            "rating_1": {"$sum": {"$cond": [{"$eq": ["$rating", 1]}, 1, 0]}},
            "rating_2": {"$sum": {"$cond": [{"$eq": ["$rating", 2]}, 1, 0]}},
            "rating_3": {"$sum": {"$cond": [{"$eq": ["$rating", 3]}, 1, 0]}},
            "rating_4": {"$sum": {"$cond": [{"$eq": ["$rating", 4]}, 1, 0]}},
            "rating_5": {"$sum": {"$cond": [{"$eq": ["$rating", 5]}, 1, 0]}}
        }}
    ]
    
    result = await db.reviews.aggregate(pipeline).to_list(1)
    
    if result:
        stats = result[0]
        await db.products.update_one(
            {"product_id": product_id},
            {"$set": {
                "average_rating": round(stats["average_rating"], 1),
                "total_reviews": stats["total_reviews"],
                "rating_breakdown": {
                    "1": stats["rating_1"],
                    "2": stats["rating_2"],
                    "3": stats["rating_3"],
                    "4": stats["rating_4"],
                    "5": stats["rating_5"]
                }
            }}
        )
    else:
        await db.products.update_one(
            {"product_id": product_id},
            {"$set": {
                "average_rating": 0,
                "total_reviews": 0,
                "rating_breakdown": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
            }}
        )


@router.get("/product/{product_id}")
async def get_product_reviews(
    product_id: str,
    status: str = "approved",
    limit: int = 20,
    skip: int = 0
):
    """Get reviews for a product"""
    db = get_db()
    
    query = {"product_id": product_id}
    if status != "all":
        query["status"] = status
    
    reviews = await db.reviews.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.reviews.count_documents(query)
    
    # Get product rating summary
    product = await db.products.find_one(
        {"product_id": product_id},
        {"_id": 0, "average_rating": 1, "total_reviews": 1, "rating_breakdown": 1}
    )
    
    return {
        "reviews": reviews,
        "total": total,
        "rating_summary": {
            "average": product.get("average_rating", 0) if product else 0,
            "total": product.get("total_reviews", 0) if product else 0,
            "breakdown": product.get("rating_breakdown", {}) if product else {}
        }
    }


@router.post("/{review_id}/helpful")
async def mark_review_helpful(review_id: str, request: Request):
    """Mark a review as helpful"""
    db = get_db()
    
    result = await db.reviews.update_one(
        {"review_id": review_id},
        {"$inc": {"helpful_count": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    
    return {"message": "Merci pour votre retour !"}


# Admin endpoints
@router.get("/admin/pending")
async def get_pending_reviews(request: Request, limit: int = 50):
    """Get all pending reviews for moderation (Admin only)"""
    db = get_db()
    user = await get_current_user(request)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    reviews = await db.reviews.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Enrich with product info
    for review in reviews:
        product = await db.products.find_one(
            {"product_id": review["product_id"]},
            {"_id": 0, "name": 1, "images": 1}
        )
        review["product_name"] = product.get("name", "Produit inconnu") if product else "Produit inconnu"
        review["product_image"] = product.get("images", ["/placeholder.jpg"])[0] if product else "/placeholder.jpg"
    
    pending_count = await db.reviews.count_documents({"status": "pending"})
    
    return {
        "reviews": reviews,
        "pending_count": pending_count
    }


@router.put("/admin/{review_id}")
async def moderate_review(review_id: str, update: ReviewUpdate, request: Request):
    """Approve or reject a review (Admin only)"""
    db = get_db()
    user = await get_current_user(request)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    if update.status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    review = await db.reviews.find_one({"review_id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    
    result = await db.reviews.update_one(
        {"review_id": review_id},
        {"$set": {
            "status": update.status,
            "moderated_by": user.user_id,
            "moderated_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Recalculate product rating
    await update_product_rating(review["product_id"])
    
    return {"message": f"Avis {update.status}"}


@router.delete("/admin/{review_id}")
async def delete_review(review_id: str, request: Request):
    """Delete a review (Admin only)"""
    db = get_db()
    user = await get_current_user(request)
    
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    review = await db.reviews.find_one({"review_id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    
    await db.reviews.delete_one({"review_id": review_id})
    
    # Recalculate product rating
    await update_product_rating(review["product_id"])
    
    return {"message": "Avis supprimé"}

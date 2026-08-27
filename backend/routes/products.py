"""
Products Routes Module
Handles all product-related endpoints: CRUD, flash sales, similar products, reviews
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

router = APIRouter(prefix="/api", tags=["products"])

# These will be injected from main server
db = None
require_admin = None
require_auth = None
clear_cache = None
set_cached = None
get_cached = None

def init_products_routes(database, admin_dep, auth_dep, cache_clear, cache_set, cache_get):
    """Initialize module with dependencies from main server"""
    global db, require_admin, require_auth, clear_cache, set_cached, get_cached
    db = database
    require_admin = admin_dep
    require_auth = auth_dep
    clear_cache = cache_clear
    set_cached = cache_set
    get_cached = cache_get


# ============== MODELS ==============

class ProductCreate(BaseModel):
    name: str
    description: str = ""
    short_description: str = ""
    price: int
    original_price: Optional[int] = None
    category: str = "electronique"
    subcategory: Optional[str] = None
    images: List[str] = []
    stock: int = 0
    featured: bool = False
    is_new: bool = False
    is_promo: bool = False
    brand: Optional[str] = None
    colors: List[str] = []
    sizes: List[str] = []
    specs: dict = {}
    is_on_order: bool = False
    order_delivery_days: Optional[int] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class Product(BaseModel):
    product_id: str
    name: str
    description: str = ""
    short_description: str = ""
    price: int
    original_price: Optional[int] = None
    category: str
    subcategory: Optional[str] = None
    images: List[str] = []
    stock: int = 0
    featured: bool = False
    is_new: bool = False
    is_promo: bool = False
    is_flash_sale: bool = False
    flash_sale_price: Optional[int] = None
    flash_sale_end: Optional[datetime] = None
    brand: Optional[str] = None
    colors: List[str] = []
    sizes: List[str] = []
    specs: dict = {}
    is_on_order: bool = False
    order_delivery_days: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: str = ""
    comment: str = ""


# ============== PRODUCTS ROUTES ==============

@router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    is_new: Optional[bool] = None,
    is_promo: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    limit = min(limit, 500)
    
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    if is_new is not None:
        query["is_new"] = is_new
    if is_promo is not None:
        query["is_promo"] = is_promo
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    projection = {
        "_id": 0,
        "product_id": 1,
        "name": 1,
        "description": 1,
        "short_description": 1,
        "price": 1,
        "original_price": 1,
        "category": 1,
        "subcategory": 1,
        "images": {"$slice": 2},
        "stock": 1,
        "featured": 1,
        "is_new": 1,
        "is_promo": 1,
        "is_flash_sale": 1,
        "flash_sale_price": 1,
        "flash_sale_end": 1,
        "brand": 1,
        "colors": 1,
        "sizes": 1,
        "is_on_order": 1,
        "order_delivery_days": 1,
        "created_at": 1,
        "updated_at": 1
    }
    
    products = await db.products.find(query, projection).skip(skip).limit(limit).to_list(limit)
    
    for product in products:
        for field in ['created_at', 'updated_at']:
            if isinstance(product.get(field), str):
                product[field] = datetime.fromisoformat(product[field])
    
    return products


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    for field in ['created_at', 'updated_at']:
        if isinstance(product.get(field), str):
            product[field] = datetime.fromisoformat(product[field])
    
    return product


@router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, user = Depends(lambda: require_admin)):
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    product_doc = product_data.model_dump()
    product_doc["product_id"] = product_id
    product_doc["created_at"] = now.isoformat()
    product_doc["updated_at"] = now.isoformat()
    
    await db.products.insert_one(product_doc)
    
    if clear_cache:
        clear_cache("products")
        clear_cache("flash_sales")
    
    product_doc["created_at"] = now
    product_doc["updated_at"] = now
    
    return product_doc


@router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, user = Depends(lambda: require_admin)):
    existing = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    update_doc = product_data.model_dump()
    update_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one(
        {"product_id": product_id},
        {"$set": update_doc}
    )
    
    if clear_cache:
        clear_cache("products")
        clear_cache("flash_sales")
    
    updated = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    for field in ['created_at', 'updated_at']:
        if isinstance(updated.get(field), str):
            updated[field] = datetime.fromisoformat(updated[field])
    
    return updated


@router.delete("/products/{product_id}")
@router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, user = Depends(lambda: require_admin)):
    """Delete a product"""
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    if clear_cache:
        clear_cache()
    
    return {"message": "Produit supprimé", "deleted": True}


# ============== FLASH SALES ==============

@router.get("/flash-sales")
async def get_flash_sales():
    now = datetime.now(timezone.utc)
    
    products = await db.products.find(
        {
            "is_flash_sale": True,
            "flash_sale_end": {"$gt": now.isoformat()}
        },
        {"_id": 0}
    ).to_list(50)
    
    for product in products:
        for field in ['created_at', 'updated_at', 'flash_sale_end']:
            if isinstance(product.get(field), str):
                try:
                    product[field] = datetime.fromisoformat(product[field].replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    pass
    
    return products


@router.post("/flash-sales/{product_id}")
async def create_flash_sale(
    product_id: str,
    flash_price: int = Query(...),
    duration_hours: int = Query(default=24),
    user = Depends(lambda: require_admin)
):
    product = await db.products.find_one({"product_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    end_time = datetime.now(timezone.utc) + timedelta(hours=duration_hours)
    
    await db.products.update_one(
        {"product_id": product_id},
        {"$set": {
            "is_flash_sale": True,
            "flash_sale_price": flash_price,
            "flash_sale_end": end_time.isoformat()
        }}
    )
    
    if clear_cache:
        clear_cache("flash_sales")
        clear_cache("products")
    
    return {"message": "Vente flash créée", "end_time": end_time.isoformat()}


@router.delete("/flash-sales/{product_id}")
async def remove_flash_sale(product_id: str, user = Depends(lambda: require_admin)):
    await db.products.update_one(
        {"product_id": product_id},
        {"$set": {
            "is_flash_sale": False,
            "flash_sale_price": None,
            "flash_sale_end": None
        }}
    )
    
    if clear_cache:
        clear_cache("flash_sales")
        clear_cache("products")
    
    return {"message": "Vente flash supprimée"}


# ============== SIMILAR PRODUCTS ==============

@router.get("/products/{product_id}/similar")
async def get_similar_products(product_id: str, limit: int = 6):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    query = {
        "product_id": {"$ne": product_id},
        "category": product.get("category")
    }
    
    if product.get("subcategory"):
        query["subcategory"] = product.get("subcategory")
    
    similar = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    if len(similar) < limit:
        existing_ids = [p["product_id"] for p in similar]
        existing_ids.append(product_id)
        more = await db.products.find(
            {
                "product_id": {"$nin": existing_ids},
                "category": product.get("category")
            },
            {"_id": 0}
        ).limit(limit - len(similar)).to_list(limit - len(similar))
        similar.extend(more)
    
    return similar


@router.get("/products/{product_id}/frequently-bought")
async def get_frequently_bought(product_id: str):
    orders = await db.orders.find(
        {"items.product_id": product_id},
        {"items": 1, "_id": 0}
    ).limit(50).to_list(50)
    
    product_counts = {}
    for order in orders:
        for item in order.get("items", []):
            pid = item.get("product_id")
            if pid and pid != product_id:
                product_counts[pid] = product_counts.get(pid, 0) + 1
    
    top_product_ids = sorted(product_counts.keys(), key=lambda x: product_counts[x], reverse=True)[:4]
    
    if not top_product_ids:
        return []
    
    products = await db.products.find(
        {"product_id": {"$in": top_product_ids}},
        {"_id": 0}
    ).to_list(4)
    
    return products


# ============== REVIEWS ==============

@router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str, limit: int = 50):
    reviews = await db.reviews.find(
        {"product_id": product_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for review in reviews:
        if review.get("user_id"):
            user = await db.users.find_one({"user_id": review["user_id"]}, {"name": 1, "_id": 0})
            review["user_name"] = user.get("name", "Anonyme") if user else "Anonyme"
        else:
            review["user_name"] = "Anonyme"
    
    total = await db.reviews.count_documents({"product_id": product_id})
    
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
    ]
    avg_result = await db.reviews.aggregate(pipeline).to_list(1)
    avg_rating = round(avg_result[0]["avg_rating"], 1) if avg_result else 0
    
    rating_dist = {}
    for i in range(1, 6):
        rating_dist[str(i)] = await db.reviews.count_documents({"product_id": product_id, "rating": i})
    
    return {
        "reviews": reviews,
        "total": total,
        "average_rating": avg_rating,
        "rating_distribution": rating_dist
    }


@router.post("/products/{product_id}/reviews")
async def create_review(product_id: str, review_data: ReviewCreate, user = Depends(lambda: require_auth)):
    product = await db.products.find_one({"product_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    existing = await db.reviews.find_one({
        "product_id": product_id,
        "user_id": user.user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà évalué ce produit")
    
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    review_doc = {
        "review_id": review_id,
        "product_id": product_id,
        "user_id": user.user_id,
        "rating": review_data.rating,
        "title": review_data.title,
        "comment": review_data.comment,
        "helpful_count": 0,
        "verified_purchase": False,
        "created_at": now.isoformat()
    }
    
    user_orders = await db.orders.find({
        "user_id": user.user_id,
        "items.product_id": product_id,
        "order_status": "delivered"
    }).to_list(1)
    review_doc["verified_purchase"] = len(user_orders) > 0
    
    await db.reviews.insert_one(review_doc)
    
    # Return a clean copy without _id
    review_doc.pop("_id", None)
    review_doc["user_name"] = user.name
    return review_doc


@router.post("/reviews/{review_id}/helpful")
async def mark_review_helpful(review_id: str):
    await db.reviews.update_one(
        {"review_id": review_id},
        {"$inc": {"helpful_count": 1}}
    )
    return {"success": True}


@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user = Depends(lambda: require_auth)):
    review = await db.reviews.find_one({"review_id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    
    if review["user_id"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.reviews.delete_one({"review_id": review_id})
    return {"message": "Avis supprimé"}


# Import timedelta for flash sales
from datetime import timedelta

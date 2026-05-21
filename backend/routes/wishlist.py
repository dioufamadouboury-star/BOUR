"""
Wishlist Routes Module
Handles user wishlist operations and sharing
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api", tags=["wishlist"])

# Dependencies injected from main server
db = None
require_auth = None

def init_wishlist_routes(database, auth_dep):
    """Initialize module with dependencies"""
    global db, require_auth
    db = database
    require_auth = auth_dep


@router.get("/wishlist")
async def get_wishlist(user = Depends(lambda: require_auth)):
    wishlist = await db.wishlists.find_one({"user_id": user.user_id}, {"_id": 0})
    if not wishlist:
        return {"items": []}
    
    enriched_items = []
    for item in wishlist.get("items", []):
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            enriched_items.append({
                "product_id": item["product_id"],
                "added_at": item["added_at"],
                "name": product["name"],
                "price": product["price"],
                "image": product["images"][0] if product["images"] else "",
                "stock": product["stock"]
            })
    
    return {"items": enriched_items}


@router.post("/wishlist/add/{product_id}")
async def add_to_wishlist(product_id: str, user = Depends(lambda: require_auth)):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.wishlists.update_one(
        {"user_id": user.user_id},
        {
            "$addToSet": {"items": {"product_id": product_id, "added_at": now}},
            "$setOnInsert": {"created_at": now}
        },
        upsert=True
    )
    
    return {"message": "Produit ajouté à la liste de souhaits"}


@router.delete("/wishlist/remove/{product_id}")
async def remove_from_wishlist(product_id: str, user = Depends(lambda: require_auth)):
    await db.wishlists.update_one(
        {"user_id": user.user_id},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Produit retiré de la liste de souhaits"}


@router.post("/wishlist/share")
async def create_shared_wishlist(user = Depends(lambda: require_auth)):
    """Create a shareable link for the user's wishlist"""
    share_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()
    
    await db.wishlists.update_one(
        {"user_id": user.user_id},
        {
            "$set": {
                "share_id": share_id,
                "share_created_at": now,
                "owner_name": user.name
            }
        }
    )
    
    return {"share_id": share_id, "share_url": f"/wishlist/shared/{share_id}"}


@router.get("/wishlist/shared/{share_id}")
async def get_shared_wishlist(share_id: str):
    """Get a shared wishlist by its share ID (public endpoint)"""
    wishlist = await db.wishlists.find_one({"share_id": share_id}, {"_id": 0})
    
    if not wishlist:
        raise HTTPException(status_code=404, detail="Liste introuvable")
    
    enriched_items = []
    for item in wishlist.get("items", []):
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            enriched_items.append({
                "product_id": product["product_id"],
                "name": product["name"],
                "price": product["price"],
                "original_price": product.get("original_price"),
                "images": product.get("images", []),
                "stock": product["stock"]
            })
    
    return {
        "owner_name": wishlist.get("owner_name", ""),
        "items": enriched_items,
        "created_at": wishlist.get("share_created_at")
    }

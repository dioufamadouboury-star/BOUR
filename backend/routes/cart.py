"""
Cart Routes Module
Handles shopping cart operations
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Response
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api", tags=["cart"])

# Dependencies injected from main server
db = None
get_current_user = None

def init_cart_routes(database, user_getter):
    """Initialize module with dependencies"""
    global db, get_current_user
    db = database
    get_current_user = user_getter


class CartItem(BaseModel):
    product_id: str
    quantity: int = 1


@router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session") or request.headers.get("X-Cart-Session")
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    elif session_id:
        query["session_id"] = session_id
    else:
        return {"items": [], "total": 0}
    
    cart = await db.carts.find_one(query, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0}
    
    enriched_items = []
    total = 0
    
    for item in cart.get("items", []):
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            enriched_items.append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "name": product["name"],
                "price": product["price"],
                "image": product["images"][0] if product["images"] else "",
                "stock": product["stock"]
            })
            total += product["price"] * item["quantity"]
    
    return {"items": enriched_items, "total": total}


@router.post("/cart/add")
async def add_to_cart(item: CartItem, request: Request, response: Response):
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session") or request.headers.get("X-Cart-Session")
    
    if not session_id:
        session_id = f"cart_{uuid.uuid4().hex[:12]}"
        response.set_cookie(
            key="cart_session",
            value=session_id,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=30 * 24 * 3600,
            path="/"
        )
    
    product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    if product["stock"] < item.quantity:
        raise HTTPException(status_code=400, detail="Stock insuffisant")
    
    query = {"user_id": user.user_id} if user else {"session_id": session_id}
    cart = await db.carts.find_one(query, {"_id": 0})
    
    now = datetime.now(timezone.utc).isoformat()
    
    if cart:
        items = cart.get("items", [])
        found = False
        for i, existing_item in enumerate(items):
            if existing_item["product_id"] == item.product_id:
                items[i]["quantity"] += item.quantity
                found = True
                break
        
        if not found:
            items.append({"product_id": item.product_id, "quantity": item.quantity})
        
        await db.carts.update_one(query, {"$set": {"items": items, "updated_at": now}})
    else:
        cart_doc = {
            "cart_id": f"cart_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id if user else None,
            "session_id": session_id if not user else None,
            "items": [{"product_id": item.product_id, "quantity": item.quantity}],
            "created_at": now,
            "updated_at": now
        }
        await db.carts.insert_one(cart_doc)
    
    return {"message": "Produit ajouté au panier"}


@router.put("/cart/update")
async def update_cart_item(item: CartItem, request: Request):
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session") or request.headers.get("X-Cart-Session")
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    elif session_id:
        query["session_id"] = session_id
    else:
        raise HTTPException(status_code=400, detail="Panier non trouvé")
    
    cart = await db.carts.find_one(query, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Panier non trouvé")
    
    items = cart.get("items", [])
    
    if item.quantity <= 0:
        items = [i for i in items if i["product_id"] != item.product_id]
    else:
        for i, existing_item in enumerate(items):
            if existing_item["product_id"] == item.product_id:
                items[i]["quantity"] = item.quantity
                break
    
    await db.carts.update_one(
        query,
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Panier mis à jour"}


@router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, request: Request):
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session") or request.headers.get("X-Cart-Session")
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    elif session_id:
        query["session_id"] = session_id
    else:
        raise HTTPException(status_code=400, detail="Panier non trouvé")
    
    await db.carts.update_one(
        query,
        {"$pull": {"items": {"product_id": product_id}}}
    )
    
    return {"message": "Produit retiré du panier"}


@router.delete("/cart/clear")
async def clear_cart(request: Request):
    user = await get_current_user(request)
    session_id = request.cookies.get("cart_session") or request.headers.get("X-Cart-Session")
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    elif session_id:
        query["session_id"] = session_id
    
    if query:
        await db.carts.delete_one(query)
    
    return {"message": "Panier vidé"}

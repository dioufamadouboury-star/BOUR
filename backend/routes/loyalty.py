"""
Loyalty Program Routes Module
Handles user loyalty points, tiers, and rewards
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["loyalty"])

# Dependencies injected from main server
db = None
require_auth = None

# Constants
POINTS_PER_1000_FCFA = 10

LOYALTY_REWARDS = [
    {"id": 1, "name": "5% de réduction", "points": 500, "type": "discount", "value": 5},
    {"id": 2, "name": "10% de réduction", "points": 1000, "type": "discount", "value": 10},
    {"id": 3, "name": "Livraison gratuite", "points": 750, "type": "free_shipping", "value": 0},
    {"id": 4, "name": "15% de réduction", "points": 1500, "type": "discount", "value": 15},
    {"id": 5, "name": "2000 FCFA de crédit", "points": 2000, "type": "credit", "value": 2000},
    {"id": 6, "name": "5000 FCFA de crédit", "points": 4500, "type": "credit", "value": 5000},
]

def init_loyalty_routes(database, auth_dep):
    """Initialize module with dependencies"""
    global db, require_auth
    db = database
    require_auth = auth_dep


def get_tier(points: int) -> str:
    """Determine tier based on points"""
    if points >= 15000:
        return "Platine"
    elif points >= 5000:
        return "Or"
    elif points >= 1000:
        return "Argent"
    return "Bronze"


@router.get("/loyalty/me")
async def get_user_loyalty(user = Depends(lambda: require_auth)):
    """Get user's loyalty points and history"""
    loyalty = await db.loyalty.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not loyalty:
        loyalty = {
            "user_id": user.user_id,
            "points": 0,
            "total_earned": 0,
            "total_redeemed": 0,
            "tier": "Bronze",
            "history": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.loyalty.insert_one(loyalty)
        loyalty.pop("_id", None)
    
    return loyalty


@router.get("/loyalty/rewards")
async def get_available_rewards():
    """Get list of available rewards"""
    return {"rewards": LOYALTY_REWARDS}


@router.post("/loyalty/add-points")
async def add_loyalty_points(
    order_total: int,
    order_id: str,
    user = Depends(lambda: require_auth)
):
    """Add loyalty points after a purchase"""
    points_earned = (order_total // 1000) * POINTS_PER_1000_FCFA
    now = datetime.now(timezone.utc).isoformat()
    
    history_entry = {
        "type": "earn",
        "points": points_earned,
        "description": f"Achat #{order_id}",
        "date": now
    }
    
    await db.loyalty.update_one(
        {"user_id": user.user_id},
        {
            "$inc": {"points": points_earned, "total_earned": points_earned},
            "$push": {"history": {"$each": [history_entry], "$position": 0, "$slice": 50}},
            "$setOnInsert": {"created_at": now, "tier": "Bronze", "total_redeemed": 0}
        },
        upsert=True
    )
    
    loyalty = await db.loyalty.find_one({"user_id": user.user_id})
    new_tier = get_tier(loyalty["points"])
    
    await db.loyalty.update_one(
        {"user_id": user.user_id},
        {"$set": {"tier": new_tier}}
    )
    
    return {"points_earned": points_earned, "new_tier": new_tier}


@router.post("/loyalty/redeem")
async def redeem_loyalty_reward(
    reward_id: int = None,
    user = Depends(lambda: require_auth)
):
    """Redeem a loyalty reward"""
    loyalty = await db.loyalty.find_one({"user_id": user.user_id})
    
    if not loyalty:
        raise HTTPException(status_code=404, detail="Pas de compte fidélité")
    
    reward = next((r for r in LOYALTY_REWARDS if r["id"] == reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Récompense introuvable")
    
    if loyalty["points"] < reward["points"]:
        raise HTTPException(status_code=400, detail="Points insuffisants")
    
    now = datetime.now(timezone.utc).isoformat()
    
    history_entry = {
        "type": "redeem",
        "points": -reward["points"],
        "description": reward["name"],
        "reward_type": reward["type"],
        "reward_value": reward["value"],
        "date": now
    }
    
    await db.loyalty.update_one(
        {"user_id": user.user_id},
        {
            "$inc": {"points": -reward["points"], "total_redeemed": reward["points"]},
            "$push": {"history": {"$each": [history_entry], "$position": 0, "$slice": 50}}
        }
    )
    
    updated = await db.loyalty.find_one({"user_id": user.user_id})
    new_tier = get_tier(updated["points"])
    await db.loyalty.update_one(
        {"user_id": user.user_id},
        {"$set": {"tier": new_tier}}
    )
    
    # Generate reward code if applicable
    import secrets
    reward_code = None
    if reward["type"] in ["discount", "free_shipping"]:
        reward_code = f"LOYALTY-{secrets.token_hex(4).upper()}"
        await db.promo_codes.insert_one({
            "code": reward_code,
            "type": "percentage" if reward["type"] == "discount" else "free_shipping",
            "value": reward["value"],
            "max_uses": 1,
            "used_count": 0,
            "user_id": user.user_id,
            "is_active": True,
            "expires_at": None,
            "created_at": now
        })
    
    return {
        "success": True,
        "reward": reward,
        "code": reward_code,
        "remaining_points": updated["points"]
    }

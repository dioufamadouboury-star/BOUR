"""
Game Routes Module
Handles spin wheel / chrono game configuration, spins, and prizes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import random
import string
import uuid

router = APIRouter(prefix="/api", tags=["game"])

# Dependencies injected from main server
db = None

def init_game_routes(database):
    """Initialize module with dependencies"""
    global db
    db = database


# Prize configuration with probabilities
SPIN_PRIZES = [
    {"type": "discount_5", "label": "-5%", "probability": 0.50, "discount": 5},
    {"type": "discount_10", "label": "-10%", "probability": 0.25, "discount": 10},
    {"type": "free_shipping", "label": "Livraison Gratuite", "probability": 0.15, "discount": 0},
    {"type": "discount_15", "label": "-15%", "probability": 0.08, "discount": 15},
    {"type": "discount_20", "label": "-20%", "probability": 0.02, "discount": 20},
]

# Game configuration
GAME_CONFIG = {
    "name": "Chrono YAMA+",
    "end_date": "2026-12-31T23:59:59Z",
    "max_jerseys": 0,
    "min_purchase_for_spin": 25000,
}


class SpinRequest(BaseModel):
    email: str
    name: Optional[str] = ""
    jersey_name: Optional[str] = None


def select_prize():
    """Select a prize based on probabilities"""
    rand = random.random()
    cumulative = 0
    for prize in SPIN_PRIZES:
        cumulative += prize["probability"]
        if rand <= cumulative:
            return prize
    return SPIN_PRIZES[0]


def generate_prize_code():
    """Generate a unique prize code"""
    return "YAMA-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


@router.get("/game/config")
async def get_game_config():
    """Get game configuration and stats"""
    jerseys_won = await db.spins.count_documents({"prize_type": "jersey"})
    total_spins = await db.spins.count_documents({})
    
    end_date = datetime.fromisoformat(GAME_CONFIG["end_date"].replace("Z", "+00:00"))
    is_active = datetime.now(timezone.utc) < end_date
    
    return {
        "name": GAME_CONFIG["name"],
        "end_date": GAME_CONFIG["end_date"],
        "active": is_active,
        "jerseys_remaining": max(0, GAME_CONFIG["max_jerseys"] - jerseys_won),
        "total_jerseys": GAME_CONFIG["max_jerseys"],
        "total_spins": total_spins,
        "prizes": [{"type": p["type"], "label": p["label"]} for p in SPIN_PRIZES],
        "min_purchase": GAME_CONFIG["min_purchase_for_spin"]
    }


@router.get("/game/check-eligibility")
async def check_spin_eligibility(email: str):
    """Check if user can spin"""
    newsletter_sub = await db.newsletter.find_one({"email": email})
    has_newsletter_spin = newsletter_sub and not newsletter_sub.get("spin_used", False)
    
    total_spins = await db.spins.count_documents({"email": email})
    
    unused_purchase_spins = await db.spins.count_documents({
        "email": email, 
        "spin_type": "purchase_credit",
        "used": False
    })
    
    return {
        "can_spin": has_newsletter_spin or unused_purchase_spins > 0,
        "has_newsletter_spin": has_newsletter_spin,
        "purchase_spins_available": unused_purchase_spins,
        "total_spins_done": total_spins,
        "is_subscribed": newsletter_sub is not None
    }


@router.post("/game/spin")
async def spin_wheel(data: SpinRequest):
    """Spin the wheel and get a prize"""
    end_date = datetime.fromisoformat(GAME_CONFIG["end_date"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > end_date:
        raise HTTPException(status_code=400, detail="Le jeu est terminé")
    
    eligibility = await check_spin_eligibility(data.email)
    
    if not eligibility["can_spin"]:
        if not eligibility["is_subscribed"]:
            subscriber_doc = {
                "email": data.email,
                "name": data.name or "",
                "subscribed_at": datetime.now(timezone.utc).isoformat(),
                "active": True,
                "spin_used": False,
                "source": "spin_game"
            }
            await db.newsletter.insert_one(subscriber_doc)
            eligibility["has_newsletter_spin"] = True
            eligibility["can_spin"] = True
        else:
            raise HTTPException(
                status_code=400, 
                detail="Vous avez utilisé tous vos tours. Faites un achat de +25 000 FCFA pour un nouveau tour!"
            )
    
    prize = select_prize()
    
    if prize["type"] == "jersey":
        jerseys_won = await db.spins.count_documents({"prize_type": "jersey"})
        if jerseys_won >= GAME_CONFIG["max_jerseys"]:
            prize = {"type": "discount_20", "label": "-20%", "probability": 0, "discount": 20}
    
    prize_code = generate_prize_code()
    spin_type = "newsletter" if eligibility["has_newsletter_spin"] else "purchase"
    
    spin_doc = {
        "spin_id": f"SPIN-{uuid.uuid4().hex[:8].upper()}",
        "email": data.email,
        "name": data.name,
        "prize_type": prize["type"],
        "prize_label": prize["label"],
        "prize_code": prize_code,
        "discount_value": prize.get("discount", 0),
        "spin_type": spin_type,
        "claimed": False,
        "jersey_name": data.jersey_name if prize["type"] == "jersey" else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.spins.insert_one(spin_doc)
    
    if spin_type == "newsletter":
        await db.newsletter.update_one(
            {"email": data.email},
            {"$set": {"spin_used": True}}
        )
    else:
        await db.spins.update_one(
            {"email": data.email, "spin_type": "purchase_credit", "used": False},
            {"$set": {"used": True}}
        )
    
    return {
        "spin_id": spin_doc["spin_id"],
        "prize_type": prize["type"],
        "prize_label": prize["label"],
        "prize_code": prize_code,
        "discount_value": prize.get("discount", 0),
        "is_jersey": False,
        "message": f"Bravo! Vous avez gagné {prize['label']}!"
    }


@router.get("/game/my-prizes")
async def get_my_prizes(email: str):
    """Get all prizes won by an email"""
    prizes = await db.spins.find(
        {"email": email, "spin_type": {"$ne": "purchase_credit"}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return prizes


@router.post("/game/claim-jersey")
async def claim_jersey(spin_id: str, jersey_name: str, phone: str, address: str):
    """Claim a jersey prize with delivery info"""
    spin = await db.spins.find_one({"spin_id": spin_id, "prize_type": "jersey"})
    
    if not spin:
        raise HTTPException(status_code=404, detail="Prix non trouvé")
    
    if spin.get("claimed"):
        raise HTTPException(status_code=400, detail="Ce prix a déjà été réclamé")
    
    await db.spins.update_one(
        {"spin_id": spin_id},
        {"$set": {
            "claimed": True,
            "jersey_name": jersey_name,
            "delivery_phone": phone,
            "delivery_address": address,
            "claimed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Maillot réclamé! Nous vous contacterons bientôt pour la livraison."}


@router.get("/game/winners")
async def get_jersey_winners():
    """Get list of jersey winners (for display)"""
    winners = await db.spins.find(
        {"prize_type": "jersey"},
        {"_id": 0, "email": 0, "delivery_phone": 0, "delivery_address": 0}
    ).sort("created_at", -1).to_list(20)
    
    for w in winners:
        if w.get("name"):
            name = w["name"]
            w["name"] = name[0] + "***" + (name[-1] if len(name) > 1 else "")
    
    return winners


@router.get("/game/stats")
async def get_game_stats():
    """Get game statistics"""
    total_spins = await db.spins.count_documents({})
    total_winners = await db.spins.count_documents({"prize_type": {"$ne": "purchase_credit"}})
    
    pipeline = [
        {"$match": {"prize_type": {"$ne": "purchase_credit"}}},
        {"$group": {"_id": "$prize_type", "count": {"$sum": 1}}}
    ]
    prize_dist = await db.spins.aggregate(pipeline).to_list(20)
    
    return {
        "total_spins": total_spins,
        "total_winners": total_winners,
        "prize_distribution": {p["_id"]: p["count"] for p in prize_dist}
    }

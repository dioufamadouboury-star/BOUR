"""
Gift Box routes - Extracted from server.py
Handles gift box configuration, sizes, wrappings, templates, and products.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

from database import db
from auth_deps import require_admin

logger = logging.getLogger(__name__)

router = APIRouter()


# ============== MODELS ==============

class GiftBoxSize(BaseModel):
    model_config = ConfigDict(extra="ignore")
    size_id: Optional[str] = None
    name: str
    description: str
    max_items: int
    base_price: int
    image: Optional[str] = None
    icon: str = "🎁"
    is_active: bool = True
    sort_order: int = 0


class GiftBoxWrapping(BaseModel):
    model_config = ConfigDict(extra="ignore")
    wrapping_id: Optional[str] = None
    name: str
    color: str
    price: int = 0
    image: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class GiftBoxConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    is_enabled: bool = True
    page_title: str = "Coffrets Cadeaux Personnalisés"
    page_description: str = "Composez le coffret parfait en sélectionnant vos articles préférés"
    banner_image: Optional[str] = None
    allow_personal_message: bool = True
    max_message_length: int = 200


class GiftBoxProductCreate(BaseModel):
    name: str
    description: str = ""
    price: int
    image: str = ""
    category: str = ""
    is_active: bool = True
    sort_order: int = 0


# ============== DEFAULT TEMPLATES ==============

DEFAULT_GIFTBOX_TEMPLATES = [
    {
        "template_id": "ramadan", "name": "Coffret Ramadan",
        "description": "Coffrets spéciaux pour le mois sacré du Ramadan",
        "icon": "🌙", "theme_color": "#2E7D32", "banner_image": None,
        "page_title": "Coffrets Ramadan - Partagez la Baraka",
        "page_subtitle": "Des coffrets pensés pour le partage et la générosité",
        "is_active": False, "sort_order": 0,
    },
    {
        "template_id": "enfant", "name": "Coffret Enfant",
        "description": "Des cadeaux qui font briller les yeux des petits",
        "icon": "🧸", "theme_color": "#FF9800", "banner_image": None,
        "page_title": "Coffrets pour Enfants",
        "page_subtitle": "Faites plaisir aux plus jeunes avec des coffrets magiques",
        "is_active": False, "sort_order": 1,
    },
    {
        "template_id": "noel", "name": "Coffret Noël",
        "description": "La magie de Noël dans un coffret",
        "icon": "🎄", "theme_color": "#C62828", "banner_image": None,
        "page_title": "Coffrets de Noël",
        "page_subtitle": "Célébrez les fêtes avec des coffrets enchanteurs",
        "is_active": False, "sort_order": 2,
    },
    {
        "template_id": "pack_accessoires", "name": "Pack Accessoires",
        "description": "Accessoires tendances regroupés pour vous",
        "icon": "👜", "theme_color": "#7B1FA2", "banner_image": None,
        "page_title": "Packs Accessoires",
        "page_subtitle": "Des ensembles d'accessoires coordonnés et stylés",
        "is_active": False, "sort_order": 3,
    },
    {
        "template_id": "saint_valentin", "name": "Coffret Saint-Valentin",
        "description": "Pour célébrer l'amour",
        "icon": "💝", "theme_color": "#E91E63", "banner_image": None,
        "page_title": "Coffrets Saint-Valentin",
        "page_subtitle": "Exprimez votre amour avec un coffret romantique",
        "is_active": False, "sort_order": 4,
    },
    {
        "template_id": "tabaski", "name": "Coffret Tabaski",
        "description": "Célébrez la fête du mouton",
        "icon": "🐑", "theme_color": "#1565C0", "banner_image": None,
        "page_title": "Coffrets Tabaski - Aïd el-Kébir",
        "page_subtitle": "Des coffrets pour partager la joie de la Tabaski",
        "is_active": False, "sort_order": 5,
    },
    {
        "template_id": "fete_meres", "name": "Coffret Fête des Mères",
        "description": "Pour remercier nos mamans adorées",
        "icon": "💐", "theme_color": "#EC407A", "banner_image": None,
        "page_title": "Coffrets Fête des Mères",
        "page_subtitle": "Offrez de la tendresse à votre maman",
        "is_active": False, "sort_order": 6,
    },
    {
        "template_id": "classique", "name": "Coffret Classique",
        "description": "Template par défaut toute l'année",
        "icon": "🎁", "theme_color": "#9333EA", "banner_image": None,
        "page_title": "Coffrets Cadeaux Personnalisés",
        "page_subtitle": "Composez le coffret parfait en sélectionnant vos articles préférés",
        "is_active": True, "sort_order": 99,
    }
]


# ============== CONFIG ROUTES ==============

@router.get("/gift-box/config")
async def get_gift_box_config():
    config = await db.gift_box_config.find_one({"config_id": "main"}, {"_id": 0})
    if not config:
        config = {
            "is_enabled": True, "page_title": "Coffrets Cadeaux Personnalisés",
            "page_description": "Composez le coffret parfait en sélectionnant vos articles préférés",
            "banner_image": None, "allow_personal_message": True, "max_message_length": 200
        }

    sizes = await db.gift_box_sizes.find({"is_active": True}, {"_id": 0}).sort("sort_order", 1).to_list(20)
    wrappings = await db.gift_box_wrappings.find({"is_active": True}, {"_id": 0}).sort("sort_order", 1).to_list(20)

    if not sizes:
        sizes = [
            {"size_id": "small", "name": "Petit Coffret", "description": "Idéal pour une attention délicate", "max_items": 3, "base_price": 5000, "icon": "🎁", "is_active": True, "sort_order": 0},
            {"size_id": "medium", "name": "Coffret Moyen", "description": "Parfait pour surprendre", "max_items": 5, "base_price": 8000, "icon": "🎀", "is_active": True, "sort_order": 1},
            {"size_id": "large", "name": "Grand Coffret", "description": "Pour les grandes occasions", "max_items": 8, "base_price": 12000, "icon": "✨", "is_active": True, "sort_order": 2},
            {"size_id": "premium", "name": "Coffret Premium", "description": "L'ultime cadeau de luxe", "max_items": 12, "base_price": 20000, "icon": "👑", "is_active": True, "sort_order": 3},
        ]

    if not wrappings:
        wrappings = [
            {"wrapping_id": "classic", "name": "Classique", "color": "#C41E3A", "price": 0, "is_active": True, "sort_order": 0},
            {"wrapping_id": "gold", "name": "Or & Luxe", "color": "#FFD700", "price": 3000, "is_active": True, "sort_order": 1},
            {"wrapping_id": "silver", "name": "Argent Élégant", "color": "#C0C0C0", "price": 2500, "is_active": True, "sort_order": 2},
            {"wrapping_id": "rose", "name": "Rose Romantique", "color": "#FF69B4", "price": 2000, "is_active": True, "sort_order": 3},
            {"wrapping_id": "nature", "name": "Nature & Kraft", "color": "#8B4513", "price": 1500, "is_active": True, "sort_order": 4},
        ]

    return {"config": config, "sizes": sizes, "wrappings": wrappings}


@router.get("/admin/gift-box/config")
async def get_admin_gift_box_config(user=Depends(require_admin)):
    config = await db.gift_box_config.find_one({"config_id": "main"}, {"_id": 0})
    if not config:
        config = {
            "config_id": "main", "is_enabled": True,
            "page_title": "Coffrets Cadeaux Personnalisés",
            "page_description": "Composez le coffret parfait en sélectionnant vos articles préférés",
            "banner_image": None, "allow_personal_message": True, "max_message_length": 200
        }
    sizes = await db.gift_box_sizes.find({}, {"_id": 0}).sort("sort_order", 1).to_list(50)
    wrappings = await db.gift_box_wrappings.find({}, {"_id": 0}).sort("sort_order", 1).to_list(50)
    return {"config": config, "sizes": sizes, "wrappings": wrappings}


@router.put("/admin/gift-box/config")
async def update_gift_box_config(config_data: GiftBoxConfig, user=Depends(require_admin)):
    await db.gift_box_config.update_one(
        {"config_id": "main"},
        {"$set": {
            "config_id": "main", "is_enabled": config_data.is_enabled,
            "page_title": config_data.page_title, "page_description": config_data.page_description,
            "banner_image": config_data.banner_image, "allow_personal_message": config_data.allow_personal_message,
            "max_message_length": config_data.max_message_length,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Configuration mise à jour"}


# ============== SIZE ROUTES ==============

@router.post("/admin/gift-box/sizes")
async def create_gift_box_size(size_data: GiftBoxSize, user=Depends(require_admin)):
    size_id = f"size_{uuid.uuid4().hex[:8]}"
    doc = {
        "size_id": size_id, "name": size_data.name, "description": size_data.description,
        "max_items": size_data.max_items, "base_price": size_data.base_price,
        "image": size_data.image, "icon": size_data.icon, "is_active": size_data.is_active,
        "sort_order": size_data.sort_order, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.gift_box_sizes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/admin/gift-box/sizes/{size_id}")
async def update_gift_box_size(size_id: str, size_data: GiftBoxSize, user=Depends(require_admin)):
    result = await db.gift_box_sizes.update_one(
        {"size_id": size_id},
        {"$set": {
            "name": size_data.name, "description": size_data.description,
            "max_items": size_data.max_items, "base_price": size_data.base_price,
            "image": size_data.image, "icon": size_data.icon, "is_active": size_data.is_active,
            "sort_order": size_data.sort_order, "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Taille non trouvée")
    return {"message": "Taille mise à jour"}


@router.delete("/admin/gift-box/sizes/{size_id}")
async def delete_gift_box_size(size_id: str, user=Depends(require_admin)):
    result = await db.gift_box_sizes.delete_one({"size_id": size_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Taille non trouvée")
    return {"message": "Taille supprimée"}


# ============== WRAPPING ROUTES ==============

@router.post("/admin/gift-box/wrappings")
async def create_gift_box_wrapping(wrapping_data: GiftBoxWrapping, user=Depends(require_admin)):
    wrapping_id = f"wrap_{uuid.uuid4().hex[:8]}"
    doc = {
        "wrapping_id": wrapping_id, "name": wrapping_data.name, "color": wrapping_data.color,
        "price": wrapping_data.price, "image": wrapping_data.image,
        "is_active": wrapping_data.is_active, "sort_order": wrapping_data.sort_order,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.gift_box_wrappings.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/admin/gift-box/wrappings/{wrapping_id}")
async def update_gift_box_wrapping(wrapping_id: str, wrapping_data: GiftBoxWrapping, user=Depends(require_admin)):
    result = await db.gift_box_wrappings.update_one(
        {"wrapping_id": wrapping_id},
        {"$set": {
            "name": wrapping_data.name, "color": wrapping_data.color, "price": wrapping_data.price,
            "image": wrapping_data.image, "is_active": wrapping_data.is_active,
            "sort_order": wrapping_data.sort_order, "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Emballage non trouvé")
    return {"message": "Emballage mis à jour"}


@router.delete("/admin/gift-box/wrappings/{wrapping_id}")
async def delete_gift_box_wrapping(wrapping_id: str, user=Depends(require_admin)):
    result = await db.gift_box_wrappings.delete_one({"wrapping_id": wrapping_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Emballage non trouvé")
    return {"message": "Emballage supprimé"}


# ============== TEMPLATE ROUTES ==============

@router.get("/admin/gift-box/templates")
async def get_giftbox_templates(user=Depends(require_admin)):
    templates = await db.gift_box_templates.find({}, {"_id": 0}).sort("sort_order", 1).to_list(50)
    if not templates:
        for t in DEFAULT_GIFTBOX_TEMPLATES:
            t["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.gift_box_templates.insert_one(t)
        templates = DEFAULT_GIFTBOX_TEMPLATES
    return {"templates": templates}


@router.get("/gift-box/active-template")
async def get_active_giftbox_template():
    template = await db.gift_box_templates.find_one({"is_active": True}, {"_id": 0})
    if not template:
        template = DEFAULT_GIFTBOX_TEMPLATES[-1]
    return template


@router.put("/admin/gift-box/templates/{template_id}/activate")
async def activate_giftbox_template(template_id: str, user=Depends(require_admin)):
    await db.gift_box_templates.update_many({}, {"$set": {"is_active": False}})
    result = await db.gift_box_templates.update_one(
        {"template_id": template_id},
        {"$set": {"is_active": True, "activated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    return {"message": f"Template '{template_id}' activé", "template_id": template_id}


@router.post("/admin/gift-box/templates")
async def create_giftbox_template(template: dict, user=Depends(require_admin)):
    template_id = template.get("template_id") or str(uuid.uuid4())[:8]
    existing = await db.gift_box_templates.find_one({"template_id": template_id})
    if existing:
        raise HTTPException(status_code=400, detail="Un template avec cet ID existe déjà")
    new_template = {
        "template_id": template_id, "name": template.get("name", "Nouveau Template"),
        "description": template.get("description", ""), "icon": template.get("icon", "🎁"),
        "theme_color": template.get("theme_color", "#9333EA"),
        "banner_image": template.get("banner_image"),
        "page_title": template.get("page_title", "Coffrets Personnalisés"),
        "page_subtitle": template.get("page_subtitle", ""),
        "is_active": False, "sort_order": template.get("sort_order", 50),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.gift_box_templates.insert_one(new_template)
    new_template.pop("_id", None)
    return {"message": "Template créé", "template": new_template}


@router.put("/admin/gift-box/templates/{template_id}")
async def update_giftbox_template(template_id: str, template: dict, user=Depends(require_admin)):
    update_data = {
        "name": template.get("name"), "description": template.get("description"),
        "icon": template.get("icon"), "theme_color": template.get("theme_color"),
        "banner_image": template.get("banner_image"), "page_title": template.get("page_title"),
        "page_subtitle": template.get("page_subtitle"), "sort_order": template.get("sort_order"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    update_data = {k: v for k, v in update_data.items() if v is not None}
    result = await db.gift_box_templates.update_one({"template_id": template_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    return {"message": "Template mis à jour"}


@router.delete("/admin/gift-box/templates/{template_id}")
async def delete_giftbox_template(template_id: str, user=Depends(require_admin)):
    if template_id in ["classique", "ramadan", "noel", "enfant", "pack_accessoires"]:
        raise HTTPException(status_code=400, detail="Impossible de supprimer un template par défaut")
    result = await db.gift_box_templates.delete_one({"template_id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    return {"message": "Template supprimé"}


# ============== PRODUCT ROUTES ==============

@router.get("/gift-box/products")
async def get_giftbox_products():
    products = await db.gift_box_products.find({"is_active": True}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    return {"products": products}


@router.get("/admin/gift-box/products")
async def get_admin_giftbox_products(user=Depends(require_admin)):
    products = await db.gift_box_products.find({}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    return {"products": products}


@router.post("/admin/gift-box/products")
async def create_giftbox_product(product: GiftBoxProductCreate, user=Depends(require_admin)):
    product_id = f"gbp_{uuid.uuid4().hex[:12]}"
    new_product = {
        "product_id": product_id, "name": product.name, "description": product.description,
        "price": product.price, "image": product.image, "category": product.category,
        "is_active": product.is_active, "sort_order": product.sort_order,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.gift_box_products.insert_one(new_product)
    new_product.pop("_id", None)
    return {"message": "Produit coffret créé", "product": new_product}


@router.put("/admin/gift-box/products/{product_id}")
async def update_giftbox_product(product_id: str, product: dict, user=Depends(require_admin)):
    update_data = {
        "name": product.get("name"), "description": product.get("description"),
        "price": product.get("price"), "image": product.get("image"),
        "category": product.get("category"), "is_active": product.get("is_active"),
        "sort_order": product.get("sort_order"), "updated_at": datetime.now(timezone.utc).isoformat()
    }
    update_data = {k: v for k, v in update_data.items() if v is not None}
    result = await db.gift_box_products.update_one({"product_id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return {"message": "Produit mis à jour"}


@router.delete("/admin/gift-box/products/{product_id}")
async def delete_giftbox_product(product_id: str, user=Depends(require_admin)):
    result = await db.gift_box_products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return {"message": "Produit supprimé"}


@router.post("/admin/gift-box/products/import-from-catalog")
async def import_products_to_giftbox(data: dict, user=Depends(require_admin)):
    product_ids = data.get("product_ids", [])
    if not product_ids:
        raise HTTPException(status_code=400, detail="Aucun produit sélectionné")
    imported = 0
    for pid in product_ids:
        product = await db.products.find_one({"product_id": pid}, {"_id": 0})
        if not product:
            continue
        existing = await db.gift_box_products.find_one({"original_product_id": pid})
        if existing:
            continue
        new_product = {
            "product_id": f"gbp_{uuid.uuid4().hex[:12]}", "original_product_id": pid,
            "name": product["name"], "description": product.get("short_description", ""),
            "price": product["price"], "image": product["images"][0] if product.get("images") else "",
            "category": product.get("category", ""), "is_active": True, "sort_order": 99,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.gift_box_products.insert_one(new_product)
        imported += 1
    return {"message": f"{imported} produit(s) importé(s)", "imported": imported}

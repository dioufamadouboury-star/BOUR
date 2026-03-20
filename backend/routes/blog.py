"""
Blog routes - Extracted from server.py
Handles blog posts CRUD and sample content.
"""
from fastapi import APIRouter, HTTPException, Depends
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

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    image: str
    category: str
    tags: Optional[List[str]] = []
    author: str = "YAMA+"
    read_time: int = 5
    related_category: Optional[str] = None
    is_published: bool = True


class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    post_id: str
    title: str
    slug: str
    excerpt: str
    content: str
    image: str
    category: str
    tags: List[str] = []
    author: str
    read_time: int
    related_category: Optional[str] = None
    is_published: bool = True
    views: int = 0
    created_at: datetime
    updated_at: datetime


# ============== SAMPLE DATA ==============

SAMPLE_POSTS_LIST = [
    {"post_id": "sample_1", "slug": "guide-achat-smartphone-2025", "title": "Guide d'achat : Comment choisir son smartphone en 2025", "excerpt": "Découvrez les critères essentiels pour choisir le smartphone parfait.", "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800", "category": "Guides d'achat", "date": "2025-02-01", "readTime": 8, "author": "YAMA+"},
    {"post_id": "sample_2", "slug": "tendances-decoration-2025", "title": "Les tendances déco 2025", "excerpt": "Couleurs, matériaux, styles... Découvrez toutes les tendances.", "image": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800", "category": "Tendances", "date": "2025-01-28", "readTime": 6, "author": "YAMA+"},
    {"post_id": "sample_3", "slug": "conseils-entretien-electromenager", "title": "5 conseils pour prolonger la durée de vie de vos appareils", "excerpt": "Nos astuces simples pour entretenir vos appareils.", "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", "category": "Conseils", "date": "2025-01-25", "readTime": 5, "author": "YAMA+"},
    {"post_id": "sample_4", "slug": "nouveautes-apple-2025", "title": "Apple 2025 : Toutes les nouveautés", "excerpt": "iPhone 17, MacBook M4... Tour d'horizon des produits Apple.", "image": "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800", "category": "Nouveautés", "date": "2025-01-20", "readTime": 7, "author": "YAMA+"},
    {"post_id": "sample_5", "slug": "routine-beaute-naturelle", "title": "Routine beauté : Les indispensables", "excerpt": "Découvrez notre sélection de produits pour une routine beauté.", "image": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800", "category": "Conseils", "date": "2025-01-18", "readTime": 4, "author": "YAMA+"},
    {"post_id": "sample_6", "slug": "guide-televiseur-4k", "title": "TV 4K ou 8K : Quel téléviseur choisir ?", "excerpt": "OLED, QLED, Mini-LED... On vous explique tout.", "image": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800", "category": "Guides d'achat", "date": "2025-01-15", "readTime": 9, "author": "YAMA+"},
]

SAMPLE_POSTS_DETAIL = {
    "guide-achat-smartphone-2025": {
        "post_id": "sample_1", "slug": "guide-achat-smartphone-2025",
        "title": "Guide d'achat : Comment choisir son smartphone en 2025",
        "excerpt": "Découvrez les critères essentiels pour choisir le smartphone parfait.",
        "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200",
        "category": "Guides d'achat", "tags": ["smartphone", "guide", "tech"],
        "date": "2025-02-01", "readTime": 8, "author": "YAMA+", "relatedCategory": "electronique",
        "content": "<p>Choisir un smartphone en 2025 peut sembler complexe. Ce guide vous aidera.</p><h2>1. Définir son budget</h2><p>Le marché se divise en trois catégories de prix.</p><h2>2. L'écran</h2><p>Privilégiez un taux de 90Hz minimum.</p><h2>3. La puissance</h2><p>Au moins 6 Go de RAM.</p>"
    },
    "tendances-decoration-2025": {
        "post_id": "sample_2", "slug": "tendances-decoration-2025",
        "title": "Les tendances déco 2025", "excerpt": "Couleurs, matériaux, styles...",
        "image": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
        "category": "Tendances", "tags": ["décoration", "tendances", "maison"],
        "date": "2025-01-28", "readTime": 6, "author": "YAMA+", "relatedCategory": "decoration",
        "content": "<p>L'année 2025 apporte de nouvelles tendances déco.</p><h2>Les couleurs phares</h2><p>Le Mocha Mousse, élu couleur de l'année.</p>"
    },
    "conseils-entretien-electromenager": {
        "post_id": "sample_3", "slug": "conseils-entretien-electromenager",
        "title": "5 conseils pour prolonger la durée de vie de vos appareils",
        "excerpt": "Nos astuces simples pour entretenir vos appareils.",
        "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200",
        "category": "Conseils", "tags": ["entretien", "électroménager"],
        "date": "2025-01-25", "readTime": 5, "author": "YAMA+",
        "content": "<p>Des gestes simples pour faire durer vos appareils.</p>"
    },
}


def get_sample_blog_posts(category=None):
    if category and category != "all":
        category_map = {"guides": "Guides d'achat", "tendances": "Tendances", "conseils": "Conseils", "nouveautes": "Nouveautés"}
        target = category_map.get(category, category)
        return [p for p in SAMPLE_POSTS_LIST if p["category"] == target]
    return SAMPLE_POSTS_LIST


def get_sample_blog_post(slug):
    return SAMPLE_POSTS_DETAIL.get(slug)


# ============== PUBLIC ROUTES ==============

@router.get("/blog/posts")
async def get_blog_posts(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    query = {"is_published": True}
    if category and category != "all":
        query["category"] = category
    posts = await db.blog_posts.find(query, {"_id": 0, "content": 0}).sort("created_at", -1).skip(skip).limit(min(limit, 50)).to_list(50)
    if not posts:
        return get_sample_blog_posts(category)
    return posts


@router.get("/blog/posts/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug, "is_published": True}, {"_id": 0})
    if not post:
        sample = get_sample_blog_post(slug)
        if sample:
            return {"post": sample, "related": []}
        raise HTTPException(status_code=404, detail="Article non trouvé")
    await db.blog_posts.update_one({"slug": slug}, {"$inc": {"views": 1}})
    related = await db.blog_posts.find(
        {"category": post.get("category"), "slug": {"$ne": slug}, "is_published": True},
        {"_id": 0, "content": 0}
    ).limit(3).to_list(3)
    return {"post": post, "related": related}


# ============== ADMIN ROUTES ==============

@router.post("/admin/blog/posts")
async def create_blog_post(post_data: BlogPostCreate, user=Depends(require_admin)):
    existing = await db.blog_posts.find_one({"slug": post_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Un article avec ce slug existe déjà")
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    post_doc = {
        "post_id": post_id, "title": post_data.title, "slug": post_data.slug,
        "excerpt": post_data.excerpt, "content": post_data.content, "image": post_data.image,
        "category": post_data.category, "tags": post_data.tags or [], "author": post_data.author,
        "read_time": post_data.read_time, "related_category": post_data.related_category,
        "is_published": post_data.is_published, "views": 0,
        "created_at": now.isoformat(), "updated_at": now.isoformat()
    }
    await db.blog_posts.insert_one(post_doc)
    post_doc.pop("_id", None)
    return post_doc


@router.put("/admin/blog/posts/{post_id}")
async def update_blog_post(post_id: str, post_data: BlogPostCreate, user=Depends(require_admin)):
    existing = await db.blog_posts.find_one({"post_id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    if post_data.slug != existing.get("slug"):
        slug_exists = await db.blog_posts.find_one({"slug": post_data.slug, "post_id": {"$ne": post_id}})
        if slug_exists:
            raise HTTPException(status_code=400, detail="Ce slug est déjà utilisé")
    update_doc = {
        "title": post_data.title, "slug": post_data.slug, "excerpt": post_data.excerpt,
        "content": post_data.content, "image": post_data.image, "category": post_data.category,
        "tags": post_data.tags or [], "author": post_data.author, "read_time": post_data.read_time,
        "related_category": post_data.related_category, "is_published": post_data.is_published,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.blog_posts.update_one({"post_id": post_id}, {"$set": update_doc})
    return {"message": "Article mis à jour"}


@router.delete("/admin/blog/posts/{post_id}")
async def delete_blog_post(post_id: str, user=Depends(require_admin)):
    result = await db.blog_posts.delete_one({"post_id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return {"message": "Article supprimé"}


@router.get("/admin/blog/posts")
async def get_admin_blog_posts(user=Depends(require_admin)):
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

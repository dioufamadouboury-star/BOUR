"""
Script to fix broken product images in the database
Replaces missing upload references with placeholder images
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import os

router = APIRouter(tags=["Admin - Image Repair"])

# High-quality placeholder images by category (from Unsplash)
CATEGORY_PLACEHOLDERS = {
    "electronique": [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800",
    ],
    "electromenager": [
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
    ],
    "decoration": [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
    ],
    "mobilier": [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
        "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
    ],
    "beaute": [
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800",
    ],
    "default": [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    ]
}


def get_db():
    """Get database instance"""
    from server import db
    return db


def is_image_broken(image_url: str, uploads_dir: str = "/var/www/yamaplus/backend/uploads") -> bool:
    """Check if an image URL points to a missing file"""
    if not image_url:
        return True
    
    # External URLs (Unsplash, Pexels) are considered valid
    if image_url.startswith("http://") or image_url.startswith("https://"):
        return False
    
    # Check local uploads
    if "/uploads/" in image_url:
        filename = image_url.split("/uploads/")[-1]
        file_path = os.path.join(uploads_dir, filename)
        return not os.path.exists(file_path)
    
    return True


@router.get("/admin/repair-images/check")
async def check_broken_images():
    """Check how many products have broken images"""
    db = get_db()
    
    products = await db.products.find({}, {"product_id": 1, "name": 1, "images": 1, "category": 1, "_id": 0}).to_list(length=1000)
    
    broken_products = []
    total_broken_images = 0
    
    for product in products:
        images = product.get("images", [])
        broken_images = [img for img in images if is_image_broken(img)]
        
        if broken_images:
            broken_products.append({
                "product_id": product.get("product_id"),
                "name": product.get("name"),
                "category": product.get("category"),
                "total_images": len(images),
                "broken_images": len(broken_images)
            })
            total_broken_images += len(broken_images)
    
    return {
        "total_products": len(products),
        "products_with_broken_images": len(broken_products),
        "total_broken_images": total_broken_images,
        "broken_products": broken_products[:20]  # Show first 20
    }


@router.post("/admin/repair-images/fix")
async def fix_broken_images():
    """Replace all broken image URLs with category-appropriate placeholders"""
    db = get_db()
    
    products = await db.products.find({}, {"product_id": 1, "name": 1, "images": 1, "category": 1, "_id": 0}).to_list(length=1000)
    
    fixed_count = 0
    fixed_products = []
    
    for product in products:
        images = product.get("images", [])
        category = product.get("category", "default").lower()
        
        # Get placeholder images for this category
        placeholders = CATEGORY_PLACEHOLDERS.get(category, CATEGORY_PLACEHOLDERS["default"])
        
        new_images = []
        was_fixed = False
        
        for i, img in enumerate(images):
            if is_image_broken(img):
                # Replace with category placeholder
                placeholder = placeholders[i % len(placeholders)]
                new_images.append(placeholder)
                was_fixed = True
            else:
                new_images.append(img)
        
        # If product has no images at all, add a placeholder
        if not new_images:
            new_images = [placeholders[0]]
            was_fixed = True
        
        if was_fixed:
            # Update product in database
            await db.products.update_one(
                {"product_id": product["product_id"]},
                {"$set": {
                    "images": new_images,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            fixed_count += 1
            fixed_products.append({
                "product_id": product["product_id"],
                "name": product["name"],
                "old_images": images,
                "new_images": new_images
            })
    
    return {
        "success": True,
        "fixed_products_count": fixed_count,
        "message": f"Fixed {fixed_count} products with broken images",
        "fixed_products": fixed_products[:10]  # Show first 10
    }


@router.post("/admin/repair-images/restore-from-backup")
async def restore_images_from_backup(backup_source: str = None):
    """
    Placeholder for future: restore images from a backup source
    """
    return {
        "success": False,
        "message": "This feature requires a backup source. Please upload images manually via the Admin panel."
    }

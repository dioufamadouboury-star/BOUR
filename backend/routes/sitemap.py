"""
Dynamic Sitemap Generator for GROUPE YAMA+
Generates sitemap.xml from products database
"""
from fastapi import APIRouter, Response
from fastapi.responses import Response as FastAPIResponse
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

router = APIRouter(tags=["SEO"])

SITE_URL = "https://groupeyamaplus.com"

# Static pages with their priorities and change frequencies
STATIC_PAGES = [
    {"loc": "/", "priority": "1.0", "changefreq": "daily"},
    {"loc": "/nouveautes", "priority": "0.9", "changefreq": "daily"},
    {"loc": "/promotions", "priority": "0.9", "changefreq": "daily"},
    {"loc": "/category/electronique", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/category/electromenager", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/category/decoration", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/category/beaute", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/category/automobile", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/category/immobilier", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/services", "priority": "0.7", "changefreq": "weekly"},
    {"loc": "/blog", "priority": "0.7", "changefreq": "weekly"},
    {"loc": "/a-propos", "priority": "0.5", "changefreq": "monthly"},
    {"loc": "/contact", "priority": "0.5", "changefreq": "monthly"},
    {"loc": "/aide", "priority": "0.5", "changefreq": "monthly"},
    {"loc": "/cgv", "priority": "0.3", "changefreq": "yearly"},
    {"loc": "/confidentialite", "priority": "0.3", "changefreq": "yearly"},
    {"loc": "/livraison", "priority": "0.4", "changefreq": "monthly"},
    {"loc": "/retours", "priority": "0.4", "changefreq": "monthly"},
    {"loc": "/b2b", "priority": "0.6", "changefreq": "weekly"},
    {"loc": "/sourcing", "priority": "0.6", "changefreq": "weekly"},
    {"loc": "/import-chine", "priority": "0.6", "changefreq": "weekly"},
]


def get_db():
    """Get database instance - imported from main server"""
    from server import db
    return db


@router.get("/sitemap.xml")
async def generate_sitemap():
    """Generate dynamic sitemap.xml with all products and pages"""
    
    db = get_db()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Create XML structure
    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset.set("xmlns:image", "http://www.google.com/schemas/sitemap-image/1.1")
    
    # Add static pages
    for page in STATIC_PAGES:
        url = ET.SubElement(urlset, "url")
        ET.SubElement(url, "loc").text = f"{SITE_URL}{page['loc']}"
        ET.SubElement(url, "lastmod").text = today
        ET.SubElement(url, "changefreq").text = page["changefreq"]
        ET.SubElement(url, "priority").text = page["priority"]
    
    # Add all products from database
    try:
        products = await db.products.find(
            {},
            {"product_id": 1, "name": 1, "images": 1, "updated_at": 1, "created_at": 1, "_id": 0}
        ).to_list(length=5000)
        
        for product in products:
            url = ET.SubElement(urlset, "url")
            ET.SubElement(url, "loc").text = f"{SITE_URL}/product/{product['product_id']}"
            
            # Use updated_at or created_at for lastmod
            lastmod = product.get("updated_at") or product.get("created_at") or today
            if isinstance(lastmod, str):
                # If it's an ISO string, extract just the date part
                lastmod = lastmod.split("T")[0] if "T" in lastmod else lastmod
            ET.SubElement(url, "lastmod").text = lastmod
            
            ET.SubElement(url, "changefreq").text = "weekly"
            ET.SubElement(url, "priority").text = "0.7"
            
            # Add product image if available
            images = product.get("images", [])
            if images and len(images) > 0:
                image_elem = ET.SubElement(url, "{http://www.google.com/schemas/sitemap-image/1.1}image")
                image_loc = images[0]
                if not image_loc.startswith("http"):
                    image_loc = f"{SITE_URL}{image_loc}"
                ET.SubElement(image_elem, "{http://www.google.com/schemas/sitemap-image/1.1}loc").text = image_loc
                ET.SubElement(image_elem, "{http://www.google.com/schemas/sitemap-image/1.1}title").text = product.get("name", "")
    
    except Exception as e:
        print(f"Error fetching products for sitemap: {e}")
    
    # Add blog posts
    try:
        blog_posts = await db.blog_posts.find(
            {"status": "published"},
            {"slug": 1, "updated_at": 1, "created_at": 1, "_id": 0}
        ).to_list(length=500)
        
        for post in blog_posts:
            url = ET.SubElement(urlset, "url")
            ET.SubElement(url, "loc").text = f"{SITE_URL}/blog/{post['slug']}"
            lastmod = post.get("updated_at") or post.get("created_at") or today
            if isinstance(lastmod, str):
                lastmod = lastmod.split("T")[0] if "T" in lastmod else lastmod
            ET.SubElement(url, "lastmod").text = lastmod
            ET.SubElement(url, "changefreq").text = "monthly"
            ET.SubElement(url, "priority").text = "0.6"
    
    except Exception as e:
        print(f"Error fetching blog posts for sitemap: {e}")
    
    # Generate XML string
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content = ET.tostring(urlset, encoding="unicode", method="xml")
    full_xml = xml_declaration + xml_content
    
    return Response(
        content=full_xml,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
            "X-Robots-Tag": "noindex"  # Don't index the sitemap itself
        }
    )


@router.get("/robots.txt")
async def get_robots_txt():
    """Serve dynamic robots.txt"""
    
    robots_content = f"""# GROUPE YAMA+ - robots.txt
# https://groupeyamaplus.com

User-agent: *
Allow: /
Allow: /product/
Allow: /category/
Allow: /blog/
Allow: /promotions
Allow: /nouveautes
Allow: /coffret-cadeau
Allow: /a-propos
Allow: /contact
Allow: /aide
Allow: /b2b
Allow: /sourcing

# Disallow admin and private pages
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /checkout
Disallow: /account
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /auth/
Disallow: /panier
Disallow: /reseller/

# Disallow search results (prevent thin content indexing)
Disallow: /recherche?

# Crawl-delay
Crawl-delay: 1

# Googlebot specific
User-agent: Googlebot
Allow: /
Crawl-delay: 0

# Sitemap
Sitemap: {SITE_URL}/api/sitemap.xml
"""
    
    return Response(
        content=robots_content,
        media_type="text/plain",
        headers={"Cache-Control": "public, max-age=86400"}  # Cache for 24 hours
    )

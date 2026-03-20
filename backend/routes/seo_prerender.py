"""
SEO Prerender - Serves bot-friendly HTML to search engine crawlers.
When Googlebot visits a page, Nginx routes the request here instead of
serving the SPA. This returns full HTML with meta tags, Schema.org,
and basic text content for proper indexing.
"""
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from database import db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

SITE_NAME = "GROUPE YAMA+"
SITE_URL = "https://groupeyamaplus.com"
DEFAULT_IMAGE = "https://groupeyamaplus.com/assets/images/logo_yama_full.png"
DEFAULT_DESC = "GROUPE YAMA+ - Votre boutique premium au Sénégal. Électronique, électroménager, décoration, beauté. Livraison rapide Dakar. Paiement Wave, Orange Money."


def html_template(title, description, url, image, extra_head="", body_content="", schema_json=""):
    canonical = f"{SITE_URL}{url}"
    full_title = f"{title} | {SITE_NAME}" if title else f"{SITE_NAME} - Le shopping, autrement"
    img = image if image and image.startswith("http") else f"{SITE_URL}{image}" if image else DEFAULT_IMAGE

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{full_title}</title>
    <meta name="description" content="{description}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="{canonical}" />
    <meta name="author" content="{SITE_NAME}" />
    <meta name="geo.region" content="SN-DK" />
    <meta name="geo.placename" content="Dakar" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="{canonical}" />
    <meta property="og:title" content="{full_title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:image" content="{img}" />
    <meta property="og:site_name" content="{SITE_NAME}" />
    <meta property="og:locale" content="fr_SN" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{full_title}" />
    <meta name="twitter:description" content="{description}" />
    <meta name="twitter:image" content="{img}" />

    {extra_head}
    {schema_json}
</head>
<body>
    <h1>{full_title}</h1>
    {body_content}
    <footer>
        <p>{SITE_NAME} - Fass Paillote, Dakar, Sénégal - Tel: +221 78 382 75 75</p>
        <nav>
            <a href="{SITE_URL}/">Accueil</a> |
            <a href="{SITE_URL}/category/electronique">Électronique</a> |
            <a href="{SITE_URL}/category/electromenager">Électroménager</a> |
            <a href="{SITE_URL}/category/decoration">Décoration</a> |
            <a href="{SITE_URL}/category/beaute">Beauté</a> |
            <a href="{SITE_URL}/promotions">Promotions</a> |
            <a href="{SITE_URL}/contact">Contact</a>
        </nav>
    </footer>
</body>
</html>"""


def make_schema(data):
    import json
    return f'<script type="application/ld+json">{json.dumps(data, ensure_ascii=False)}</script>'


# ============== HOMEPAGE ==============
@router.get("/")
async def prerender_home():
    products = await db.products.find({}, {"_id": 0, "name": 1, "price": 1, "product_id": 1, "short_description": 1}).limit(20).to_list(20)

    body = "<h2>Boutique Premium au Sénégal</h2>"
    body += "<p>Découvrez notre sélection de produits premium : électronique, électroménager, décoration, beauté et mode. Livraison rapide à Dakar et dans toutes les régions du Sénégal. Paiement Wave, Orange Money, Free Money.</p>"
    body += "<h2>Nos Produits</h2><ul>"
    for p in products:
        body += f'<li><a href="{SITE_URL}/product/{p["product_id"]}">{p["name"]}</a> - {p.get("price", 0):,} FCFA</li>'
    body += "</ul>"
    body += "<h2>Catégories</h2><ul>"
    body += f'<li><a href="{SITE_URL}/category/electronique">Électronique - iPhone, Samsung, MacBook, tablettes</a></li>'
    body += f'<li><a href="{SITE_URL}/category/electromenager">Électroménager - Réfrigérateurs, climatiseurs, machines à laver</a></li>'
    body += f'<li><a href="{SITE_URL}/category/decoration">Décoration & Mobilier - Mobilier moderne, luminaires</a></li>'
    body += f'<li><a href="{SITE_URL}/category/beaute">Beauté & Mode - Cosmétiques, soins, accessoires</a></li>'
    body += f'<li><a href="{SITE_URL}/category/automobile">Automobile - Accessoires auto, GPS, dashcam</a></li>'
    body += "</ul>"

    schema = make_schema({
        "@context": "https://schema.org", "@type": "Store",
        "name": SITE_NAME, "url": SITE_URL,
        "description": DEFAULT_DESC,
        "telephone": "+221783827575",
        "address": {"@type": "PostalAddress", "streetAddress": "Fass Paillote", "addressLocality": "Dakar", "addressCountry": "SN"},
        "priceRange": "$$", "currenciesAccepted": "XOF",
        "paymentAccepted": "Wave, Orange Money, Free Money, Cash",
        "openingHours": "Mo-Sa 09:00-19:00"
    })

    return HTMLResponse(html_template(
        "", DEFAULT_DESC, "/", DEFAULT_IMAGE,
        body_content=body, schema_json=schema
    ))


# ============== PRODUCT PAGE ==============
@router.get("/product/{product_id}")
async def prerender_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        return HTMLResponse(html_template("Produit non trouvé", DEFAULT_DESC, f"/product/{product_id}", DEFAULT_IMAGE), status_code=404)

    name = product.get("name", "")
    price = product.get("price", 0)
    desc = product.get("meta_description") or product.get("short_description") or product.get("description", "")[:160]
    images = product.get("images", [])
    image = images[0] if images else DEFAULT_IMAGE
    stock = product.get("stock", 0)
    brand = product.get("brand", SITE_NAME)
    flash_price = product.get("flash_sale_price")

    seo_desc = f"{name} - {desc} Prix: {price:,} FCFA. Livraison rapide à Dakar. Paiement Wave, Orange Money. {SITE_NAME}"

    body = f"<h2>{name}</h2>"
    body += f"<p>{desc}</p>"
    body += f"<p><strong>Prix: {price:,} FCFA</strong></p>"
    if flash_price:
        body += f"<p><strong>Prix promo: {flash_price:,} FCFA</strong></p>"
    body += f"<p>Disponibilité: {'En stock' if stock > 0 else 'Rupture de stock'}</p>"
    body += f"<p>Marque: {brand}</p>"
    if images:
        for img in images[:3]:
            img_url = img if img.startswith("http") else f"{SITE_URL}{img}"
            body += f'<img src="{img_url}" alt="{name}" />'

    extra_head = f'<meta property="product:price:amount" content="{flash_price or price}" />'
    extra_head += '<meta property="product:price:currency" content="XOF" />'
    extra_head += f'<meta property="product:availability" content="{"in stock" if stock > 0 else "out of stock"}" />'

    schema = make_schema({
        "@context": "https://schema.org", "@type": "Product",
        "name": name, "description": desc,
        "image": [img if img.startswith("http") else f"{SITE_URL}{img}" for img in images[:5]],
        "sku": product_id, "brand": {"@type": "Brand", "name": brand},
        "offers": {
            "@type": "Offer", "url": f"{SITE_URL}/product/{product_id}",
            "priceCurrency": "XOF", "price": flash_price or price,
            "availability": "https://schema.org/InStock" if stock > 0 else "https://schema.org/OutOfStock",
            "seller": {"@type": "Organization", "name": SITE_NAME}
        }
    })

    return HTMLResponse(html_template(name, seo_desc, f"/product/{product_id}", image, extra_head=extra_head, body_content=body, schema_json=schema))


# ============== CATEGORY PAGE ==============
@router.get("/category/{category}")
async def prerender_category(category: str):
    cat_meta = {
        "electronique": ("Électronique", "Achetez les meilleurs produits électroniques au Sénégal. iPhone, Samsung, MacBook, tablettes, casques et accessoires tech. Livraison rapide à Dakar. Paiement Wave, Orange Money.", ["iPhone Dakar", "Samsung Sénégal", "MacBook Dakar", "smartphone Sénégal", "acheter téléphone Dakar"]),
        "electromenager": ("Électroménager", "Électroménager de qualité au Sénégal. Réfrigérateurs, climatiseurs, machines à laver, cuisinières et petit électroménager. Prix compétitifs, livraison Dakar.", ["réfrigérateur Dakar", "climatiseur Sénégal", "machine à laver Dakar", "électroménager pas cher Sénégal"]),
        "decoration": ("Décoration & Mobilier", "Décoration et mobilier moderne au Sénégal. Canapés, tables, luminaires, accessoires déco et art mural. Transformez votre intérieur. Livraison Dakar.", ["décoration Dakar", "mobilier Sénégal", "meuble moderne Dakar", "luminaire Sénégal"]),
        "beaute": ("Beauté & Mode", "Produits de beauté et mode au Sénégal. Soins visage, maquillage, parfums et accessoires mode. Marques authentiques, livraison rapide.", ["cosmétique Dakar", "maquillage Sénégal", "parfum Dakar", "beauté Sénégal"]),
        "automobile": ("Automobile", "Accessoires auto au Sénégal. GPS, dashcam, pièces détachées et équipements véhicule. Rendez-vous, locations, covoiturage.", ["accessoire auto Dakar", "GPS voiture Sénégal", "location voiture Dakar"]),
    }

    title, desc, keywords = cat_meta.get(category, (category.title(), DEFAULT_DESC, []))

    products = await db.products.find({"category": category}, {"_id": 0, "name": 1, "price": 1, "product_id": 1}).limit(50).to_list(50)

    body = f"<h2>{title} - {SITE_NAME}</h2>"
    body += f"<p>{desc}</p>"
    if products:
        body += "<h3>Nos produits</h3><ul>"
        for p in products:
            body += f'<li><a href="{SITE_URL}/product/{p["product_id"]}">{p["name"]}</a> - {p.get("price", 0):,} FCFA</li>'
        body += "</ul>"

    extra = f'<meta name="keywords" content="{", ".join(keywords)}" />'

    schema = make_schema({
        "@context": "https://schema.org", "@type": "CollectionPage",
        "name": f"{title} - {SITE_NAME}", "description": desc,
        "url": f"{SITE_URL}/category/{category}",
        "mainEntity": {"@type": "ItemList", "itemListElement": [
            {"@type": "ListItem", "position": i+1, "url": f"{SITE_URL}/product/{p['product_id']}", "name": p["name"]}
            for i, p in enumerate(products[:20])
        ]}
    })

    return HTMLResponse(html_template(title, desc, f"/category/{category}", DEFAULT_IMAGE, extra_head=extra, body_content=body, schema_json=schema))


# ============== PROMOTIONS ==============
@router.get("/promotions")
async def prerender_promotions():
    products = await db.products.find({"is_promo": True}, {"_id": 0, "name": 1, "price": 1, "product_id": 1, "flash_sale_price": 1}).limit(30).to_list(30)
    if not products:
        products = await db.products.find({"is_flash_sale": True}, {"_id": 0, "name": 1, "price": 1, "product_id": 1, "flash_sale_price": 1}).limit(30).to_list(30)

    desc = "Les meilleures promotions au Sénégal ! Réductions sur l'électronique, électroménager, décoration et beauté. Livraison rapide Dakar. Paiement Wave, Orange Money."
    body = "<h2>Promotions & Bonnes Affaires</h2>"
    body += f"<p>{desc}</p>"
    if products:
        body += "<ul>"
        for p in products:
            price = p.get("flash_sale_price") or p.get("price", 0)
            body += f'<li><a href="{SITE_URL}/product/{p["product_id"]}">{p["name"]}</a> - {price:,} FCFA</li>'
        body += "</ul>"

    return HTMLResponse(html_template("Promotions & Bonnes Affaires", desc, "/promotions", DEFAULT_IMAGE, body_content=body))


# ============== NOUVEAUTES ==============
@router.get("/nouveautes")
async def prerender_new_products():
    products = await db.products.find({}, {"_id": 0, "name": 1, "price": 1, "product_id": 1}).sort("created_at", -1).limit(20).to_list(20)

    desc = "Découvrez les derniers produits arrivés chez GROUPE YAMA+. Nouveautés électronique, décoration, beauté au Sénégal. Livraison rapide à Dakar."
    body = "<h2>Nouveautés</h2>"
    body += f"<p>{desc}</p><ul>"
    for p in products:
        body += f'<li><a href="{SITE_URL}/product/{p["product_id"]}">{p["name"]}</a> - {p.get("price", 0):,} FCFA</li>'
    body += "</ul>"

    return HTMLResponse(html_template("Nouveautés - Derniers Produits", desc, "/nouveautes", DEFAULT_IMAGE, body_content=body))


# ============== BLOG ==============
@router.get("/blog")
async def prerender_blog():
    posts = await db.blog_posts.find({"is_published": True}, {"_id": 0, "title": 1, "slug": 1, "excerpt": 1}).sort("created_at", -1).limit(20).to_list(20)

    desc = "Blog GROUPE YAMA+ - Guides d'achat, tendances, conseils et nouveautés. Tout sur l'électronique, la décoration et la beauté au Sénégal."
    body = "<h2>Blog</h2><ul>"
    for p in posts:
        body += f'<li><a href="{SITE_URL}/blog/{p["slug"]}">{p["title"]}</a> - {p.get("excerpt", "")}</li>'
    body += "</ul>"

    return HTMLResponse(html_template("Blog - Guides & Conseils", desc, "/blog", DEFAULT_IMAGE, body_content=body))


@router.get("/blog/{slug}")
async def prerender_blog_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not post:
        return HTMLResponse(html_template("Article non trouvé", DEFAULT_DESC, f"/blog/{slug}", DEFAULT_IMAGE), status_code=404)

    title = post.get("title", "")
    excerpt = post.get("excerpt", "")
    content = post.get("content", "")
    image = post.get("image", DEFAULT_IMAGE)

    schema = make_schema({
        "@context": "https://schema.org", "@type": "Article",
        "headline": title, "description": excerpt, "image": image,
        "datePublished": post.get("created_at", ""), "dateModified": post.get("updated_at", ""),
        "author": {"@type": "Organization", "name": SITE_NAME},
        "publisher": {"@type": "Organization", "name": SITE_NAME, "logo": {"@type": "ImageObject", "url": DEFAULT_IMAGE}}
    })

    body = f"<article><h2>{title}</h2><p>{excerpt}</p>{content}</article>"

    return HTMLResponse(html_template(title, excerpt, f"/blog/{slug}", image, body_content=body, schema_json=schema))


# ============== STATIC PAGES ==============
@router.get("/a-propos")
async def prerender_about():
    desc = "GROUPE YAMA+ - Votre boutique premium au Sénégal. Découvrez notre histoire, notre mission et nos valeurs. Électronique, décoration, beauté à Dakar."
    body = "<h2>À propos de GROUPE YAMA+</h2>"
    body += "<p>GROUPE YAMA+ est votre destination shopping premium au Sénégal. Nous proposons une sélection rigoureuse de produits de qualité dans les domaines de l'électronique, l'électroménager, la décoration, la beauté et l'automobile.</p>"
    body += "<p>Basés à Dakar (Fass Paillote), nous livrons dans les 14 régions du Sénégal avec paiement Wave, Orange Money et Free Money.</p>"
    return HTMLResponse(html_template("À propos", desc, "/a-propos", DEFAULT_IMAGE, body_content=body))


@router.get("/contact")
async def prerender_contact():
    desc = "Contactez GROUPE YAMA+ à Dakar, Sénégal. WhatsApp, téléphone, email. Service client réactif. Fass Paillote, Dakar. +221 78 382 75 75."
    body = "<h2>Contactez-nous</h2>"
    body += "<p>Adresse : Fass Paillote, Dakar, Sénégal</p>"
    body += "<p>Téléphone : +221 78 382 75 75</p>"
    body += "<p>Email : contact@groupeyamaplus.com</p>"
    body += "<p>WhatsApp : +221 78 382 75 75</p>"
    body += "<p>Horaires : Lundi - Samedi, 9h - 19h</p>"

    schema = make_schema({
        "@context": "https://schema.org", "@type": "LocalBusiness",
        "name": SITE_NAME, "telephone": "+221783827575",
        "email": "contact@groupeyamaplus.com",
        "address": {"@type": "PostalAddress", "streetAddress": "Fass Paillote", "addressLocality": "Dakar", "addressCountry": "SN"},
        "openingHours": "Mo-Sa 09:00-19:00",
        "geo": {"@type": "GeoCoordinates", "latitude": "14.6928", "longitude": "-17.4467"}
    })

    return HTMLResponse(html_template("Contactez-nous", desc, "/contact", DEFAULT_IMAGE, body_content=body, schema_json=schema))


@router.get("/aide")
async def prerender_faq():
    desc = "FAQ GROUPE YAMA+ - Paiement Wave/Orange Money, livraison Dakar et régions, retours et garantie. Toutes les réponses à vos questions."
    body = "<h2>Questions Fréquentes</h2>"
    body += "<h3>Paiement</h3><p>Nous acceptons Wave, Orange Money, cartes bancaires et paiement à la livraison.</p>"
    body += "<h3>Livraison</h3><p>Dakar : 24-48h (2 500 FCFA). Régions : 3-5 jours (3 500 FCFA). Gratuite dès 50 000 FCFA.</p>"
    body += "<h3>Retours</h3><p>7 jours pour retourner un produit non utilisé dans son emballage d'origine.</p>"
    return HTMLResponse(html_template("FAQ - Questions Fréquentes", desc, "/aide", DEFAULT_IMAGE, body_content=body))


@router.get("/coffret-cadeau")
async def prerender_gift_box():
    desc = "Coffrets cadeaux personnalisés au Sénégal. Composez votre coffret parfait. Idéal pour Ramadan, Noël, anniversaires. Livraison Dakar."
    body = "<h2>Coffrets Cadeaux Personnalisés</h2>"
    body += "<p>Composez le coffret parfait en sélectionnant vos articles préférés. Ramadan, Noël, Tabaski, Saint-Valentin ou anniversaires.</p>"
    return HTMLResponse(html_template("Coffrets Cadeaux Personnalisés", desc, "/coffret-cadeau", DEFAULT_IMAGE, body_content=body))

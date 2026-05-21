# GROUPE YAMA+ - E-commerce Platform PRD

## Original Problem Statement
Full-stack e-commerce platform for GROUPE YAMA+ in Senegal with premium categories, admin panel, marketing games, email notifications, WhatsApp AI Chatbot, tracking (FB Pixel, GA4), SEO optimization, Real Estate module, ad campaign guides, and reseller/affiliate program.

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **Integrations**: Google OAuth, PayTech, MailerSend, Gemini Vision, Facebook Pixel, GA4

## Recent Changes (May 21, 2026)

### ✅ COMPLETED - Fix Overlapping Floating Buttons
- **Issue**: LiveChat "Message" button was overlapping with WhatsApp button
- **Solution**: Removed LiveChat component from App.js as per user request
- **Deployed**: To VPS production (groupeyamaplus.com)
- **Files modified**: `/app/frontend/src/App.js`

### ✅ COMPLETED - Admin Products Organization by Category Tabs
- **Feature**: Added category filter tabs in Admin Products page
- **Tabs**: Tous, Électronique, Électroménager, Décoration, Mode & Beauté, Automobile, Immobilier, Services
- **Files modified**: `/app/frontend/src/pages/AdminPage.js`
- **Deployed**: To VPS production

### ✅ COMPLETED - Server.py Refactoring (Phase 1)
- **Total modules created**: 21 files in `/app/backend/routes/`
- **Total lines extracted**: ~6,000 lines
- **New modules created** (ready for integration):
  - `products.py` - Products CRUD, Flash Sales, Reviews (~466 lines)
  - `cart.py` - Shopping Cart operations (~180 lines)
  - `orders.py` - Order creation and tracking (~280 lines)
  - `wishlist.py` - Wishlist operations (~118 lines)
  - `resellers.py` - Reseller portal (~211 lines)
  - `loyalty.py` - Loyalty program (~165 lines)
  - `game.py` - Spin wheel / Chrono game (~240 lines)
  - `appointments.py` - Appointment booking (~280 lines)
- **Existing active modules**: auth, blog, commercial_routes, currency, gift_box, marketing, platform_reset, push_notifications, real_estate, reservations, seo_prerender, sms_templates
- **Status**: Modules prepared. Integration requires careful testing to avoid regressions.

---

## Changes (March 30, 2026)

### ✅ COMPLETED - Système Revendeur/Affilié
1. **Admin Revendeurs** ✅
   - Création de revendeurs (nom, email, téléphone, taux commission)
   - Génération automatique de code unique et mot de passe temporaire
   - Statistiques globales (total revendeurs, ventes, commissions)
   - Activation/désactivation des revendeurs
   - Versement des commissions (Wave, OM, Free Money, Cash, Banque)

2. **Portail Revendeur** ✅
   - Login sécurisé à `/reseller/login`
   - Dashboard avec statistiques (ventes, commissions, solde)
   - Historique des ventes et des versements
   - Lien de parrainage personnalisé

3. **Système de Tracking Affilié** ✅
   - URL de parrainage: `/r/{code}`
   - Stockage du code en localStorage (30 jours)
   - Intégration checkout: code envoyé avec chaque commande
   - Commission automatique calculée à la création de commande

### API Endpoints - Revendeurs
```
POST   /api/admin/resellers                    - Créer revendeur
GET    /api/admin/resellers                    - Liste revendeurs
GET    /api/admin/resellers/{id}               - Détails revendeur
PUT    /api/admin/resellers/{id}               - Modifier revendeur
POST   /api/admin/resellers/{id}/pay-commission - Verser commission
POST   /api/reseller/login                     - Connexion revendeur
GET    /api/reseller/me                        - Profil revendeur
GET    /api/reseller/dashboard                 - Stats revendeur
GET    /api/reseller/products                  - Produits avec liens affiliés
GET    /api/r/{code}                           - Redirection parrainage
```

## What's Implemented

### Core E-commerce
- Product catalog, cart, checkout (PayTech), order management, auth (JWT + Google OAuth), promo codes, flash sales, newsletter

### Premium Category Pages with Subcategories
- Electronique, Électroménager, Décoration, Mode & Beauté, Automobile (Covoiturage)

### Admin Dashboard
- **Revendeurs**: Gestion du programme d'affiliation
- **Réservations**: Gestion des réservations transport/services
- **Marketing**: Collecte contacts + Campagnes
- **Gestion Commerciale**: Devis, Factures, Proforma, Bons de Livraison, Attestations
- **Réinitialisation**: Reset plateforme avec backup
- + Products, Orders, Immobilier, Automobile, SMS, etc.

## P1 - Backlog Tasks
1. Déploiement VPS du système Revendeurs (rsync to groupeyamaplus.com)
2. WhatsApp Chatbot (attente identifiants Meta API)

## P2 - Future Tasks
1. Refactoring server.py (extract more modules to /routes/)
2. App mobile React Native
3. Portail Client/Partenaire B2B

## Known Issues
- Orange SMS blocked (external - contact Orange Support)
- server.py ~10200 lines - needs refactoring

## Credentials
- Admin: admin@yamaplus.com / Admin123!
- Test Reseller: testrevendeur@example.com / 3p3rLEZ3PLI
- VPS: root@76.13.58.76
- Production: https://groupeyamaplus.com

## Key Files - Reseller System
- /app/backend/server.py - Backend (reseller endpoints lines 9835-10190)
- /app/frontend/src/components/Admin/ResellersAdmin.js - Admin interface
- /app/frontend/src/pages/ResellerPortalPage.js - Reseller login & dashboard
- /app/frontend/src/pages/ReferralRedirectPage.js - URL tracking /r/:code
- /app/frontend/src/pages/CheckoutPage.js - Sends reseller_code with orders
- /app/frontend/src/pages/AdminPage.js - Includes ResellersAdmin tab
- /app/frontend/src/App.js - Routes for /reseller/*, /r/:code, /admin/resellers

## DB Schema - Resellers
```javascript
// resellers collection
{
  reseller_id: "RSL-XXXXXXXX",
  reseller_code: "NAMEXXX",
  name: String,
  email: String,
  phone: String,
  hashed_password: String,
  commission_rate: Number (default 10),
  is_active: Boolean,
  total_sales: Number,
  total_commission: Number,
  pending_commission: Number,
  paid_commission: Number,
  referral_link: String,
  created_at: ISODate,
  created_by: String
}

// orders collection (extended)
{
  ...existing_fields,
  reseller_code: String (optional),
  reseller_id: String (optional),
  reseller_commission_rate: Number,
  reseller_commission: Number
}

// reseller_commissions collection
{
  commission_id: String,
  reseller_id: String,
  type: "earned" | "payment",
  amount: Number,
  order_id: String (for earned),
  payment_method: String (for payment),
  created_at: ISODate
}
```

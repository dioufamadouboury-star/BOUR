# GROUPE YAMA+ - E-commerce Platform PRD

## Original Problem Statement
Full-stack e-commerce platform for GROUPE YAMA+ in Senegal with premium categories, admin panel, marketing games, email notifications, WhatsApp AI Chatbot, tracking (FB Pixel, GA4), SEO optimization, Real Estate module, ad campaign guides, and reseller/affiliate program.

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **Integrations**: Google OAuth, PayDunya (Payments), Resend (Email), Gemini Vision, Facebook Pixel, GA4

---

## Session Changes (August 18, 2026) - Latest

### ✅ Bug Fixes & Improvements

#### Currency Converter API Fix
- **Bug Fixed**: API `/api/currency/rates` was returning 404
- **Cause**: Double prefix in `routes/currency.py` - changed from `/api/currency` to `/currency`
- **Result**: Currency selector now works correctly (XOF, EUR, USD)
- **Testing**: 100% pass rate (9/9 backend tests, 4/4 frontend tests)

#### Appointment Button Restriction
- **Change**: "Prendre rendez-vous" button now only appears for Automobile and Immobilier categories
- **File Modified**: `/app/frontend/src/pages/ProductPage.js`
- **Previous**: Showed for automobile, mobilier, electromenager, meubles, immobilier, decoration
- **Now**: Only shows for `automobile`, `automobiles`, `immobilier`

#### Image Fallback Improvements
- **Issue**: Broken product images showing "?" on production VPS
- **Fix**: Improved fallback mechanism with inline SVG placeholder that always works
- **Files Modified**: 
  - `/app/frontend/src/lib/utils.js` - Enhanced PLACEHOLDER_IMAGE
  - `/app/frontend/src/components/ProductCard.js` - Use centralized placeholder
  - `/app/frontend/src/components/FlashSalesSection.js` - Use centralized placeholder
  - `/app/frontend/src/pages/HomePage.js` - Added onError fallback
- **Root Cause**: The image URLs in the production database are invalid or pointing to missing resources
- **User Action Required**: Update product images in Admin panel or use a script to fix invalid URLs

#### PayDunya Card Payment (Known Issue)
- **Status**: Card payment UI not displaying on PayDunya checkout page
- **Investigation**: Backend API returns successful checkout URL with `channels=["card"]`
- **Root Cause**: Likely merchant configuration issue on PayDunya dashboard
- **User Action Required**: Verify "Carte Bancaire" is enabled in PayDunya merchant settings

---

## Session Changes (August 17, 2026)

### ✅ PHASE 1 - COMPLETED

#### PayDunya Payment Integration
- **Replaced PayTech** with PayDunya for better support in Senegal
- **Payment Methods**: Wave, Orange Money, Carte Bancaire, Free Money, Expresso, Djamo
- **API Endpoints**:
  - `POST /api/payments/paydunya/initiate`
  - `POST /api/payments/paydunya/callback` (IPN webhook)
  - `GET /api/payments/paydunya/verify/{order_id}`
  - `GET /api/payments/paydunya/methods`
- **Files**: `/app/backend/routes/paydunya.py`

#### Secure Order Status Management
- `paid` - Online payment confirmed
- `cod_pending` - Cash on delivery (order confirmed)
- `pending` / `awaiting_payment` - Awaiting online payment
- `failed` - Payment failed
- `cancelled` - Order cancelled

#### Manager Notifications
- **Email**: ndeyeaminatadiouf3101@gmail.com
- **WhatsApp**: +221 78 598 75 18
- All orders notify manager with full details
- Failed payments also tracked for follow-up

#### Dashboard Statistics Fix
- Revenue only counts confirmed payments
- Fake growth percentages removed
- `GET /api/admin/failed-payments` for commercial follow-up

#### Resend Email Configuration
- Domain verified: `groupeyamaplus.com`
- From: `noreply@groupeyamaplus.com`

### ✅ PHASE 2 - COMPLETED

#### Product Variants (Admin + Frontend)
- Admin UI for phone variants (Capacity, Color, Price, Stock)
- Frontend ProductPage updated to show variant selectors
- Price updates dynamically when capacity/color selected
- Stock shown per variant

#### Floating Buttons Optimized
- Reduced size on mobile (w-12 h-12)
- Better positioning to not cover products
- WhatsApp at bottom, Gift above
- Less intrusive pulse animation

#### Homepage Reorganization
- "Produits à la une" - Featured/Promo products carousel
- "Nouveautés" - Recently added products grid
- Sections now distinct and not duplicated

---

## PENDING TASKS (User Priority Order)

### ✅ COMPLETED & DEPLOYED - Product Position Control Feature
- **Issue Fixed**: Admin Dashboard product limit bug (limit increased to 500)
- **New Feature**: Position control for product display ordering
  - Position column added to Admin products table
  - **Drag & Drop** with @dnd-kit for intuitive reordering
  - **Monter/Descendre (↑↓) buttons** for quick reordering
  - Editable position inputs with visual feedback (green border when modified)
  - "Enregistrer positions" button for batch saving
  - Products sorted by position (lower number = higher priority, default 999)
- **API Endpoints**:
  - `PUT /api/admin/products/positions` - Batch update positions
  - `PUT /api/admin/products/{id}/position` - Single product position update
- **Files Modified**:
  - `/app/backend/server.py` (lines 1590-1625)
  - `/app/frontend/src/pages/AdminPage.js`
- **Testing**: 100% pass rate (10/10 backend, 6/6 frontend)
- **VPS Deployment**: ✅ DEPLOYED to groupeyamaplus.com

### ✅ Google OAuth Credentials Updated
- Client ID: 763267425480-15uf3c8paehi566h6nuoieq2gjuh05ks.apps.googleusercontent.com
- **IMPORTANT**: User must configure authorized redirect URIs in Google Cloud Console:
  - `https://groupeyamaplus.com/login`
  - `https://groupeyamaplus.com/auth/callback`

---

## Changes (May 21, 2026)

### ✅ DEPLOYED TO PRODUCTION - Complete Verification & Bug Fixes
- All APIs integrated and working: /api/sourcing/*, /api/b2b/*
- Backend server.py updated with sourcing and B2B endpoints
- Frontend deployed with all new pages and components
- VPS production (groupeyamaplus.com) fully updated

### ✅ NEW - B2B Portal (/b2b)
- Partner registration and login system
- Wholesale pricing tiers (0%, -5%, -10%, -15%, -20% based on quantity)
- Quote request system
- Partner dashboard with orders and stats
- Admin management panel for partners and quotes
- Files: `/app/backend/routes/b2b_portal.py`, `/app/frontend/src/pages/B2BPortalPage.js`

### ✅ NEW - International Sourcing (/sourcing, /import-chine)
- China to Senegal shipping service
- Shipping rates:
  - Air General: 8000-6600 FCFA/KG (8-12 days)
  - Air Sensitive: 8000-6800 FCFA/KG (12-16 days) + 300 FCFA/phone
  - Maritime: by CBM (30-45 days)
- Shipping calculator with volumetric weight (1 CBM = 167 KG)
- Order request form with product link
- Tracking system with status steps
- Admin management panel for quotes and orders
- Files: `/app/backend/routes/sourcing.py`, `/app/frontend/src/pages/SourcingPage.js`, `/app/frontend/src/components/Admin/SourcingAdmin.js`

### ✅ CONFIGURATION COMPLETE
- Footer links added: "Espace Revendeurs", "Espace B2B Pro", "Import Chine 🇨🇳"
- Navbar secondary items: "Import Chine", "B2B Pro"
- Admin sidebar: "Partenaires B2B", "Import Chine"
- All deployed to VPS production

### ✅ COMPLETED - Server.py Refactoring (Full)
- **Total modules created**: 24 files in `/app/backend/routes/`
- **Total lines extracted**: ~6,700 lines
- **Module categories**:
  - **Core E-commerce**: products, cart, orders, promo_codes
  - **User Features**: wishlist, loyalty, newsletter
  - **Business Features**: resellers, appointments, game
  - **Admin**: admin (analytics, orders, users, exports)
  - **Active/Integrated**: auth, blog, commercial_routes, currency, gift_box, marketing, platform_reset, push_notifications, real_estate, reservations, seo_prerender, sms_templates
- **Status**: Complete modular architecture. Ready for progressive integration.

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
1. PayDunya Carte Bancaire - User needs to verify merchant settings
2. SEO Dynamic Sitemap - Generate sitemap.xml from products database
3. Add Automobile/Immobilier test products to verify appointment button

## P2 - Future Tasks
1. Refactoring server.py (extract more modules to /routes/)
2. WhatsApp Chatbot (attente identifiants Meta API)
3. App mobile React Native
4. Portail Client/Partenaire B2B

## Known Issues
- PayDunya Card Payment UI not showing (merchant config issue)
- Orange SMS may be blocked (external - contact Orange Support)
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

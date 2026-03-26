# GROUPE YAMA+ - E-commerce Platform PRD

## Original Problem Statement
Full-stack e-commerce platform for GROUPE YAMA+ in Senegal with premium categories, admin panel, marketing games, email notifications, WhatsApp AI Chatbot, tracking (FB Pixel, GA4), SEO optimization, Real Estate module, and ad campaign guides.

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **Integrations**: Google OAuth, PayTech, MailerSend, Gemini Vision, Facebook Pixel, GA4

## Recent Changes (March 26, 2026)

### ✅ COMPLETED - All P0 + P1 + P2 + P3 Tasks
1. **Système de Réservation** ✅
2. **Centre SMS Avancé** ✅
3. **Collecte & Campagnes Marketing** ✅
4. **Réinitialisation Plateforme** ✅
5. **Module Prestataires (Refonte)** ✅
6. **Guide Campagnes Publicitaires** ✅
7. **Refactoring Backend** ✅
8. **Gestion Commerciale Améliorée** ✅
   - Nouveau logo YAMA+ sur tous les documents PDF
   - Factures Proforma avec conversion en facture définitive
   - Bons de Livraison avec gestion des articles
   - Attestations (Travail, Stage, Partenariat, Paiement, Collaboration)
   - Tous les PDFs générés incluent maintenant le logo

## What's Implemented

### Core E-commerce
- Product catalog, cart, checkout (PayTech), order management, auth (JWT + Google OAuth), promo codes, flash sales, newsletter

### Premium Category Pages with Subcategories
- Electronique, Électroménager, Décoration, Mode & Beauté, Automobile (Covoiturage)

### Admin Dashboard - NEW SECTIONS
- **Réservations**: Gestion des réservations transport/services
- **Marketing**: Collecte contacts + Campagnes
- **Réinitialisation**: Reset plateforme avec backup
- + All existing: Products, Orders, Immobilier, Automobile, SMS, etc.

### API Endpoints - NEW
```
POST   /api/reservations                    - Créer réservation
GET    /api/admin/reservations              - Liste admin
PUT    /api/admin/reservations/{id}/confirm - Confirmer
PUT    /api/admin/reservations/{id}/reject  - Refuser
GET    /api/admin/marketing/contacts        - Contacts collectés
POST   /api/admin/marketing/campaign        - Envoyer campagne
GET    /api/admin/sms/templates             - Templates SMS
POST   /api/admin/sms/templates             - Créer template
DELETE /api/admin/sms/templates/{id}        - Supprimer template
POST   /api/admin/platform/reset            - Réinitialiser
GET    /api/admin/platform/backups          - Liste backups
POST   /api/admin/platform/restore/{id}     - Restaurer backup
```

## P1 - Backlog Tasks
1. Module Services / Prestataires (Refonte) - Profils professionnels, validation documents
2. Guide campagnes publicitaires (Facebook/Google/YouTube Ads)
3. WhatsApp Chatbot (attente identifiants Meta API)

## P2 - Future Tasks
1. Refactoring server.py (extract more modules)
2. App mobile React Native

## Known Issues
- Orange SMS blocked (external - contact Orange Support)
- server.py ~9700 lines - needs refactoring

## Credentials
- Admin: admin@yamaplus.com / Admin123!
- VPS: root@76.13.58.76
- Production: https://groupeyamaplus.com

## Key Files
- /app/backend/server.py - Main backend (includes new reservation/marketing endpoints)
- /app/frontend/src/components/Admin/ReservationsAdmin.js - NEW
- /app/frontend/src/components/Admin/MarketingAdmin.js - NEW
- /app/frontend/src/components/Admin/PlatformResetAdmin.js - NEW
- /app/frontend/src/pages/CategoryPage.js - Updated with reservation modal for trips

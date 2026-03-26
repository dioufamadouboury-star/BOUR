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
- **Admin Immobilier Multi-Photos**: Upload jusqu'à 6 images avec prévisualisation et suppression
- **Sous-catégories complètes**: Filtres détaillés sur toutes les pages catégories (Électronique, Électroménager, Décoration, Mode, Automobile)
- **Mobile Responsive**: Corrections UI mobile pour catégories et logo login
- **Tests E2E**: 22 tests frontend + 16 tests backend passés (100%)
- **VPS Déployé**: groupeyamaplus.com mis à jour avec les dernières fonctionnalités

## What's Implemented

### Core E-commerce
- Product catalog, cart, checkout (PayTech), order management, auth (JWT + Google OAuth), promo codes, flash sales, newsletter

### Premium Category Pages with Subcategories
- Electronique: Smartphones, TV & Écrans, Ordinateurs, Tablettes, Audio, Gaming, Accessoires, Montres
- Électroménager: Climatiseur, Réfrigérateur, Congélateur, Chauffage, Micro-ondes, Ventilateur, Machine à laver, Four, Cuisinière
- Décoration: Salons, Chambres, Literie, Table à manger, Lustre, Tableau, Bureau, Tapis
- Mode & Beauté: Vêtements Femme/Homme, Chaussures, Parfums, Cosmétiques, Bijoux, Sacs
- Automobile: Vente voiture, Location, Covoiturage

### Admin Dashboard
- Full CRUD for products, orders, promo codes, flash sales, automobile, analytics, immobilier
- Real Estate with multi-image upload (6 max), preview, deletion
- SMS workflows, Covoiturage management, Commercial Management (Devis, Factures, Contrats)

### Marketing
- Wheel of Fortune, Newsletter popup, WhatsApp integration

### Tracking & SEO
- Facebook Pixel (3225886221025264), GA4 (G-MWD2FB6LEL)
- Schema.org JSON-LD, OG/Twitter meta, dynamic prerendering for bots, sitemap, robots.txt

### Real Estate Module - DEPLOYED
- Property listings (/immobilier), detail page, admin CRUD
- Multi-image upload (up to 6 photos) with preview and deletion
- 25+ amenities options (WiFi, Piscine, Parking, etc.)
- Video URL, Google Maps integration

### Appointment/Visit System - DEPLOYED
- Types: immobilier, automobile, general
- Customer side: "Demander une visite" button
- Admin side: Filter by type, date/time confirmation, WhatsApp integration
- Auto-reminder emails

## P0 - In Progress Tasks
1. **Système de Réservation** (Transport & Services) - Bouton "Réserver maintenant", validation Admin, Email/SMS auto
2. **Module Services / Prestataires (Refonte)** - Profils professionnels, validation documents, assignation Admin

## P1 - Upcoming Tasks
1. **Centre SMS Avancé** - Templates dynamiques avec variables {{nom}}, {{date}}, {{montant}}
2. **Collecte & Campagnes Marketing** - Auto-collect emails/phones, campaigns dashboard

## P2 - Future Tasks
1. **Réinitialisation Complète** - Admin function to reset platform with backup
2. Guide campagnes publicitaires (Facebook/Google/YouTube Ads)
3. Refactoring server.py (extract more modules)
4. WhatsApp Chatbot (attente identifiants Meta API)

## Known Issues
- Orange SMS blocked (external - contact Orange Support)
- server.py ~9300 lines - needs refactoring
- Browser caching (Ctrl+Shift+R pour forcer)

## Credentials
- Admin: admin@yamaplus.com / Admin123!
- VPS: root@76.13.58.76
- Production: https://groupeyamaplus.com

## Key Files
- /app/backend/server.py - Main backend
- /app/backend/routes/real_estate.py - Real Estate APIs
- /app/backend/commercial_management.py - Commercial endpoints
- /app/frontend/src/components/Admin/ImmobilierAdmin.js - Real Estate Admin with multi-image
- /app/frontend/src/pages/CategoryPage.js - Categories with subcategory filters
- /app/frontend/src/pages/LoginPage.js - Login page (mobile responsive)

## Test Reports
- /app/test_reports/iteration_9.json - Latest test results (100% pass rate)
- Backend: 16/16 tests passed
- Frontend: 22/22 tests passed

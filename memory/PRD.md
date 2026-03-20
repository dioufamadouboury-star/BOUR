# GROUPE YAMA+ - E-commerce Platform PRD

## Original Problem Statement
Full-stack e-commerce platform for GROUPE YAMA+ in Senegal with premium categories, admin panel, marketing games, email notifications, WhatsApp AI Chatbot, tracking (FB Pixel, GA4), SEO optimization, Real Estate module, and ad campaign guides.

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **Integrations**: Google OAuth, PayTech, MailerSend, Gemini Vision, Facebook Pixel, GA4

## What's Implemented

### Core E-commerce
- Product catalog, cart, checkout (PayTech), order management, auth (JWT + Google OAuth), promo codes, flash sales, newsletter

### Premium Category Pages
- Electronique, Mobilier, Decoration, BeauteMode, Electromenager, Automobile

### Admin Dashboard
- Full CRUD for products, orders, promo codes, flash sales, automobile, analytics, immobilier

### Marketing
- Wheel of Fortune, Newsletter popup, WhatsApp integration

### Tracking & SEO
- Facebook Pixel (3225886221025264), GA4 (G-MWD2FB6LEL)
- Schema.org JSON-LD, OG/Twitter meta, dynamic prerendering for bots, sitemap, robots.txt

### Real Estate Module (Mar 20, 2026) - DEPLOYED
- Property listings (/immobilier), detail page, admin CRUD
- 3 test properties seeded
- Category card in Navbar dropdown with living room image + "Location et vente"
- Hero background image (living room interior) on ImmobilierPage

### Appointment/Visit System (Mar 20, 2026) - DEPLOYED
- **Types**: immobilier, automobile, general
- **Customer side**: "Demander une visite" button on PropertyDetailPage (green theme), AppointmentModal with type-specific styling
- **Admin side**: Filter by type (Tous/Immobilier/Automobile/Général), type badges, confirmation modal with:
  - Date/heure confirmée (pré-remplie)
  - Adresse du rendez-vous (meeting_address) - FIXED
  - Contact sur place (meeting_contact) - FIXED
  - Envoi WhatsApp (checkbox)
- **Emails**: Notification admin, confirmation client, email de confirmation avec adresse
- **Rappel automatique**: Background task (toutes les heures) envoie un email rappel le jour du RDV
- **Trigger manuel**: POST /api/admin/appointments/send-reminders
- **Product page**: appointmentType="automobile" quand category=automobile

### Pages Redesign - Dark Theme (Mar 20, 2026) - DEPLOYED
- **Nouveautés** (/nouveautes): Thème sombre, image fond magasin tech, "Fraîchement Arrivés" en jaune, onglets 7 catégories, showcase services YAMA+
- **Promotions** (/promotions): Thème sombre, "Promotions Exceptionnelles" en rouge/orange, icônes promo (-50%, Ventes flash, Offres spéciales), onglets catégories
- **Blog** (/blog): Thème sombre, "Guides & Conseils" en jaune, barre de recherche, onglets blog, articles avec images, section services YAMA+
- Toutes les pages montrent les 6 catégories du site (Électronique, Électroménager, Décoration, Mode & Beauté, Automobile, Immobilier)
- Extracted: gift_box.py, blog.py, real_estate.py to /backend/routes/
- server.py ~9000 lines (needs more extraction)

## P1 - Pending Tasks
1. Guide étape par étape campagnes publicitaires (Facebook/Google/YouTube Ads) - demandé par l'utilisateur
2. Continuer refactoring server.py (extract products, orders, auth)
3. Ajouter produits au catalogue

## P2 - Future Tasks
1. WhatsApp Chatbot (attente identifiants Meta API)
2. App mobile React Native (reportée)

## Known Issues
- Orange SMS blocked (external - contact Orange Support)
- server.py ~9000 lines - needs refactoring
- Browser caching (Ctrl+Shift+R pour forcer)

## Credentials
- Admin: admin@yamaplus.com / Admin123!
- VPS: root@76.13.58.76
- Production: https://groupeyamaplus.com

## Key Files
- /app/backend/server.py - Main backend
- /app/backend/routes/real_estate.py - Real Estate APIs
- /app/frontend/src/components/AppointmentModal.js - Visit/appointment modal
- /app/frontend/src/pages/PropertyDetailPage.js - Property detail + visit button
- /app/frontend/src/pages/AdminPage.js - Admin dashboard
- /app/frontend/src/pages/ProductPage.js - Product page with automobile appointments

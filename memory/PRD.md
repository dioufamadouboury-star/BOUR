# GROUPE YAMA+ - E-commerce Platform PRD

## Original Problem Statement
Full-stack e-commerce platform for GROUPE YAMA+ in Senegal with:
- Premium category pages with sub-categories
- Admin panel for automobile features (appointments, rentals, carpooling)
- Temu-style "Wheel of Fortune" marketing game
- Email notification system for orders
- WhatsApp AI Chatbot with human handoff
- Facebook Pixel tracking & SEO optimization
- Social media share buttons on product pages
- Real Estate module (Immobilier)
- Google Analytics 4 integration
- Ad campaigns guides (Facebook, Google, YouTube)

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **Integrations**: Google OAuth, PayTech, MailerSend, Gemini Vision, Facebook Pixel, GA4

## What's Implemented

### Core E-commerce
- Product catalog with categories and subcategories
- Shopping cart and checkout with PayTech
- Order management and tracking
- User authentication (JWT + Google OAuth)
- Promo codes system
- Flash sales system
- Newsletter subscriptions

### Premium Category Pages
- ElectroniquePage, MobilierPage, DecorationPage
- BeauteModePage, ElectromenagerPage
- AutomobilePage (reference design)
- All with dark theme, tabs, custom backgrounds

### Admin Dashboard
- Products CRUD with subcategory support
- Orders management with status updates
- Promo codes management
- Flash sales management
- Automobile section (appointments, rentals, carpooling)
- Analytics dashboard
- Immobilier admin section

### Marketing Features
- Wheel of Fortune (Temu-style) - black/gold/blue colors, 30s delay
- Newsletter popup
- WhatsApp integration

### Facebook Pixel Integration (Mar 20, 2026)
- Pixel ID: 3225886221025264
- Events: PageView, ViewContent, AddToCart, RemoveFromCart, AddToWishlist, InitiateCheckout, Purchase, Search, CompleteRegistration, Lead, Contact, Login

### Google Analytics 4 (Mar 20, 2026)
- Measurement ID: G-MWD2FB6LEL
- Client-side & server-side tracking

### SEO Enhancements (Mar 20, 2026)
- Schema.org JSON-LD structured data
- Open Graph & Twitter Card meta tags
- Dynamic prerendering for search engine bots (Googlebot, Bingbot, etc.)
- Sitemap XML with 20+ URLs including /immobilier
- robots.txt optimized

### Real Estate Module (Mar 20, 2026) - DEPLOYED TO PRODUCTION
- Property listings page (/immobilier) with filters (listing type, property type, city, price, bedrooms)
- Property detail page (/immobilier/:propertyId) with gallery, specs, contact (WhatsApp/phone)
- Admin dashboard for property CRUD (create, edit, delete, toggle featured/availability)
- Backend API: GET /api/properties, GET /api/properties/:id, POST/PUT/DELETE /api/admin/properties
- SEO: Added to sitemap, Nginx prerender for bots
- 3 test properties seeded (studio Saly, villa Almadies, appartement Plateau)

### Refactoring Progress
- Extracted Gift Box routes to `/app/backend/routes/gift_box.py`
- Extracted Blog routes to `/app/backend/routes/blog.py`
- Extracted Real Estate routes to `/app/backend/routes/real_estate.py`
- server.py reduced from ~10,000 to ~9,000 lines

## P0 - Completed
- Google Analytics 4 configured
- Facebook Pixel configured
- Real Estate Module deployed to production

## P1 - Pending Tasks
1. Provide step-by-step guide for Facebook/Google/YouTube ad campaigns (user explicitly requested)
2. Continue refactoring server.py (extract products, orders, auth modules)
3. Add more products to the catalog

## P2 - Future Tasks
1. Configure WhatsApp Chatbot (pending Meta API credentials)
2. Mobile App (React Native/Expo - postponed)
3. Fix car appointment details persistence (meeting_address, meeting_contact)

## Known Issues
- Browser caching causes users to not see updates (use Ctrl+Shift+R)
- server.py is extremely large (~9000 lines) - needs more refactoring
- Orange SMS delivery issue (external - Orange Support needed, BLOCKED)

## Credentials
- Admin: admin@yamaplus.com / Admin123!
- VPS: root@76.13.58.76
- Production URL: https://groupeyamaplus.com

## Key Files
- `/app/backend/routes/real_estate.py` - Real Estate APIs
- `/app/frontend/src/pages/ImmobilierPage.js` - Property listings
- `/app/frontend/src/pages/PropertyDetailPage.js` - Property detail
- `/app/frontend/src/components/Admin/ImmobilierAdmin.js` - Admin panel
- `/app/backend/routes/seo_prerender.py` - SEO bot prerendering
- `/app/backend/server.py` - Main backend (~9000 lines)

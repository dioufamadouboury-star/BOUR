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

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **Integrations**: Google OAuth, PayTech, MailerSend, Gemini Vision, Facebook Pixel

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

### Marketing Features
- Wheel of Fortune (Temu-style) - black/gold/blue colors, 30s delay
- Newsletter popup
- WhatsApp integration

### Automobile Module
- Car visit appointments booking
- Car rentals listing
- Carpooling trips with vehicle details and recurrence
- Admin management for all above

### Facebook Pixel Integration (Mar 20, 2026)
- Pixel ID: 3225886221025264
- Events configured:
  - PageView (automatic on every page)
  - ViewContent (product page visit)
  - AddToCart (add item to cart)
  - RemoveFromCart (remove item from cart)
  - AddToWishlist (add to favorites)
  - InitiateCheckout (begin order process)
  - Purchase (order completed)
  - Search (product search)
  - CompleteRegistration (new account)
  - Lead (newsletter signup)
  - Contact (WhatsApp click)
  - Login (email + Google)

### Social Share Buttons (Mar 20, 2026)
- ShareButtons component on product pages
- Facebook, Twitter/X, WhatsApp, Copy Link
- Dropdown UI with animations

### SEO Enhancements (Mar 20, 2026)
- Schema.org JSON-LD structured data (Organization + WebSite)
- Open Graph meta tags
- Twitter Card meta tags
- Geo tags for local SEO
- Canonical URLs

## Configuration Required

### Google Analytics 4
- Waiting for Measurement ID (format G-XXXXXXXXXX)
- Placeholder code is in index.html
- analytics.js has all GA4 event tracking ready

### WhatsApp Business API Setup
1. Create Meta App at developers.facebook.com
2. Enable WhatsApp product
3. Configure webhook URL and verify token
4. Add credentials to backend .env

## P0 - Pending
- ~~Google Analytics~~ - Configuré avec G-MWD2FB6LEL ✅
- ~~Facebook Pixel~~ - Configuré avec 3225886221025264 ✅

## Refactoring Progress (Mar 20, 2026)
- Extracted Gift Box routes to `/app/backend/routes/gift_box.py` (~435 lines)
- Extracted Blog routes to `/app/backend/routes/blog.py` (~191 lines)
- Created shared modules: `database.py`, `auth_deps.py`
- server.py reduced from ~10,000 to ~9,000 lines
- All tests pass after refactoring

## P1 - Next Tasks
1. Verify Wheel of Fortune design (user verification pending)
2. System de promotions/réductions - confirmer si ventes flash suffisent
3. Configure WhatsApp Chatbot (pending Meta API credentials)

## P2 - Future Tasks
1. Recreate Orange SMS module
2. Recreate WhatsApp chatbot module
3. Real Estate Module
4. Refactor server.py (~10000 lines) into modular routers
5. Mobile App (React Native/Expo - postponed)
6. SSH key authentication setup

## Key Files
- `/app/frontend/public/index.html` - FB Pixel + SEO Schema
- `/app/frontend/src/lib/analytics.js` - Analytics event tracking module
- `/app/frontend/src/components/ShareButtons.js` - Social share buttons
- `/app/frontend/src/pages/ProductPage.js` - Product page with share integration
- `/app/frontend/src/contexts/CartContext.js` - Cart with analytics tracking
- `/app/frontend/src/contexts/AuthContext.js` - Auth with analytics tracking
- `/app/frontend/src/contexts/WishlistContext.js` - Wishlist with analytics tracking
- `/app/frontend/src/pages/CheckoutPage.js` - Checkout with analytics tracking
- `/app/frontend/src/pages/SearchPage.js` - Search with analytics tracking
- `/app/frontend/src/components/NewsletterPopup.js` - Newsletter with analytics tracking
- `/app/frontend/src/components/WhatsAppButton.js` - WhatsApp with contact tracking
- `/app/backend/server.py` - Main backend (~10000 lines)

## Credentials
- Admin: admin@yamaplus.com / Admin123!
- VPS: root@76.13.58.76

## Known Issues
- Browser caching causes users to not see updates (use Ctrl+Shift+R)
- server.py is extremely large (~10000 lines) - needs refactoring
- Orange SMS delivery issue (external - Orange Support needed)
- Google Analytics placeholder - waiting for Measurement ID

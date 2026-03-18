# GROUPE YAMA+ - E-commerce Platform PRD

## Original Problem Statement
Full-stack e-commerce platform for GROUPE YAMA+ in Senegal with:
- Premium category pages with sub-categories
- Admin panel for automobile features (appointments, rentals, carpooling)
- Temu-style "Wheel of Fortune" marketing game
- Email notification system for orders

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **Integrations**: Google OAuth, PayTech, MailerSend, Gemini Vision

## What's Implemented (as of Mar 2026)

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

### Marketing Features
- Wheel of Fortune (Temu-style) - captures email, 30s delay
- Newsletter popup
- WhatsApp integration

### Automobile Module
- Car visit appointments booking
- Car rentals listing
- Carpooling trips with vehicle details and recurrence
- Admin management for all above

## Recent Changes (Mar 18, 2026)
1. Updated Wheel of Fortune colors to site branding (black/gold/blue)
2. Reduced wheel size and set 30s display delay
3. Fixed missing psutil module on backend
4. Backend health check working

## P0 - Pending User Verification
1. Wheel of Fortune - verify new design (Ctrl+Shift+R to refresh)
2. Email notifications - test order status update emails

## P1 - Next Tasks
1. Verify meeting_address/meeting_contact persistence for car appointments
2. Enhance promotion system for product-level discounts

## P2 - Future Tasks
1. Real Estate Module (short/long term rentals)
2. Refactor server.py into modular routers
3. SSH key authentication setup

## Key Files
- `/var/www/yamaplus/frontend/src/components/WheelOfFortune.js`
- `/var/www/yamaplus/frontend/src/components/AutomobileAdminSection.js`
- `/var/www/yamaplus/frontend/src/pages/AdminPage.js`
- `/var/www/yamaplus/backend/server.py`

## Credentials
- Admin: admin@yamaplus.com / Admin123!
- VPS: root@76.13.58.76

## Known Issues
- Browser caching causes users to not see updates (use Ctrl+Shift+R)
- server.py is extremely large (~9400 lines) - needs refactoring

# GROUPE YAMA+ - E-commerce Platform PRD

## Original Problem Statement
Full-stack e-commerce platform for GROUPE YAMA+ in Senegal with:
- Premium category pages with sub-categories
- Admin panel for automobile features (appointments, rentals, carpooling)
- Temu-style "Wheel of Fortune" marketing game
- Email notification system for orders
- **WhatsApp AI Chatbot with human handoff**

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **AI**: Emergent LLM Key (GPT-4o) for WhatsApp chatbot
- **Integrations**: Google OAuth, PayTech, MailerSend, Gemini Vision, Meta WhatsApp Business API

## What's Implemented (as of Mar 18, 2026)

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
- **NEW: WhatsApp Bot management section**

### Marketing Features
- Wheel of Fortune (Temu-style) - black/gold/blue colors, 30s delay
- Newsletter popup
- WhatsApp integration

### Automobile Module
- Car visit appointments booking
- Car rentals listing
- Carpooling trips with vehicle details and recurrence
- Admin management for all above

### WhatsApp AI Chatbot (NEW - Mar 18, 2026)
- AI-powered responses using GPT-4o via Emergent LLM
- Product search and pricing information
- Order assistance
- Human handoff when customer requests
- Admin interface to manage conversations
- Real-time message display
- Transfer back to bot after human assistance

## Configuration Required

### WhatsApp Business API Setup
1. Create Meta App at developers.facebook.com
2. Enable WhatsApp product
3. Configure webhook:
   - URL: https://groupeyamaplus.com/api/whatsapp/webhook
   - Verify Token: yamaplus_webhook_verify_2024
4. Add credentials to /var/www/yamaplus/backend/.env:
   - WHATSAPP_PHONE_NUMBER_ID
   - WHATSAPP_ACCESS_TOKEN

## P0 - Pending User Verification
1. Wheel of Fortune - verify new design (Ctrl+Shift+R to refresh)
2. Email notifications - test order status update emails
3. **WhatsApp Chatbot - configure Meta API and test**

## P1 - Next Tasks
1. Complete WhatsApp Business API configuration
2. Test chatbot with real WhatsApp messages
3. Verify meeting_address/meeting_contact persistence for car appointments

## P2 - Future Tasks
1. Real Estate Module (short/long term rentals)
2. Refactor server.py into modular routers (now 10400+ lines)
3. SSH key authentication setup
4. Enhanced promotion system with product-level discounts

## Key Files
- `/var/www/yamaplus/backend/whatsapp_chatbot.py` - NEW: WhatsApp chatbot module
- `/var/www/yamaplus/frontend/src/components/WhatsAppAdminSection.js` - NEW: Admin UI
- `/var/www/yamaplus/frontend/src/components/WheelOfFortune.js` - Updated colors
- `/var/www/yamaplus/frontend/src/components/AutomobileAdminSection.js`
- `/var/www/yamaplus/frontend/src/pages/AdminPage.js` - Updated with WhatsApp tab
- `/var/www/yamaplus/backend/server.py` - Added WhatsApp endpoints

## Database Collections (NEW)
- `whatsapp_conversations` - Stores conversation state
- `whatsapp_messages` - Stores message history

## Credentials
- Admin: admin@yamaplus.com / Admin123!
- VPS: root@76.13.58.76

## Known Issues
- Browser caching causes users to not see updates (use Ctrl+Shift+R)
- server.py is extremely large (~10400 lines) - needs refactoring

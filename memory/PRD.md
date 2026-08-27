# GROUPE YAMA+ - E-commerce Platform PRD

## Original Problem Statement
Full-stack e-commerce platform for GROUPE YAMA+ in Senegal with premium categories, admin panel, mobile-first design, email/SMS/WhatsApp notifications, tracking (FB Pixel, GA4), SEO optimization, and various product types (Electronics, Furniture, Automobiles, Real Estate).

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **Integrations**: Google OAuth, PayDunya (Payments), Resend (Email), Orange SMS, WhatsApp Cloud API, Facebook Pixel, GA4

---

## Session Changes (August 27, 2026 - Latest Session)

### ✅ NEW Custom Request System (Fully Tested - 100%)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Vehicle Request Form | ✅ DONE | `/demande-vehicule` - Form for vehicle import requests from China |
| 2 | Custom Sofa Order Form | ✅ DONE | `/salon-sur-commande` - Form for custom furniture orders |
| 3 | Reupholstery Quote Form | ✅ DONE | `/rehoussage` - Form with photo upload for furniture restoration |
| 4 | Admin Dashboard | ✅ DONE | `/admin/custom-requests` - Stats, filters, search, detail view |
| 5 | Vehicle Customs Status | ✅ DONE | Display "sous douane" or "dédouané" on product page |

### API Endpoints Created
- `POST /api/custom-requests/vehicle` - Submit vehicle search request
- `POST /api/custom-requests/sofa` - Submit custom sofa order
- `POST /api/custom-requests/reupholstery` - Submit reupholstery quote
- `GET /api/custom-requests/track/{request_number}` - Public tracking
- `GET /api/custom-requests/admin/list` - Admin list with filters
- `GET /api/custom-requests/admin/stats` - Aggregated statistics
- `GET /api/custom-requests/admin/{request_number}` - Full details
- `PUT /api/custom-requests/admin/{request_number}/status` - Update status/quote
- `POST /api/custom-requests/admin/{request_number}/propose-vehicle` - Add proposed vehicle

---

## New Files Created This Session

```
/app/frontend/src/pages/SofaRequestPage.js           # Custom sofa order form
/app/frontend/src/pages/ReupholsteryPage.js          # Reupholstery quote form
/app/frontend/src/components/Admin/CustomRequestsAdmin.js # Admin dashboard
/app/backend/routes/custom_requests.py                # Backend routes
```

## Files Updated This Session

- `/app/frontend/src/App.js` - Added routes for new pages
- `/app/frontend/src/pages/AdminPage.js` - Added custom-requests menu item
- `/app/frontend/src/pages/ProductPage.js` - Added customs status display
- `/app/frontend/src/components/ProductFormModal.js` - Added customs_status field
- `/app/backend/server.py` - Integrated custom_requests router

---

## Database Schema Updates

### Custom Requests Collection (NEW)
```javascript
{
  request_number: String,      // VEH-XXXXXXXX, SAL-XXXXXXXX, REH-XXXXXXXX
  request_type: String,        // "vehicle" | "sofa" | "reupholstery"
  status: String,              // pending, searching, found, quoted, accepted, etc.
  created_at: String,
  updated_at: String,
  full_name: String,
  phone: String,
  whatsapp: String,
  address: String,
  city: String,
  comments: String,
  admin_notes: String,
  quote_sent: Boolean,
  quote_amount: Number,
  
  // Vehicle-specific
  brand: String,
  model: String,
  year_min: String,
  year_max: String,
  budget_min: String,
  budget_max: String,
  customs_status: String,      // "sous_douane" | "dedouane"
  proposed_vehicles: Array,
  
  // Sofa-specific
  sofa_type: String,
  width: String,
  depth: String,
  height: String,
  fabric: String,
  color: String,
  reference_images: Array,
  
  // Reupholstery-specific
  furniture_type: String,
  service_type: String,
  piece_count: String,
  photos: Array,
  pickup_needed: Boolean,
  urgency: String
}
```

### Products Collection (Updated)
```javascript
{
  vehicle_specs: {
    // ... existing fields
    customs_status: String    // NEW - "sous_douane" | "dedouane"
  }
}
```

---

## Remaining Tasks (Prioritized)

### P0 - Critical (Deploy)
- [ ] Deploy all changes to production VPS (`rsync` + Nginx reload)

### P1 - High Priority
- [ ] Dashboard Admin "Recherches véhicules" - Send private offers to clients
- [ ] Dashboard Admin "Devis Privé" - Secure links for signature and deposit
- [ ] Configure product specs - Add specs to existing products for animated banner

### P2 - Medium Priority
- [ ] Webhook strict confirmation - Mark orders "Paid" only via PayDunya webhook
- [ ] WhatsApp API credentials - Connect live Meta API (currently manual fallback)

### P3 - Future
- [ ] Refactor `server.py` (>11,000 lines)
- [ ] Backend linting errors (route shadowing cleanup)

---

## Test Results

### Latest Test Report (iteration_21.json)
- **Backend**: 100% (26/26 tests passed)
- **Frontend**: 100% (19/19 tests passed)
- **Regression**: 45 tests passed, 0 failed, 0 skipped

### Test Files Created
- `/app/backend/tests/test_custom_requests.py`
- `/app/tests/e2e/custom-requests.spec.ts`
- `/app/tests/e2e/admin-custom-requests.spec.ts`

---

## Deployment Notes

### VPS Access
- **Host**: groupeyamaplus.com
- **User**: root
- **Service**: yamaplus-backend.service

### Deployment Commands
```bash
# Build frontend
cd /app/frontend && yarn build

# Deploy to VPS
sshpass -p "@Boury778498137" rsync -avz --delete /app/frontend/build/ root@groupeyamaplus.com:/var/www/yamaplus/frontend/build/
sshpass -p "@Boury778498137" rsync -avz /app/backend/ root@groupeyamaplus.com:/var/www/yamaplus/backend/

# Restart services on VPS
ssh root@groupeyamaplus.com "sudo systemctl restart yamaplus-backend && sudo nginx -s reload"
```

---

## Known Issues / Blockers

1. **PayDunya Card Payments** - Visa/Mastercard not activated (requires PayDunya merchant config)
2. **WhatsApp API** - Running in manual fallback mode (needs META_ACCESS_TOKEN)
3. **Google OAuth** - Requires correct callback URI in Google Console

---

## Contact
- **Manager Email**: ndeyeaminatadiouf3101@gmail.com
- **Manager WhatsApp**: +221 78 598 75 18

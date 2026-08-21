# GROUPE YAMA+ - E-commerce Platform PRD

## Original Problem Statement
Full-stack e-commerce platform for GROUPE YAMA+ in Senegal with premium categories, admin panel, marketing games, email notifications, WhatsApp AI Chatbot, tracking (FB Pixel, GA4), SEO optimization, Real Estate module, ad campaign guides, and reseller/affiliate program.

## Current Tech Stack
- **Frontend**: React.js, TailwindCSS, Framer Motion, Axios
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Deployment**: Hostinger VPS (Ubuntu), Nginx, Systemd
- **Integrations**: Google OAuth, PayDunya (Payments), Resend (Email), Orange SMS, Gemini Vision, Facebook Pixel, GA4

---

## Session Changes (August 21, 2026 - Latest Session)

### ✅ Bugs Fixed

#### 1. Admin Featured Products Page - FIXED ✅
- **Bug**: Impossible d'ajouter ou déplacer un produit dans "Mise en avant"
- **Root Cause**: Missing endpoint `PUT /api/admin/products/{id}` for partial updates
- **Fix Applied**: 
  - Created new endpoint with authentication
  - Fixed FeaturedProductsAdmin.js to use Bearer token
  - Moved ProductCard component outside main component to avoid re-renders
- **Status**: Working (17/17 backend tests pass)

#### 2. SMS Client Notification - FIXED ✅
- **Bug**: SMS showing "Bonjour Admin" instead of customer name
- **Root Cause**: SMS template not extracting customer first name properly
- **Fix Applied**: 
  - Extract first name from `shipping.full_name`
  - Include product name(s) in SMS
  - Add order tracking link
  - Format: `GROUPE YAMA+ Bonjour {Prénom}, commande #{ID} confirmée! {Produit} x{qty} Total: {montant} FCFA Suivi: {lien}`
- **Status**: Implemented

#### 3. Email Product Image Cut Off - FIXED ✅
- **Bug**: Product images in confirmation emails were cut off
- **Root Cause**: Using CSS `display: flex` which doesn't work in email clients
- **Fix Applied**: Replaced with table-based layout (70x70px images with proper borders)
- **Status**: Implemented

#### 4. Products "Sur Commande" Stock - FIXED ✅
- **Bug**: Products marked as "sur commande" still required stock validation
- **Fix Applied**: Cart add-to-cart now skips stock check if `is_on_order=true`
- **Status**: Working (test passes)

#### 5. Failed Payment Recovery Workflow - IMPLEMENTED ✅
- **New Feature**: When online payment fails, customer can:
  - "Réessayer le paiement" (retry with PayDunya)
  - "Payer à la livraison" (switch to COD)
- **Endpoints Added**:
  - `POST /api/payments/paydunya/retry/{order_id}` - Create new payment request
  - `POST /api/payments/paydunya/switch-to-cod/{order_id}` - Convert to COD
- **Frontend**: OrderDetailPage shows alert with buttons for pending payments
- **Status**: Working (backend + frontend tests pass)

### ⚠️ User Clarification Required

#### iPhone Variants (Capacity/Color)
- **User Report**: Variants not saving when multiple colors selected
- **Current Behavior**: Each variant (capacity + color combination) must be added separately as individual SKUs
- **This is intended design**: Each variant is a unique SKU with its own price and stock
- **UI Flow**: Click "Ajouter une variante" for each capacity/color combination (e.g., 128Go Noir, 128Go Blanc, 256Go Noir...)
- **Note**: The system supports unlimited variants per product

### ✅ Previously Completed Features

#### Product Variants - WORKING ✅
- Smartphones: Capacity (64Go-1To) + Color variants
- Climatiseurs: Puissance CV (1-5 CV) variants  
- Matelas: Dimensions (90x190 to 200x200) variants
- Each variant has own price and stock

#### Admin Updates - WORKING ✅
- PUT /api/admin/products/{id} for featured/is_new/order updates
- FeaturedProductsAdmin properly authenticated
- Featured products sorting and ordering

---

## Test Results Summary (August 21, 2026)
- **Backend Tests**: 17/17 passed (100%)
- **Frontend Tests**: 10/10 passed, 1 skipped (100%)
- **Total**: 27 tests passed

### Features Verified by Tests:
1. Admin Featured Products API ✅
2. PayDunya Retry Payment ✅
3. PayDunya Switch to COD ✅
4. Product Variants (Smartphones) ✅
5. Product Variants (Climatiseur) ✅
6. Product Variants (Matelas) ✅
7. Sur Commande Stock Skip ✅
8. Order Detail Payment Retry UI ✅
9. Featured Products Query ✅
10. PayDunya Payment Methods ✅

---

## Remaining Tasks (Prioritized)

### P1 - High Priority
- [ ] SEO Meta tags and Schema.org structured data
- [ ] Structured product specs display (icons like Real Estate cards)

### P2 - Medium Priority
- [ ] WhatsApp automated notifications on order confirmation
- [ ] Guarantees & Returns UI on product pages

### P3 - Future/Backlog
- [ ] Refactor server.py (>11k lines → split into routes/)
- [ ] Ad campaign tutorial (Facebook/Google/YouTube)

---

## API Endpoints Reference

### Payment Recovery (NEW)
- `POST /api/payments/paydunya/retry/{order_id}` - Retry failed payment
- `POST /api/payments/paydunya/switch-to-cod/{order_id}` - Convert to Cash on Delivery
- `GET /api/payments/paydunya/pending-orders/{phone}` - Get pending orders by phone

### Admin Products (UPDATED)
- `PUT /api/admin/products/{product_id}` - Partial update (featured, is_new, order fields)
- `PUT /api/products/{product_id}` - Full product update
- `DELETE /api/admin/products/{product_id}` - Delete product

### Orders
- `GET /api/orders/{order_id}` - Get order details (shows payment retry options if pending)

---

## Database Schema Updates

### Products Collection
```javascript
{
  has_variants: Boolean,  // NEW - Whether product has price variants
  variants: [             // Array of variant objects
    {
      id: String,
      capacity: String,   // For phones: "64go", "128go", etc.
      color: String,      // For phones: "noir", "blanc", etc.
      puissance: String,  // For AC: "1", "1.5", "2", etc.
      dimension: String,  // For mattresses: "90x190", "160x200", etc.
      price: Number,
      stock: Number,
      image: String       // Optional variant-specific image
    }
  ],
  is_on_order: Boolean,   // Products available only "sur commande"
  // ... other fields
}
```

### Orders Collection
```javascript
{
  payment_retry_count: Number,      // NEW - Track retry attempts
  last_payment_attempt: String,     // NEW - ISO datetime
  switched_to_cod: Boolean,         // NEW - If switched from online to COD
  switched_at: String,              // NEW - When switched
  // ... other fields
}
```

---

## Credentials
- **Admin**: admin@yamaplus.com / Admin123!
- **VPS**: groupeyamaplus.com (SSH via bash history)

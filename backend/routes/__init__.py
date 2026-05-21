"""
Routes package initialization
Complete modular architecture for YAMA+ E-commerce Platform
"""
# Note: Routes are imported individually in server.py to avoid circular imports
# Each route file imports what it needs directly from server.py

__all__ = [
    # ============== ACTIVE MODULES (Integrated in server.py) ==============
    'auth',              # User authentication and registration
    'reservations',      # Reservation system
    'marketing',         # Marketing campaigns
    'sms_templates',     # SMS workflow templates
    'platform_reset',    # Platform reset utilities
    'blog',              # Blog posts and articles
    'gift_box',          # Gift box system
    'real_estate',       # Real estate listings
    'commercial_routes', # Commercial management
    'seo_prerender',     # SEO pre-rendering
    'currency',          # Multi-currency support
    'push_notifications',# Web push notifications
    
    # ============== PREPARED MODULES (Ready for integration) ==============
    # Core E-commerce
    'products',          # Products CRUD, Flash Sales, Reviews
    'cart',              # Shopping Cart operations
    'orders',            # Order creation and tracking
    'promo_codes',       # Promotional codes and discounts
    
    # User Features
    'wishlist',          # Wishlist operations and sharing
    'loyalty',           # Loyalty program, points, rewards
    'newsletter',        # Newsletter subscriptions
    
    # Business Features
    'resellers',         # Reseller portal and commission tracking
    'appointments',      # Appointment booking system
    'game',              # Spin wheel / Chrono game
    
    # Admin
    'admin',             # Admin dashboard, analytics, exports
]





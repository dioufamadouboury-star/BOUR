"""
Routes package initialization
Available modules for server.py refactoring
"""
# Note: Routes are imported individually in server.py to avoid circular imports
# Each route file imports what it needs directly from server.py

__all__ = [
    # Active modules (integrated in server.py)
    'auth',
    'reservations', 
    'marketing',
    'sms_templates',
    'platform_reset',
    'blog',
    'gift_box',
    'real_estate',
    'commercial_routes',
    'seo_prerender',
    'currency',
    'push_notifications',
    
    # Prepared modules (ready for integration)
    'products',  # Products CRUD, Flash Sales, Reviews
    'cart',      # Shopping Cart operations
    'orders',    # Order creation and tracking
]


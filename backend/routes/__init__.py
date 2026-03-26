"""
Routes package initialization
"""
# Note: Routes are imported individually in server.py to avoid circular imports
# Each route file imports what it needs directly from server.py

__all__ = [
    'auth',
    'reservations', 
    'marketing',
    'sms_templates',
    'platform_reset',
    'blog',
    'gift_box',
    'real_estate',
    'commercial_routes',
    'seo_prerender'
]

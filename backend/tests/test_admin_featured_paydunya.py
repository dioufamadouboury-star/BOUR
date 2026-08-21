"""
Tests for Admin Featured Products API and PayDunya retry/switch-to-cod endpoints
"""
import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@yamaplus.com",
        "password": "Admin123!"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")

@pytest.fixture
def authenticated_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


class TestAdminFeaturedProductsAPI:
    """Tests for PUT /api/admin/products/{id} endpoint"""
    
    def test_update_featured_status(self, authenticated_client):
        """Test updating product featured status"""
        # Get a product first
        products_response = authenticated_client.get(f"{BASE_URL}/api/products?limit=1")
        assert products_response.status_code == 200
        products = products_response.json()
        assert len(products) > 0
        
        product_id = products[0]["product_id"]
        
        # Update featured status
        response = authenticated_client.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json={"featured": True, "featured_order": 1}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Produit mis à jour"
        assert data["product"]["featured"] == True
        assert data["product"]["featured_order"] == 1
    
    def test_update_featured_order(self, authenticated_client):
        """Test updating featured_order field"""
        products_response = authenticated_client.get(f"{BASE_URL}/api/products?limit=1")
        products = products_response.json()
        product_id = products[0]["product_id"]
        
        # Update featured_order
        response = authenticated_client.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json={"featured_order": 5}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["product"]["featured_order"] == 5
    
    def test_update_is_new_status(self, authenticated_client):
        """Test updating is_new status"""
        products_response = authenticated_client.get(f"{BASE_URL}/api/products?limit=1")
        products = products_response.json()
        product_id = products[0]["product_id"]
        
        # Update is_new status
        response = authenticated_client.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json={"is_new": True, "new_order": 2}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["product"]["is_new"] == True
        assert data["product"]["new_order"] == 2
    
    def test_update_multiple_fields(self, authenticated_client):
        """Test updating multiple fields at once"""
        products_response = authenticated_client.get(f"{BASE_URL}/api/products?limit=1")
        products = products_response.json()
        product_id = products[0]["product_id"]
        
        # Update multiple fields
        response = authenticated_client.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json={
                "featured": True,
                "is_new": True,
                "featured_order": 3,
                "new_order": 3
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["product"]["featured"] == True
        assert data["product"]["is_new"] == True
    
    def test_update_nonexistent_product(self, authenticated_client):
        """Test updating a product that doesn't exist"""
        response = authenticated_client.put(
            f"{BASE_URL}/api/admin/products/nonexistent_product_id",
            json={"featured": True}
        )
        
        assert response.status_code == 404
        assert "non trouvé" in response.json()["detail"].lower()
    
    def test_update_without_auth(self, api_client):
        """Test that update requires authentication"""
        products_response = api_client.get(f"{BASE_URL}/api/products?limit=1")
        products = products_response.json()
        product_id = products[0]["product_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json={"featured": True}
        )
        
        assert response.status_code == 401
    
    def test_update_empty_body(self, authenticated_client):
        """Test updating with empty body returns error"""
        products_response = authenticated_client.get(f"{BASE_URL}/api/products?limit=1")
        products = products_response.json()
        product_id = products[0]["product_id"]
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/admin/products/{product_id}",
            json={}
        )
        
        assert response.status_code == 400
        assert "aucun champ" in response.json()["detail"].lower()


class TestPayDunyaRetryEndpoint:
    """Tests for POST /api/payments/paydunya/retry/{order_id}"""
    
    def test_retry_payment_pending_order(self, api_client, authenticated_client):
        """Test retrying payment for a pending order"""
        # Get an order with pending payment
        orders_response = authenticated_client.get(f"{BASE_URL}/api/admin/orders?limit=10")
        assert orders_response.status_code == 200
        
        orders = orders_response.json().get("orders", [])
        pending_order = None
        for order in orders:
            if order.get("payment_status") in ["pending", "failed", "awaiting_payment"]:
                pending_order = order
                break
        
        if not pending_order:
            pytest.skip("No pending payment orders found")
        
        order_id = pending_order["order_id"]
        
        # Retry payment
        response = api_client.post(
            f"{BASE_URL}/api/payments/paydunya/retry/{order_id}",
            json={
                "success_url": f"https://example.com/order/{order_id}?payment=success",
                "cancel_url": f"https://example.com/order/{order_id}?payment=cancelled"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "checkout_url" in data
        assert "token" in data
    
    def test_retry_payment_nonexistent_order(self, api_client):
        """Test retrying payment for non-existent order"""
        response = api_client.post(
            f"{BASE_URL}/api/payments/paydunya/retry/NONEXISTENT-ORDER",
            json={
                "success_url": "https://example.com/success",
                "cancel_url": "https://example.com/cancel"
            }
        )
        
        assert response.status_code == 404
        assert "non trouvée" in response.json()["detail"].lower()


class TestPayDunyaSwitchToCOD:
    """Tests for POST /api/payments/paydunya/switch-to-cod/{order_id}"""
    
    def test_switch_to_cod_pending_order(self, api_client, authenticated_client):
        """Test switching a pending order to Cash on Delivery"""
        # Get an order with pending payment
        orders_response = authenticated_client.get(f"{BASE_URL}/api/admin/orders?limit=20")
        assert orders_response.status_code == 200
        
        orders = orders_response.json().get("orders", [])
        pending_order = None
        for order in orders:
            if order.get("payment_status") in ["pending", "failed", "awaiting_payment"]:
                pending_order = order
                break
        
        if not pending_order:
            pytest.skip("No pending payment orders found")
        
        order_id = pending_order["order_id"]
        
        # Switch to COD
        response = api_client.post(
            f"{BASE_URL}/api/payments/paydunya/switch-to-cod/{order_id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["payment_status"] == "cod_pending"
        assert data["order_id"] == order_id
        
        # Verify order was updated
        order_response = authenticated_client.get(f"{BASE_URL}/api/admin/orders?limit=50")
        orders = order_response.json().get("orders", [])
        updated_order = next((o for o in orders if o["order_id"] == order_id), None)
        
        if updated_order:
            assert updated_order["payment_status"] == "cod_pending"
            assert updated_order["payment_method"] == "cash"
    
    def test_switch_to_cod_nonexistent_order(self, api_client):
        """Test switching non-existent order to COD"""
        response = api_client.post(
            f"{BASE_URL}/api/payments/paydunya/switch-to-cod/NONEXISTENT-ORDER"
        )
        
        assert response.status_code == 404
        assert "non trouvée" in response.json()["detail"].lower()


class TestProductVariantsAPI:
    """Tests for product variants support"""
    
    def test_create_product_with_variants(self, authenticated_client):
        """Test creating a product with variants"""
        unique_id = f"TEST_{int(time.time())}"
        
        product_data = {
            "name": f"Test iPhone {unique_id}",
            "description": "Test smartphone with variants",
            "price": 500000,
            "category": "electronique",
            "subcategory": "Smartphones",
            "images": ["https://example.com/image.jpg"],
            "stock": 10,
            "has_variants": True,
            "variants": [
                {
                    "id": f"var-{unique_id}-1",
                    "capacity": "128go",
                    "color": "noir",
                    "price": 500000,
                    "stock": 5
                },
                {
                    "id": f"var-{unique_id}-2",
                    "capacity": "256go",
                    "color": "blanc",
                    "price": 600000,
                    "stock": 3
                }
            ]
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/products",
            json=product_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_variants"] == True
        assert len(data["variants"]) == 2
        
        # Cleanup - delete the test product
        product_id = data["product_id"]
        authenticated_client.delete(f"{BASE_URL}/api/admin/products/{product_id}")
    
    def test_create_climatiseur_with_cv_variants(self, authenticated_client):
        """Test creating a Climatiseur with CV variants"""
        unique_id = f"TEST_{int(time.time())}"
        
        product_data = {
            "name": f"Test Climatiseur {unique_id}",
            "description": "Test AC with CV variants",
            "price": 200000,
            "category": "electromenager",
            "subcategory": "Climatiseur",
            "images": ["https://example.com/ac.jpg"],
            "stock": 5,
            "has_variants": True,
            "variants": [
                {
                    "id": f"var-{unique_id}-1",
                    "puissance": "1",
                    "unit": "CV",
                    "price": 200000,
                    "stock": 2
                },
                {
                    "id": f"var-{unique_id}-2",
                    "puissance": "1.5",
                    "unit": "CV",
                    "price": 280000,
                    "stock": 3
                }
            ]
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/products",
            json=product_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_variants"] == True
        assert len(data["variants"]) == 2
        
        # Cleanup
        product_id = data["product_id"]
        authenticated_client.delete(f"{BASE_URL}/api/admin/products/{product_id}")
    
    def test_create_matelas_with_dimension_variants(self, authenticated_client):
        """Test creating a Matelas with dimension variants"""
        unique_id = f"TEST_{int(time.time())}"
        
        product_data = {
            "name": f"Test Matelas {unique_id}",
            "description": "Test mattress with dimension variants",
            "price": 100000,
            "category": "decoration",
            "subcategory": "Literie & Matelas",
            "images": ["https://example.com/mattress.jpg"],
            "stock": 10,
            "has_variants": True,
            "variants": [
                {
                    "id": f"var-{unique_id}-1",
                    "dimension": "90x190",
                    "price": 100000,
                    "stock": 5
                },
                {
                    "id": f"var-{unique_id}-2",
                    "dimension": "160x200",
                    "price": 180000,
                    "stock": 3
                }
            ]
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/products",
            json=product_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_variants"] == True
        assert len(data["variants"]) == 2
        
        # Cleanup
        product_id = data["product_id"]
        authenticated_client.delete(f"{BASE_URL}/api/admin/products/{product_id}")


class TestSurCommandeStock:
    """Tests for 'sur commande' products stock validation"""
    
    def test_sur_commande_product_no_stock_required(self, authenticated_client):
        """Test that 'sur commande' products can be created without stock"""
        unique_id = f"TEST_{int(time.time())}"
        
        product_data = {
            "name": f"Test Sur Commande {unique_id}",
            "description": "Product available on order",
            "price": 500000,
            "category": "electronique",
            "subcategory": "Smartphones",
            "images": ["https://example.com/image.jpg"],
            "stock": 0,  # No stock
            "is_on_order": True,
            "order_delivery_days": 14
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/products",
            json=product_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_on_order"] == True
        assert data["stock"] == 0
        assert data["order_delivery_days"] == 14
        
        # Cleanup
        product_id = data["product_id"]
        authenticated_client.delete(f"{BASE_URL}/api/admin/products/{product_id}")


class TestFeaturedProductsQuery:
    """Tests for querying featured products"""
    
    def test_get_featured_products(self, api_client):
        """Test getting featured products"""
        response = api_client.get(f"{BASE_URL}/api/products?featured=true&limit=10")
        
        assert response.status_code == 200
        products = response.json()
        
        # All returned products should be featured
        for product in products:
            assert product.get("featured") == True
    
    def test_get_new_products(self, api_client):
        """Test getting new products"""
        response = api_client.get(f"{BASE_URL}/api/products?is_new=true&limit=10")
        
        assert response.status_code == 200
        products = response.json()
        
        # All returned products should be new
        for product in products:
            assert product.get("is_new") == True

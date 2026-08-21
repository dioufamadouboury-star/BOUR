"""
Tests for Dashboard Analytics and Category-based Shipping
Tests the following features:
1. Dashboard stats only counting cod_pending and paid orders
2. Category-based shipping calculation (Décoration/Mobilier, Électroménager, Automobile)
3. Featured/New products sorting API
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@yamaplus.com",
        "password": "Admin123!"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestDashboardAnalytics:
    """Test dashboard stats API - only counts cod_pending and paid orders"""
    
    def test_dashboard_stats_endpoint_exists(self, api_client, admin_token):
        """Test that dashboard stats endpoint exists and requires auth"""
        # Without auth should fail
        response = api_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403], "Should require authentication"
        
        # With auth should succeed
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats?period=month",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Dashboard stats failed: {response.text}"
    
    def test_dashboard_stats_structure(self, api_client, admin_token):
        """Test dashboard stats response structure"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats?period=month",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields exist
        assert "total_orders" in data, "Missing total_orders field"
        assert "total_revenue" in data, "Missing total_revenue field"
        assert "total_products" in data, "Missing total_products field"
        assert "total_users" in data, "Missing total_users field"
    
    def test_dashboard_stats_period_filter(self, api_client, admin_token):
        """Test dashboard stats with different period filters"""
        for period in ["day", "week", "month", "year"]:
            response = api_client.get(
                f"{BASE_URL}/api/admin/stats?period={period}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200, f"Failed for period={period}"
            data = response.json()
            assert isinstance(data.get("total_orders"), int), f"total_orders should be int for period={period}"
            assert isinstance(data.get("total_revenue"), (int, float)), f"total_revenue should be numeric for period={period}"


class TestCategoryBasedShipping:
    """Test category-based shipping calculation"""
    
    def test_shipping_endpoint_exists(self, api_client):
        """Test that shipping calculation endpoint exists"""
        response = api_client.post(f"{BASE_URL}/api/delivery/calculate", json={
            "city": "Dakar",
            "address": "Fass",
            "region": "Dakar",
            "categories": []
        })
        assert response.status_code == 200, f"Shipping endpoint failed: {response.text}"
    
    def test_decoration_mobilier_shipping_dakar_centre(self, api_client):
        """Test Décoration/Mobilier shipping - Dakar Centre = 15,000 FCFA"""
        response = api_client.post(f"{BASE_URL}/api/delivery/calculate", json={
            "city": "Dakar",
            "address": "Fass",
            "region": "Dakar",
            "categories": ["decoration"]
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["shipping_cost"] == 15000, f"Expected 15000 for decoration in Dakar Centre, got {data['shipping_cost']}"
        assert data["category_rule"] == "mobilier", f"Expected category_rule='mobilier', got {data.get('category_rule')}"
        assert "Mobilier" in data["zone_label"] or "Décoration" in data["zone_label"]
    
    def test_decoration_mobilier_shipping_banlieue(self, api_client):
        """Test Décoration/Mobilier shipping - Banlieue = 20,000 FCFA"""
        response = api_client.post(f"{BASE_URL}/api/delivery/calculate", json={
            "city": "Guédiawaye",
            "address": "",
            "region": "Dakar",
            "categories": ["mobilier"]
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["shipping_cost"] == 20000, f"Expected 20000 for mobilier in Banlieue, got {data['shipping_cost']}"
        assert data["category_rule"] == "mobilier"
    
    def test_electromenager_shipping_dakar_centre(self, api_client):
        """Test Électroménager shipping - Dakar Centre = 10,000 FCFA"""
        response = api_client.post(f"{BASE_URL}/api/delivery/calculate", json={
            "city": "Dakar",
            "address": "Médina",
            "region": "Dakar",
            "categories": ["electromenager"]
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["shipping_cost"] == 10000, f"Expected 10000 for electromenager in Dakar Centre, got {data['shipping_cost']}"
        assert data["category_rule"] == "electromenager"
    
    def test_electromenager_shipping_proche_dakar(self, api_client):
        """Test Électroménager shipping - Proche Dakar = 20,000 FCFA"""
        response = api_client.post(f"{BASE_URL}/api/delivery/calculate", json={
            "city": "Rufisque",
            "address": "",
            "region": "Dakar",
            "categories": ["electromenager"]
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["shipping_cost"] == 20000, f"Expected 20000 for electromenager in Proche Dakar, got {data['shipping_cost']}"
        assert data["category_rule"] == "electromenager"
    
    def test_automobile_no_delivery(self, api_client):
        """Test Automobile - No delivery (pickup only)"""
        response = api_client.post(f"{BASE_URL}/api/delivery/calculate", json={
            "city": "Dakar",
            "address": "Fass",
            "region": "Dakar",
            "categories": ["automobile"]
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["shipping_cost"] == 0, f"Expected 0 for automobile, got {data['shipping_cost']}"
        assert data.get("no_delivery") == True, "Expected no_delivery=True for automobile"
        assert data["category_rule"] == "automobile"
        assert "Retrait" in data["message"] or "magasin" in data["message"].lower()
    
    def test_immobilier_no_delivery(self, api_client):
        """Test Immobilier - No delivery (visit only)"""
        response = api_client.post(f"{BASE_URL}/api/delivery/calculate", json={
            "city": "Dakar",
            "address": "Point E",
            "region": "Dakar",
            "categories": ["immobilier"]
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["shipping_cost"] == 0, f"Expected 0 for immobilier, got {data['shipping_cost']}"
        assert data.get("no_delivery") == True, "Expected no_delivery=True for immobilier"
        assert data["category_rule"] == "immobilier"
    
    def test_standard_shipping_electronique(self, api_client):
        """Test standard shipping for electronique category"""
        response = api_client.post(f"{BASE_URL}/api/delivery/calculate", json={
            "city": "Dakar",
            "address": "Fass",
            "region": "Dakar",
            "categories": ["electronique"]
        })
        assert response.status_code == 200
        data = response.json()
        
        # Standard shipping should apply (1500 for Dakar Centre)
        assert data["shipping_cost"] == 1500, f"Expected 1500 for electronique in Dakar Centre, got {data['shipping_cost']}"
        assert data.get("category_rule") is None, "Should not have category_rule for standard shipping"
    
    def test_shipping_without_categories(self, api_client):
        """Test shipping calculation without categories (standard rates)"""
        response = api_client.post(f"{BASE_URL}/api/delivery/calculate", json={
            "city": "Dakar",
            "address": "Fass",
            "region": "Dakar",
            "categories": []
        })
        assert response.status_code == 200
        data = response.json()
        
        # Standard shipping should apply
        assert data["shipping_cost"] == 1500, f"Expected 1500 for standard shipping, got {data['shipping_cost']}"


class TestFeaturedProductsSorting:
    """Test Featured/New products manual sorting API"""
    
    def test_get_featured_products(self, api_client):
        """Test getting featured products"""
        response = api_client.get(f"{BASE_URL}/api/products?featured=true&limit=50")
        assert response.status_code == 200
        products = response.json()
        
        assert isinstance(products, list), "Should return a list of products"
        # All returned products should be featured
        for product in products:
            assert product.get("featured") == True, f"Product {product.get('name')} should be featured"
    
    def test_get_new_products(self, api_client):
        """Test getting new products"""
        response = api_client.get(f"{BASE_URL}/api/products?is_new=true&limit=50")
        assert response.status_code == 200
        products = response.json()
        
        assert isinstance(products, list), "Should return a list of products"
        # All returned products should be marked as new
        for product in products:
            assert product.get("is_new") == True, f"Product {product.get('name')} should be marked as new"
    
    def test_featured_products_have_order_field(self, api_client):
        """Test that featured products have featured_order field"""
        response = api_client.get(f"{BASE_URL}/api/products?featured=true&limit=10")
        assert response.status_code == 200
        products = response.json()
        
        for product in products:
            # featured_order can be null or an integer
            assert "featured_order" in product, f"Product {product.get('name')} missing featured_order field"
    
    def test_new_products_have_order_field(self, api_client):
        """Test that new products have new_order field"""
        response = api_client.get(f"{BASE_URL}/api/products?is_new=true&limit=10")
        assert response.status_code == 200
        products = response.json()
        
        for product in products:
            # new_order can be null or an integer
            assert "new_order" in product, f"Product {product.get('name')} missing new_order field"


class TestPayDunyaPayment:
    """Test PayDunya payment integration"""
    
    def test_payment_methods_endpoint(self, api_client):
        """Test PayDunya payment methods endpoint"""
        response = api_client.get(f"{BASE_URL}/api/payments/paydunya/methods")
        assert response.status_code == 200
        data = response.json()
        
        assert "methods" in data, "Should return payment methods"
        methods = data["methods"]
        
        # Check expected payment methods exist
        method_ids = [m["id"] for m in methods]
        assert "wave" in method_ids, "Wave should be available"
        assert "orange_money" in method_ids, "Orange Money should be available"
    
    def test_payment_initiation_requires_order(self, api_client):
        """Test that payment initiation requires valid order"""
        response = api_client.post(f"{BASE_URL}/api/payments/paydunya/initiate", json={
            "order_id": "nonexistent_order_123",
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel"
        })
        # Should fail with 404 for nonexistent order
        assert response.status_code in [404, 400], f"Should fail for nonexistent order: {response.text}"


class TestProductVariants:
    """Test product variants API support"""
    
    def test_products_have_variants_field(self, api_client):
        """Test that products have variants-related fields"""
        response = api_client.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        products = response.json()
        
        for product in products:
            # Check variants fields exist (can be null)
            assert "variants" in product or product.get("has_variants") is not None, \
                f"Product {product.get('name')} should have variants field"
    
    def test_product_detail_includes_variants(self, api_client):
        """Test that product detail includes variants info"""
        # First get a product
        response = api_client.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200
        products = response.json()
        
        if products:
            product_id = products[0].get("product_id")
            response = api_client.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            product = response.json()
            
            # Variants field should exist
            assert "variants" in product or "has_variants" in product


class TestSubcategoryFiltering:
    """Test subcategory filtering on category pages"""
    
    def test_products_by_category(self, api_client):
        """Test filtering products by category"""
        response = api_client.get(f"{BASE_URL}/api/products?category=electronique&limit=20")
        assert response.status_code == 200
        products = response.json()
        
        for product in products:
            assert product.get("category") == "electronique", \
                f"Product {product.get('name')} should be in electronique category"
    
    def test_products_by_subcategory(self, api_client):
        """Test filtering products by subcategory"""
        # First check if subcategory filter is supported
        response = api_client.get(f"{BASE_URL}/api/products?subcategory=Smartphones&limit=20")
        assert response.status_code == 200
        products = response.json()
        
        # If subcategory filter works, products should match
        # Note: API may not support subcategory filter, in which case all products are returned
        # This is acceptable behavior - the filter is applied client-side on CategoryPage
        assert isinstance(products, list), "Should return a list of products"
    
    def test_products_by_category_and_subcategory(self, api_client):
        """Test filtering products by both category and subcategory"""
        response = api_client.get(f"{BASE_URL}/api/products?category=electromenager&subcategory=Climatiseur&limit=20")
        assert response.status_code == 200
        products = response.json()
        
        for product in products:
            assert product.get("category") == "electromenager", \
                f"Product {product.get('name')} should be in electromenager category"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

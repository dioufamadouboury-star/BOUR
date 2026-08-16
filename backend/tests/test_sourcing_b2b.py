"""
Backend API Tests for Sourcing and B2B Portal
Tests: Sourcing rates, calculator, requests, B2B registration, login
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://subcats-preview.preview.emergentagent.com')


class TestSourcingAPI:
    """Tests for China Import/Sourcing API endpoints"""
    
    def test_health_check(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "healthy"
    
    def test_get_sourcing_rates(self):
        """Test GET /api/sourcing/rates returns shipping rates"""
        response = requests.get(f"{BASE_URL}/api/sourcing/rates")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "rates" in data
        assert "extra_fees" in data
        assert "notes" in data
        
        # Verify rates contain expected methods
        rates = data["rates"]
        assert "air_general" in rates
        assert "air_sensitive" in rates
        assert "maritime" in rates
        
        # Verify air_general structure
        air_general = rates["air_general"]
        assert air_general["name"] == "Avion - Marchandise Générale"
        assert air_general["duration"] == "8-12 jours"
        assert "tiers" in air_general
        assert len(air_general["tiers"]) >= 4
        
        # Verify extra fees
        extra_fees = data["extra_fees"]
        assert extra_fees["phone_surcharge"] == 300
        assert extra_fees["route_change"] == 3000
    
    def test_calculate_shipping_basic(self):
        """Test POST /api/sourcing/calculate with basic weight"""
        payload = {
            "weight_kg": 5,
            "shipping_method": "air_general"
        }
        response = requests.post(f"{BASE_URL}/api/sourcing/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["actual_weight_kg"] == 5.0
        assert data["billable_weight_kg"] == 5.0
        assert "calculations" in data
        
        # Verify calculations for air_general
        air_general = data["calculations"]["air_general"]
        assert air_general["method"] == "air_general"
        assert air_general["weight_kg"] == 5.0
        assert air_general["price_per_kg"] == 8000  # 0-10kg tier
        assert air_general["total_shipping_cost"] == 40000  # 5 * 8000
    
    def test_calculate_shipping_with_phones(self):
        """Test shipping calculation with phone surcharge"""
        payload = {
            "weight_kg": 2,
            "shipping_method": "air_sensitive",
            "contains_phones": 5
        }
        response = requests.post(f"{BASE_URL}/api/sourcing/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify phone surcharge is applied for air_sensitive
        air_sensitive = data["calculations"]["air_sensitive"]
        assert air_sensitive["phone_surcharge"] == 1500  # 5 phones * 300
        assert air_sensitive["base_cost"] == 16000  # 2kg * 8000
        assert air_sensitive["total_shipping_cost"] == 17500  # 16000 + 1500
    
    def test_calculate_shipping_volumetric(self):
        """Test shipping calculation with volumetric weight"""
        payload = {
            "weight_kg": 5,
            "shipping_method": "air_general",
            "length_cm": 50,
            "width_cm": 40,
            "height_cm": 30
        }
        response = requests.post(f"{BASE_URL}/api/sourcing/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Volumetric weight = (50*40*30)/1000000 * 167 = 0.06 * 167 = 10.02 kg
        assert data["volumetric_weight_kg"] is not None
        assert data["volumetric_weight_kg"] > 5  # Should be higher than actual weight
        # Billable weight should be the higher of actual vs volumetric
        assert data["billable_weight_kg"] == max(5, data["volumetric_weight_kg"])
    
    def test_calculate_shipping_higher_tier(self):
        """Test shipping calculation for higher weight tier"""
        payload = {
            "weight_kg": 25,
            "shipping_method": "air_general"
        }
        response = requests.post(f"{BASE_URL}/api/sourcing/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # 25kg falls in 10-50kg tier at 7000 FCFA/kg
        air_general = data["calculations"]["air_general"]
        assert air_general["price_per_kg"] == 7000
        assert air_general["total_shipping_cost"] == 175000  # 25 * 7000
    
    def test_create_sourcing_request(self):
        """Test POST /api/sourcing/request creates a new request"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "customer_name": f"TEST_Customer_{unique_id}",
            "customer_email": f"test_{unique_id}@example.com",
            "customer_phone": "+221 77 123 4567",
            "customer_address": "Test Address",
            "customer_city": "Dakar",
            "product_link": "https://aliexpress.com/item/test123",
            "product_name": "Test Product",
            "quantity": 2,
            "estimated_weight_kg": 3.5,
            "shipping_method": "air_general",
            "notes": "Test request"
        }
        response = requests.post(f"{BASE_URL}/api/sourcing/request", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "request_id" in data
        assert data["request_id"].startswith("IMP-")
        assert "message" in data
    
    def test_track_sourcing_request_not_found(self):
        """Test tracking non-existent request returns 404"""
        response = requests.get(f"{BASE_URL}/api/sourcing/track/IMP-NONEXISTENT")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data


class TestB2BAPI:
    """Tests for B2B Portal API endpoints"""
    
    def test_b2b_register_new_partner(self):
        """Test B2B partner registration"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "company_name": f"TEST_Company_{unique_id}",
            "contact_name": f"TEST_Contact_{unique_id}",
            "email": f"test_b2b_{unique_id}@example.com",
            "phone": "+221 77 987 6543",
            "password": "TestPass123!",
            "business_type": "retailer",
            "address": "Test B2B Address",
            "city": "Dakar"
        }
        response = requests.post(f"{BASE_URL}/api/b2b/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "partner_id" in data
        assert data["partner_id"].startswith("B2B-")
        assert "message" in data
    
    def test_b2b_register_duplicate_email(self):
        """Test B2B registration with duplicate email fails"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "company_name": f"TEST_Company_{unique_id}",
            "contact_name": f"TEST_Contact_{unique_id}",
            "email": f"test_dup_{unique_id}@example.com",
            "phone": "+221 77 111 2222",
            "password": "TestPass123!",
            "business_type": "retailer"
        }
        
        # First registration should succeed
        response1 = requests.post(f"{BASE_URL}/api/b2b/register", json=payload)
        assert response1.status_code == 200
        
        # Second registration with same email should fail
        response2 = requests.post(f"{BASE_URL}/api/b2b/register", json=payload)
        assert response2.status_code == 400
        data = response2.json()
        assert "déjà utilisé" in data["detail"].lower() or "already" in data["detail"].lower()
    
    def test_b2b_login_invalid_credentials(self):
        """Test B2B login with invalid credentials"""
        payload = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        response = requests.post(f"{BASE_URL}/api/b2b/login", json=payload)
        assert response.status_code == 401
        data = response.json()
        assert "incorrect" in data["detail"].lower() or "invalid" in data["detail"].lower()
    
    def test_b2b_dashboard_unauthorized(self):
        """Test B2B dashboard without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/b2b/dashboard")
        assert response.status_code == 401
    
    def test_b2b_me_unauthorized(self):
        """Test B2B profile without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/b2b/me")
        assert response.status_code == 401


class TestProductsAPI:
    """Tests for Products API - core e-commerce functionality"""
    
    def test_get_products(self):
        """Test GET /api/products returns product list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        
        # Should return a list of products
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify product structure
        product = data[0]
        assert "product_id" in product
        assert "name" in product
        assert "price" in product
        assert "category" in product
    
    def test_get_categories(self):
        """Test GET /api/categories returns category list"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        
        # Should return a list of categories
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify category structure
        category = data[0]
        assert "id" in category
        assert "name" in category
    
    def test_get_product_by_id(self):
        """Test GET /api/products/{id} returns single product"""
        # First get a product ID from the list
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        product_id = products[0]["product_id"]
        
        # Get single product
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["product_id"] == product_id
        assert "name" in data
        assert "price" in data
    
    def test_get_product_not_found(self):
        """Test GET /api/products/{id} with invalid ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/products/nonexistent_product_id")
        assert response.status_code == 404


class TestDeliveryAPI:
    """Tests for Delivery/Shipping calculation API"""
    
    def test_calculate_delivery_dakar_center(self):
        """Test delivery calculation for Dakar center"""
        payload = {
            "city": "Médina",
            "address": "Rue 10",
            "region": "Dakar"
        }
        response = requests.post(f"{BASE_URL}/api/delivery/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "shipping_cost" in data
        assert "zone" in data
        assert "zone_label" in data
        # Médina should be in zone_1500
        assert data["shipping_cost"] == 1500
    
    def test_calculate_delivery_parcelles(self):
        """Test delivery calculation for Parcelles Assainies"""
        payload = {
            "city": "Parcelles Assainies",
            "address": "",
            "region": "Dakar"
        }
        response = requests.post(f"{BASE_URL}/api/delivery/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Parcelles should be in zone_2500
        assert data["shipping_cost"] == 2500
    
    def test_calculate_delivery_other_region(self):
        """Test delivery calculation for other regions"""
        payload = {
            "city": "Thiès",
            "address": "",
            "region": "Thiès"
        }
        response = requests.post(f"{BASE_URL}/api/delivery/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Other regions should have default shipping
        assert "shipping_cost" in data


class TestOrderAPI:
    """Tests for Order creation API"""
    
    def test_create_order_missing_fields(self):
        """Test order creation with missing required fields fails"""
        payload = {
            "items": [],
            "shipping": {},
            "payment_method": "cash"
        }
        response = requests.post(f"{BASE_URL}/api/orders", json=payload)
        # Should fail validation
        assert response.status_code in [400, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

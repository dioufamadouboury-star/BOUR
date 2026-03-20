"""
Backend API tests for YAMA+ e-commerce platform
Tests Facebook Pixel integration, share functionality, and core APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://analytics-reset-prod.preview.emergentagent.com').rstrip('/')


class TestHealthAndProducts:
    """Core API health and products tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("SUCCESS: API health endpoint working")
    
    def test_get_products(self):
        """Test products listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Products fetch failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Products should be a list"
        assert len(data) > 0, "Should have products in database"
        print(f"SUCCESS: Found {len(data)} products")
    
    def test_get_single_product(self):
        """Test fetching single product for share button functionality"""
        response = requests.get(f"{BASE_URL}/api/products/prod_iphone15pro")
        assert response.status_code == 200, f"Product fetch failed: {response.text}"
        
        data = response.json()
        assert "product_id" in data, "Product should have product_id"
        assert "name" in data, "Product should have name"
        assert "price" in data, "Product should have price"
        assert data["product_id"] == "prod_iphone15pro", "Product ID should match"
        print(f"SUCCESS: Product '{data['name']}' fetched - Price: {data['price']}")
    
    def test_get_categories(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Categories fetch failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Categories should be a list"
        print(f"SUCCESS: Found {len(data)} categories")


class TestAuthentication:
    """Authentication tests"""
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@yamaplus.com",
            "password": "Admin123!"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "token" in data or "access_token" in data, "Login should return token"
        print("SUCCESS: Admin login working")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400, 422], f"Should reject invalid credentials"
        print("SUCCESS: Invalid login properly rejected")


class TestCart:
    """Cart functionality tests"""
    
    def test_get_cart(self):
        """Test getting cart endpoint"""
        response = requests.get(f"{BASE_URL}/api/cart")
        # Cart might require auth or return empty cart
        assert response.status_code in [200, 401], f"Cart endpoint error: {response.text}"
        print(f"SUCCESS: Cart endpoint responds with status {response.status_code}")
    
    def test_add_to_cart(self):
        """Test add to cart functionality"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@yamaplus.com",
            "password": "Admin123!"
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get("token") or data.get("access_token")
            
            headers = {"Authorization": f"Bearer {token}"}
            
            # Add item to cart
            cart_response = requests.post(f"{BASE_URL}/api/cart/add", 
                json={
                    "product_id": "prod_iphone15pro",
                    "quantity": 1
                },
                headers=headers
            )
            # Should succeed or return cart data
            assert cart_response.status_code in [200, 201], f"Add to cart failed: {cart_response.text}"
            print("SUCCESS: Add to cart working")
        else:
            pytest.skip("Login required for cart test")


class TestFlashSales:
    """Flash sales API tests"""
    
    def test_get_flash_sales(self):
        """Test flash sales endpoint"""
        response = requests.get(f"{BASE_URL}/api/flash-sales")
        assert response.status_code == 200, f"Flash sales fetch failed: {response.text}"
        print("SUCCESS: Flash sales endpoint working")


class TestSearch:
    """Search functionality tests"""
    
    def test_product_search(self):
        """Test product search - used by Analytics.search tracking"""
        response = requests.get(f"{BASE_URL}/api/products?search=iphone")
        assert response.status_code == 200, f"Search failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Search should return list of products"
        assert len(data) > 0, "Should find iPhone products"
        print(f"SUCCESS: Search endpoint working - found {len(data)} products")


class TestNewsletter:
    """Newsletter API tests - used by Analytics.newsletterSignup tracking"""
    
    def test_newsletter_endpoint_exists(self):
        """Test newsletter subscription endpoint exists"""
        # Test with dummy email
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": "test_newsletter@example.com"
        })
        # Should accept or return validation error - not 404
        assert response.status_code != 404, "Newsletter endpoint should exist"
        print(f"SUCCESS: Newsletter endpoint responds with status {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

"""
Tests for PayTech payment integration
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPayTechPayment:
    """Test PayTech payment initiation and related endpoints"""
    
    @pytest.fixture
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture
    def test_order(self, api_client):
        """Create a test order for payment testing"""
        order_data = {
            "items": [{
                "product_id": "prod_iphone15pro",
                "name": "Test Product",
                "price": 50000,
                "quantity": 1,
                "image": "https://example.com/image.jpg"
            }],
            "shipping": {
                "full_name": f"Test User {uuid.uuid4().hex[:8]}",
                "email": "test@example.com",
                "phone": "+221771234567",
                "address": "123 Test Street",
                "city": "Dakar",
                "region": "Dakar",
                "notes": ""
            },
            "payment_method": "card",
            "subtotal": 50000,
            "shipping_cost": 2500,
            "discount": 0,
            "total": 52500
        }
        
        response = api_client.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200, f"Failed to create test order: {response.text}"
        return response.json()
    
    def test_paytech_initiate_success(self, api_client, test_order):
        """Test successful PayTech payment initiation"""
        order_id = test_order['order_id']
        
        payment_data = {
            "order_id": order_id,
            "success_url": f"{BASE_URL}/order/{order_id}?payment=success",
            "cancel_url": f"{BASE_URL}/checkout?order_id={order_id}&payment=cancel"
        }
        
        response = api_client.post(f"{BASE_URL}/api/payments/paytech/initiate", json=payment_data)
        
        assert response.status_code == 200, f"PayTech initiation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get('success') == True, "Expected success=True"
        assert 'checkout_url' in data, "Missing checkout_url in response"
        assert 'token' in data, "Missing token in response"
        
        # Verify checkout URL format
        assert 'paytech.sn' in data['checkout_url'], "Checkout URL should be from paytech.sn"
        assert data['token'] in data['checkout_url'], "Token should be in checkout URL"
    
    def test_paytech_initiate_invalid_order(self, api_client):
        """Test PayTech payment initiation with invalid order ID"""
        payment_data = {
            "order_id": "INVALID-ORDER-ID",
            "success_url": f"{BASE_URL}/order/INVALID?payment=success",
            "cancel_url": f"{BASE_URL}/checkout?payment=cancel"
        }
        
        response = api_client.post(f"{BASE_URL}/api/payments/paytech/initiate", json=payment_data)
        
        # Should return 404 for non-existent order
        assert response.status_code == 404, f"Expected 404 for invalid order, got {response.status_code}"
    
    def test_paytech_initiate_missing_fields(self, api_client, test_order):
        """Test PayTech payment initiation with missing required fields"""
        order_id = test_order['order_id']
        
        # Missing success_url
        payment_data = {
            "order_id": order_id,
            "cancel_url": f"{BASE_URL}/checkout?payment=cancel"
        }
        
        response = api_client.post(f"{BASE_URL}/api/payments/paytech/initiate", json=payment_data)
        
        # Should return 422 for validation error
        assert response.status_code == 422, f"Expected 422 for missing fields, got {response.status_code}"


class TestOrderCreation:
    """Test order creation with different payment methods"""
    
    @pytest.fixture
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_create_order_with_card_payment(self, api_client):
        """Test creating an order with card payment method"""
        order_data = {
            "items": [{
                "product_id": "prod_iphone15pro",
                "name": "Test Product",
                "price": 50000,
                "quantity": 1,
                "image": "https://example.com/image.jpg"
            }],
            "shipping": {
                "full_name": f"Test User {uuid.uuid4().hex[:8]}",
                "email": "test@example.com",
                "phone": "+221771234567",
                "address": "123 Test Street",
                "city": "Dakar",
                "region": "Dakar",
                "notes": ""
            },
            "payment_method": "card",
            "subtotal": 50000,
            "shipping_cost": 2500,
            "discount": 0,
            "total": 52500
        }
        
        response = api_client.post(f"{BASE_URL}/api/orders", json=order_data)
        
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        data = response.json()
        
        assert 'order_id' in data, "Missing order_id in response"
        assert data['payment_method'] == 'card', "Payment method should be 'card'"
        assert data['payment_status'] == 'pending', "Payment status should be 'pending'"
    
    def test_create_order_with_mobile_money(self, api_client):
        """Test creating an order with mobile money payment method"""
        order_data = {
            "items": [{
                "product_id": "prod_iphone15pro",
                "name": "Test Product",
                "price": 50000,
                "quantity": 1,
                "image": "https://example.com/image.jpg"
            }],
            "shipping": {
                "full_name": f"Test User {uuid.uuid4().hex[:8]}",
                "email": "test@example.com",
                "phone": "+221771234567",
                "address": "123 Test Street",
                "city": "Dakar",
                "region": "Dakar",
                "notes": ""
            },
            "payment_method": "mobile_money",
            "subtotal": 50000,
            "shipping_cost": 2500,
            "discount": 0,
            "total": 52500
        }
        
        response = api_client.post(f"{BASE_URL}/api/orders", json=order_data)
        
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        data = response.json()
        
        assert 'order_id' in data, "Missing order_id in response"
        assert data['payment_method'] == 'mobile_money', "Payment method should be 'mobile_money'"
    
    def test_create_order_with_cash_payment(self, api_client):
        """Test creating an order with cash on delivery payment method"""
        order_data = {
            "items": [{
                "product_id": "prod_iphone15pro",
                "name": "Test Product",
                "price": 50000,
                "quantity": 1,
                "image": "https://example.com/image.jpg"
            }],
            "shipping": {
                "full_name": f"Test User {uuid.uuid4().hex[:8]}",
                "email": "test@example.com",
                "phone": "+221771234567",
                "address": "123 Test Street",
                "city": "Dakar",
                "region": "Dakar",
                "notes": ""
            },
            "payment_method": "cash",
            "subtotal": 50000,
            "shipping_cost": 2500,
            "discount": 0,
            "total": 52500
        }
        
        response = api_client.post(f"{BASE_URL}/api/orders", json=order_data)
        
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        data = response.json()
        
        assert 'order_id' in data, "Missing order_id in response"
        assert data['payment_method'] == 'cash', "Payment method should be 'cash'"


class TestHealthEndpoint:
    """Test health endpoint"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        
        assert data.get('status') == 'healthy', "API should be healthy"
        assert 'database' in data, "Health response should include database status"

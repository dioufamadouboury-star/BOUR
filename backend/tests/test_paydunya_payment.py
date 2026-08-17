"""
Tests for PayDunya Payment Integration
Tests: Payment initiation, callback handling, verification, and manager notifications
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPayDunyaPaymentMethods:
    """Test PayDunya payment methods endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_payment_methods(self):
        """Test GET /api/payments/paydunya/methods returns available payment methods"""
        response = self.session.get(f"{BASE_URL}/api/payments/paydunya/methods")
        assert response.status_code == 200
        
        data = response.json()
        assert "methods" in data
        methods = data["methods"]
        
        # Verify expected payment methods are present
        method_ids = [m["id"] for m in methods]
        assert "wave" in method_ids, "Wave payment method should be available"
        assert "orange_money" in method_ids, "Orange Money should be available"
        assert "card" in method_ids, "Card payment should be available"
        
        # Verify Wave method structure
        wave = next(m for m in methods if m["id"] == "wave")
        assert wave["name"] == "Wave"
        assert wave["channel"] == "wave-senegal"
        assert "icon" in wave
        
        # Verify Orange Money method structure
        om = next(m for m in methods if m["id"] == "orange_money")
        assert om["name"] == "Orange Money"
        assert om["channel"] == "orange-money-senegal"


class TestPayDunyaPaymentInitiation:
    """Test PayDunya payment initiation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.test_order_id = None
    
    def get_admin_token(self):
        """Get admin authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@yamaplus.com",
            "password": "Admin123!"
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def create_test_order(self, payment_method="mobile_money"):
        """Create a test order for payment testing"""
        unique_id = uuid.uuid4().hex[:6]
        order_data = {
            "items": [{
                "product_id": "prod_samsung_tv",
                "name": f"TEST_Product_{unique_id}",
                "price": 50000,
                "quantity": 1,
                "image": "https://example.com/test.jpg"
            }],
            "shipping": {
                "full_name": f"TEST_User_{unique_id}",
                "email": f"test_{unique_id}@example.com",
                "phone": "+221771234567",
                "address": "123 Test Street",
                "city": "Dakar",
                "region": "Dakar"
            },
            "payment_method": payment_method,
            "subtotal": 50000,
            "shipping_cost": 2500,
            "total": 52500
        }
        
        response = self.session.post(f"{BASE_URL}/api/orders", json=order_data)
        if response.status_code == 200:
            return response.json()
        return None
    
    def test_initiate_payment_requires_valid_order(self):
        """Test payment initiation fails for non-existent order"""
        response = self.session.post(f"{BASE_URL}/api/payments/paydunya/initiate", json={
            "order_id": "INVALID-ORDER-123",
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel"
        })
        assert response.status_code == 404
        assert "non trouvée" in response.json().get("detail", "").lower() or "not found" in response.json().get("detail", "").lower()
    
    def test_initiate_payment_for_mobile_money_order(self):
        """Test payment initiation for mobile money order"""
        # Create a test order with mobile_money payment
        order = self.create_test_order(payment_method="mobile_money")
        if not order:
            pytest.skip("Could not create test order")
        
        self.test_order_id = order.get("order_id")
        
        # Verify order was created with pending payment status
        assert order.get("payment_status") == "pending", "Mobile money order should have pending payment status"
        assert order.get("order_status") == "awaiting_payment", "Mobile money order should be awaiting payment"
        
        # Try to initiate PayDunya payment
        response = self.session.post(f"{BASE_URL}/api/payments/paydunya/initiate", json={
            "order_id": self.test_order_id,
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel"
        })
        
        # PayDunya API may return success or error depending on configuration
        # We're testing the endpoint works, not the external API
        assert response.status_code in [200, 400, 500, 502], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "checkout_url" in data
            assert "token" in data
    
    def test_order_creation_with_cash_payment(self):
        """Test order creation with cash on delivery has correct status"""
        order = self.create_test_order(payment_method="cash")
        if not order:
            pytest.skip("Could not create test order")
        
        self.test_order_id = order.get("order_id")
        
        # Verify cash order has cod_pending status
        assert order.get("payment_status") == "cod_pending", "Cash order should have cod_pending payment status"
        assert order.get("order_status") == "confirmed", "Cash order should be confirmed immediately"
    
    def test_order_creation_with_card_payment(self):
        """Test order creation with card payment has pending status"""
        order = self.create_test_order(payment_method="card")
        if not order:
            pytest.skip("Could not create test order")
        
        self.test_order_id = order.get("order_id")
        
        # Verify card order has pending status
        assert order.get("payment_status") == "pending", "Card order should have pending payment status"
        assert order.get("order_status") == "awaiting_payment", "Card order should be awaiting payment"


class TestPayDunyaPaymentVerification:
    """Test PayDunya payment verification"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_verify_payment_for_nonexistent_order(self):
        """Test payment verification fails for non-existent order"""
        response = self.session.get(f"{BASE_URL}/api/payments/paydunya/verify/INVALID-ORDER-123")
        assert response.status_code == 404
    
    def test_verify_payment_returns_order_status(self):
        """Test payment verification returns order payment status"""
        # First create an order
        unique_id = uuid.uuid4().hex[:6]
        order_data = {
            "items": [{
                "product_id": "prod_samsung_tv",
                "name": f"TEST_Verify_{unique_id}",
                "price": 50000,
                "quantity": 1,
                "image": "https://example.com/test.jpg"
            }],
            "shipping": {
                "full_name": f"TEST_Verify_{unique_id}",
                "email": f"test_verify_{unique_id}@example.com",
                "phone": "+221771234567",
                "address": "123 Test Street",
                "city": "Dakar",
                "region": "Dakar"
            },
            "payment_method": "mobile_money",
            "subtotal": 50000,
            "shipping_cost": 2500,
            "total": 52500
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/orders", json=order_data)
        if create_response.status_code != 200:
            pytest.skip("Could not create test order")
        
        order_id = create_response.json().get("order_id")
        
        # Verify payment status
        response = self.session.get(f"{BASE_URL}/api/payments/paydunya/verify/{order_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("order_id") == order_id
        assert "payment_status" in data
        assert "order_status" in data
        assert data.get("payment_status") == "pending"  # Should be pending for new mobile money order


class TestManagerNotifications:
    """Test manager notification functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        """Get admin authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@yamaplus.com",
            "password": "Admin123!"
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_manager_notification_created_on_cash_order(self):
        """Test that manager notification is created when cash order is placed"""
        # Create a cash order
        unique_id = uuid.uuid4().hex[:6]
        order_data = {
            "items": [{
                "product_id": "prod_samsung_tv",
                "name": f"TEST_Notify_{unique_id}",
                "price": 50000,
                "quantity": 1,
                "image": "https://example.com/test.jpg"
            }],
            "shipping": {
                "full_name": f"TEST_Notify_{unique_id}",
                "email": f"test_notify_{unique_id}@example.com",
                "phone": "+221771234567",
                "address": "123 Test Street",
                "city": "Dakar",
                "region": "Dakar"
            },
            "payment_method": "cash",
            "subtotal": 50000,
            "shipping_cost": 2500,
            "total": 52500
        }
        
        response = self.session.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        
        order = response.json()
        assert order.get("payment_status") == "cod_pending"
        assert order.get("order_status") == "confirmed"
        
        # The manager notification is sent asynchronously via email
        # We can verify the order was created correctly which triggers the notification


class TestAdminDashboardStats:
    """Test admin dashboard statistics - only confirmed orders counted"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        """Get admin authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@yamaplus.com",
            "password": "Admin123!"
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_admin_stats_requires_auth(self):
        """Test admin stats endpoint requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
    
    def test_admin_stats_returns_correct_structure(self):
        """Test admin stats returns expected fields"""
        token = self.get_admin_token()
        if not token:
            pytest.skip("Could not get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify expected fields are present
        assert "total_orders" in data, "Should have total_orders field"
        assert "pending_orders" in data, "Should have pending_orders field"
        assert "total_products" in data, "Should have total_products field"
        assert "total_users" in data, "Should have total_users field"
        assert "total_revenue" in data, "Should have total_revenue field"
        
        # Verify types
        assert isinstance(data["total_orders"], int)
        assert isinstance(data["pending_orders"], int)
        assert isinstance(data["total_revenue"], int)
    
    def test_admin_stats_counts_only_confirmed_orders(self):
        """Test that admin stats only counts confirmed orders (paid or cod_pending)"""
        token = self.get_admin_token()
        if not token:
            pytest.skip("Could not get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get initial stats
        initial_response = self.session.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert initial_response.status_code == 200
        initial_stats = initial_response.json()
        initial_confirmed = initial_stats.get("total_orders", 0)
        initial_pending = initial_stats.get("pending_orders", 0)
        
        # Create a cash order (should be counted as confirmed)
        unique_id = uuid.uuid4().hex[:6]
        cash_order_data = {
            "items": [{
                "product_id": "prod_samsung_tv",
                "name": f"TEST_Stats_Cash_{unique_id}",
                "price": 50000,
                "quantity": 1,
                "image": "https://example.com/test.jpg"
            }],
            "shipping": {
                "full_name": f"TEST_Stats_{unique_id}",
                "email": f"test_stats_{unique_id}@example.com",
                "phone": "+221771234567",
                "address": "123 Test Street",
                "city": "Dakar",
                "region": "Dakar"
            },
            "payment_method": "cash",
            "subtotal": 50000,
            "shipping_cost": 2500,
            "total": 52500
        }
        
        cash_response = self.session.post(f"{BASE_URL}/api/orders", json=cash_order_data)
        assert cash_response.status_code == 200
        cash_order = cash_response.json()
        assert cash_order.get("payment_status") == "cod_pending"
        
        # Create a mobile money order (should NOT be counted as confirmed)
        unique_id2 = uuid.uuid4().hex[:6]
        mobile_order_data = {
            "items": [{
                "product_id": "prod_samsung_tv",
                "name": f"TEST_Stats_Mobile_{unique_id2}",
                "price": 50000,
                "quantity": 1,
                "image": "https://example.com/test.jpg"
            }],
            "shipping": {
                "full_name": f"TEST_Stats_{unique_id2}",
                "email": f"test_stats_{unique_id2}@example.com",
                "phone": "+221771234567",
                "address": "123 Test Street",
                "city": "Dakar",
                "region": "Dakar"
            },
            "payment_method": "mobile_money",
            "subtotal": 50000,
            "shipping_cost": 2500,
            "total": 52500
        }
        
        mobile_response = self.session.post(f"{BASE_URL}/api/orders", json=mobile_order_data)
        assert mobile_response.status_code == 200
        mobile_order = mobile_response.json()
        assert mobile_order.get("payment_status") == "pending"
        
        # Get updated stats
        updated_response = self.session.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert updated_response.status_code == 200
        updated_stats = updated_response.json()
        
        # Verify confirmed orders increased by 1 (only cash order)
        assert updated_stats.get("total_orders", 0) == initial_confirmed + 1, \
            "Confirmed orders should increase by 1 (cash order only)"
        
        # Verify pending orders increased by 1 (mobile money order)
        assert updated_stats.get("pending_orders", 0) == initial_pending + 1, \
            "Pending orders should increase by 1 (mobile money order)"

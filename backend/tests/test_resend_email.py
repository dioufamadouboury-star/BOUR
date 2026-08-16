"""
Tests for Resend Email Migration
Verifies that the email functions are properly defined after migration from MailerSend to Resend
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestResendEmailMigration:
    """Test Resend email migration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_backend_health_check(self):
        """Test backend is running correctly after Resend import"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        assert data.get('database') == 'healthy'
    
    def test_order_cancellation_endpoint_works(self):
        """Test order cancellation endpoint works (uses send_admin_notification)"""
        # First get admin token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@yamaplus.com",
            "password": "Admin123!"
        })
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        assert token, "Failed to get admin token"
        
        # Get orders to find a pending one
        headers = {"Authorization": f"Bearer {token}"}
        orders_response = self.session.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        assert orders_response.status_code == 200
        
        data = orders_response.json()
        orders = data.get('orders', data) if isinstance(data, dict) else data
        
        # Find a pending order
        pending_order = None
        for order in orders:
            if order.get('order_status') == 'pending':
                pending_order = order
                break
        
        if not pending_order:
            pytest.skip("No pending orders available for testing")
        
        order_id = pending_order.get('order_id')
        order_email = pending_order.get('shipping', {}).get('email', 'test@example.com')
        
        # Try to cancel the order - this will call send_admin_notification
        cancel_response = self.session.post(
            f"{BASE_URL}/api/orders/{order_id}/cancel",
            json={"reason": "Test Resend migration", "email": order_email}
        )
        
        # If send_admin_notification was not defined, this would return 500
        # After migration, it should return 200
        assert cancel_response.status_code == 200, f"Order cancellation failed: {cancel_response.text}"
        data = cancel_response.json()
        assert data.get('status') == 'cancelled'
        assert data.get('order_id') == order_id
    
    def test_can_cancel_endpoint_works(self):
        """Test can-cancel endpoint works"""
        # Get admin token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@yamaplus.com",
            "password": "Admin123!"
        })
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        
        # Get orders
        headers = {"Authorization": f"Bearer {token}"}
        orders_response = self.session.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        assert orders_response.status_code == 200
        
        data = orders_response.json()
        orders = data.get('orders', data) if isinstance(data, dict) else data
        
        if not orders:
            pytest.skip("No orders available for testing")
        
        # Test can-cancel endpoint with first order
        order_id = orders[0].get('order_id')
        can_cancel_response = self.session.get(f"{BASE_URL}/api/orders/{order_id}/can-cancel")
        
        assert can_cancel_response.status_code == 200
        data = can_cancel_response.json()
        assert 'can_cancel' in data
        assert 'current_status' in data
        assert 'message' in data

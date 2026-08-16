"""
Tests for Order Cancellation Feature
Tests the POST /api/orders/{order_id}/cancel and GET /api/orders/{order_id}/can-cancel endpoints
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestOrderCancellation:
    """Test order cancellation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.admin_email = "admin@yamaplus.com"
        self.admin_password = "Admin123!"
        self.test_email = "test@example.com"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_admin_token(self):
        """Get admin authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def get_pending_order(self, token):
        """Get a pending order for testing"""
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        if response.status_code == 200:
            data = response.json()
            orders = data.get('orders', data) if isinstance(data, dict) else data
            for order in orders:
                if order.get('order_status') == 'pending':
                    return order
        return None
    
    def test_can_cancel_endpoint_returns_true_for_pending_order(self):
        """Test GET /api/orders/{order_id}/can-cancel returns true for pending orders"""
        token = self.get_admin_token()
        assert token, "Failed to get admin token"
        
        order = self.get_pending_order(token)
        if not order:
            pytest.skip("No pending orders available for testing")
        
        order_id = order.get('order_id')
        response = self.session.get(f"{BASE_URL}/api/orders/{order_id}/can-cancel")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('can_cancel') == True
        assert data.get('current_status') == 'pending'
        assert 'message' in data
    
    def test_can_cancel_endpoint_returns_false_for_cancelled_order(self):
        """Test GET /api/orders/{order_id}/can-cancel returns false for cancelled orders"""
        token = self.get_admin_token()
        assert token, "Failed to get admin token"
        
        # Get all orders and find a cancelled one
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        orders = data.get('orders', data) if isinstance(data, dict) else data
        
        cancelled_order = None
        for order in orders:
            if order.get('order_status') == 'cancelled':
                cancelled_order = order
                break
        
        if not cancelled_order:
            pytest.skip("No cancelled orders available for testing")
        
        order_id = cancelled_order.get('order_id')
        response = self.session.get(f"{BASE_URL}/api/orders/{order_id}/can-cancel")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('can_cancel') == False
        assert data.get('current_status') == 'cancelled'
    
    def test_can_cancel_endpoint_returns_404_for_nonexistent_order(self):
        """Test GET /api/orders/{order_id}/can-cancel returns 404 for non-existent orders"""
        fake_order_id = f"ORD-FAKE{uuid.uuid4().hex[:8].upper()}"
        response = self.session.get(f"{BASE_URL}/api/orders/{fake_order_id}/can-cancel")
        
        assert response.status_code == 404
        assert 'detail' in response.json()
    
    def test_cancel_order_without_auth_returns_403(self):
        """Test POST /api/orders/{order_id}/cancel without auth returns 403"""
        token = self.get_admin_token()
        assert token, "Failed to get admin token"
        
        order = self.get_pending_order(token)
        if not order:
            pytest.skip("No pending orders available for testing")
        
        order_id = order.get('order_id')
        response = self.session.post(
            f"{BASE_URL}/api/orders/{order_id}/cancel",
            json={"reason": "Test cancel"}
        )
        
        assert response.status_code == 403
        assert 'autorisé' in response.json().get('detail', '').lower() or 'authorized' in response.json().get('detail', '').lower()
    
    def test_cancel_order_with_wrong_email_returns_403(self):
        """Test POST /api/orders/{order_id}/cancel with wrong email returns 403"""
        token = self.get_admin_token()
        assert token, "Failed to get admin token"
        
        order = self.get_pending_order(token)
        if not order:
            pytest.skip("No pending orders available for testing")
        
        order_id = order.get('order_id')
        response = self.session.post(
            f"{BASE_URL}/api/orders/{order_id}/cancel",
            json={"reason": "Test cancel", "email": "wrong@email.com"}
        )
        
        assert response.status_code == 403
        assert 'autorisé' in response.json().get('detail', '').lower() or 'authorized' in response.json().get('detail', '').lower()
    
    def test_cancel_order_with_correct_email_succeeds(self):
        """Test POST /api/orders/{order_id}/cancel with correct email succeeds"""
        token = self.get_admin_token()
        assert token, "Failed to get admin token"
        
        order = self.get_pending_order(token)
        if not order:
            pytest.skip("No pending orders available for testing")
        
        order_id = order.get('order_id')
        order_email = order.get('shipping', {}).get('email', self.test_email)
        
        response = self.session.post(
            f"{BASE_URL}/api/orders/{order_id}/cancel",
            json={"reason": "Changement d'avis", "email": order_email}
        )
        
        # Bug fixed: send_admin_notification function now exists
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'cancelled'
        assert data.get('order_id') == order_id
        assert 'message' in data
        
        # Verify order is now cancelled
        verify_response = self.session.get(f"{BASE_URL}/api/orders/{order_id}/can-cancel")
        assert verify_response.status_code == 200
        assert verify_response.json().get('can_cancel') == False
        assert verify_response.json().get('current_status') == 'cancelled'
    
    def test_cancel_already_cancelled_order_returns_400(self):
        """Test POST /api/orders/{order_id}/cancel for already cancelled order returns 400"""
        token = self.get_admin_token()
        assert token, "Failed to get admin token"
        
        # Get all orders and find a cancelled one
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        orders = data.get('orders', data) if isinstance(data, dict) else data
        
        cancelled_order = None
        for order in orders:
            if order.get('order_status') == 'cancelled':
                cancelled_order = order
                break
        
        if not cancelled_order:
            pytest.skip("No cancelled orders available for testing")
        
        order_id = cancelled_order.get('order_id')
        order_email = cancelled_order.get('shipping', {}).get('email', self.test_email)
        
        response = self.session.post(
            f"{BASE_URL}/api/orders/{order_id}/cancel",
            json={"reason": "Test cancel again", "email": order_email}
        )
        
        assert response.status_code == 400
        assert 'annulée' in response.json().get('detail', '').lower()
    
    def test_cancel_nonexistent_order_returns_404(self):
        """Test POST /api/orders/{order_id}/cancel for non-existent order returns 404"""
        fake_order_id = f"ORD-FAKE{uuid.uuid4().hex[:8].upper()}"
        response = self.session.post(
            f"{BASE_URL}/api/orders/{fake_order_id}/cancel",
            json={"reason": "Test cancel", "email": self.test_email}
        )
        
        assert response.status_code == 404
        assert 'trouvée' in response.json().get('detail', '').lower()


class TestOrderCancellationStatusValidation:
    """Test order cancellation for different order statuses"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.admin_email = "admin@yamaplus.com"
        self.admin_password = "Admin123!"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        """Get admin authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_can_cancel_returns_correct_status_for_confirmed_order(self):
        """Test can-cancel returns true for confirmed orders"""
        token = self.get_admin_token()
        assert token, "Failed to get admin token"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        orders = data.get('orders', data) if isinstance(data, dict) else data
        
        confirmed_order = None
        for order in orders:
            if order.get('order_status') == 'confirmed':
                confirmed_order = order
                break
        
        if not confirmed_order:
            pytest.skip("No confirmed orders available for testing")
        
        order_id = confirmed_order.get('order_id')
        response = self.session.get(f"{BASE_URL}/api/orders/{order_id}/can-cancel")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('can_cancel') == True
        assert data.get('current_status') == 'confirmed'

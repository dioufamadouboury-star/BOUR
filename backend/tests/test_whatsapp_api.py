"""
Tests for WhatsApp Cloud API Integration
Tests the /api/whatsapp/* endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture(autouse=True)
def rate_limit_delay():
    """Add delay between tests to avoid rate limiting"""
    yield
    time.sleep(0.5)


class TestWhatsAppStatus:
    """Test WhatsApp status endpoint"""
    
    def test_whatsapp_status_returns_200(self):
        """GET /api/whatsapp/status should return 200"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/status")
        assert response.status_code == 200
    
    def test_whatsapp_status_has_required_fields(self):
        """Status response should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/status")
        data = response.json()
        
        assert "configured" in data
        assert "api_version" in data
        assert "template_name" in data
        assert "template_language" in data
        assert "phone_configured" in data
    
    def test_whatsapp_status_configured_is_boolean(self):
        """configured field should be boolean"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/status")
        data = response.json()
        
        assert isinstance(data["configured"], bool)
    
    def test_whatsapp_status_api_version_format(self):
        """api_version should be in v{number}.{number} format"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/status")
        data = response.json()
        
        # Should be like "v23.0"
        assert data["api_version"].startswith("v")
    
    def test_whatsapp_status_template_language_is_french(self):
        """template_language should be 'fr' for French"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/status")
        data = response.json()
        
        assert data["template_language"] == "fr"


class TestWhatsAppPending:
    """Test WhatsApp pending notifications endpoint"""
    
    def test_pending_returns_200(self):
        """GET /api/whatsapp/pending should return 200"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/pending")
        assert response.status_code == 200
    
    def test_pending_has_notifications_array(self):
        """Response should have notifications array"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/pending")
        data = response.json()
        
        assert "notifications" in data
        assert isinstance(data["notifications"], list)
    
    def test_pending_has_count_field(self):
        """Response should have count field"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/pending")
        data = response.json()
        
        assert "count" in data
        assert isinstance(data["count"], int)
    
    def test_pending_count_matches_notifications_length(self):
        """count should match notifications array length"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/pending")
        data = response.json()
        
        assert data["count"] == len(data["notifications"])
    
    def test_pending_with_limit_parameter(self):
        """Should respect limit parameter"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/pending?limit=5")
        data = response.json()
        
        assert response.status_code == 200
        assert len(data["notifications"]) <= 5
    
    def test_pending_notification_structure(self):
        """Each notification should have required fields"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/pending?limit=1")
        data = response.json()
        
        if data["count"] > 0:
            notification = data["notifications"][0]
            # Check required fields
            assert "notification_id" in notification
            assert "type" in notification
            assert "order_id" in notification
            assert "phone" in notification
            assert "status" in notification
            assert "created_at" in notification
    
    def test_pending_notification_has_whatsapp_link(self):
        """Pending notifications should have whatsapp_link for manual sending"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/pending?limit=1")
        data = response.json()
        
        if data["count"] > 0:
            notification = data["notifications"][0]
            # Pending notifications should have whatsapp_link
            if notification["status"] == "pending":
                assert "whatsapp_link" in notification
                assert notification["whatsapp_link"].startswith("https://wa.me/")


class TestWhatsAppWebhook:
    """Test WhatsApp webhook verification endpoint"""
    
    def test_webhook_verification_without_params_fails(self):
        """GET /api/whatsapp/webhook without params should fail"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/webhook")
        # Should return 403 without proper verification params
        assert response.status_code == 403
    
    def test_webhook_verification_with_wrong_token_fails(self):
        """GET /api/whatsapp/webhook with wrong token should fail"""
        response = requests.get(
            f"{BASE_URL}/api/whatsapp/webhook",
            params={
                "hub.mode": "subscribe",
                "hub.challenge": "12345",
                "hub.verify_token": "wrong_token"
            }
        )
        assert response.status_code == 403
    
    def test_webhook_post_returns_ok(self):
        """POST /api/whatsapp/webhook should return ok"""
        response = requests.post(
            f"{BASE_URL}/api/whatsapp/webhook",
            json={"entry": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True


class TestWhatsAppMarkSent:
    """Test marking notifications as sent"""
    
    def test_mark_sent_nonexistent_returns_404(self):
        """POST /api/whatsapp/mark-sent/{id} with invalid ID should return 404"""
        response = requests.post(f"{BASE_URL}/api/whatsapp/mark-sent/NONEXISTENT-ID")
        assert response.status_code == 404


class TestWhatsAppIntegration:
    """Integration tests for WhatsApp notification flow"""
    
    def test_status_shows_not_configured_without_env_vars(self):
        """Without META_ACCESS_TOKEN, status should show configured=false"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/status")
        data = response.json()
        
        # In test environment, WhatsApp is not configured
        # This is expected behavior - fallback to manual queue
        assert data["configured"] == False
        assert data["phone_configured"] == False
    
    def test_pending_notifications_are_queued_for_manual_send(self):
        """When not configured, notifications should be queued for manual send"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/pending")
        data = response.json()
        
        # Check that pending notifications exist (from order confirmations)
        # These are queued for manual sending via WhatsApp Web
        if data["count"] > 0:
            for notification in data["notifications"]:
                assert notification["status"] == "pending"
                assert "whatsapp_link" in notification
                assert "message" in notification

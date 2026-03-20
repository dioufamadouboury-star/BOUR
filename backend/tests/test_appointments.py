"""
Test suite for Appointment System API
Tests: POST /api/appointments, GET /api/admin/appointments, PUT /api/admin/appointments/{id}, 
       GET /api/admin/appointments/stats, POST /api/admin/appointments/send-reminders
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@yamaplus.com"
ADMIN_PASSWORD = "Admin123!"


class TestAppointmentSystem:
    """Test appointment CRUD and admin operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data and authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.admin_token = token
        else:
            pytest.skip("Admin login failed - skipping authenticated tests")
        
        # Generate unique test data
        self.test_prefix = f"TEST_{uuid.uuid4().hex[:6]}"
        yield
        
        # Cleanup: Delete test appointments
        # Note: No explicit delete endpoint, appointments are left for manual cleanup

    # ============ CREATE APPOINTMENT TESTS ============
    
    def test_create_immobilier_appointment(self):
        """POST /api/appointments - Create immobilier appointment"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        payload = {
            "appointment_type": "immobilier",
            "property_id": "prop_test_123",
            "property_title": "Villa Luxe Dakar",
            "category": "immobilier",
            "name": f"{self.test_prefix}_Jean Dupont",
            "email": "test_immobilier@test.com",
            "phone": "+221771234567",
            "preferred_date": tomorrow,
            "preferred_time": "10:00",
            "message": "Test visite immobilier",
            "contact_method": "whatsapp"
        }
        
        response = self.session.post(f"{BASE_URL}/api/appointments", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "appointment_id" in data
        assert data["appointment_id"].startswith("rdv_")
        print(f"✅ Created immobilier appointment: {data['appointment_id']}")
        
        # Store for later tests
        self.immobilier_apt_id = data["appointment_id"]
        return data["appointment_id"]
    
    def test_create_automobile_appointment(self):
        """POST /api/appointments - Create automobile appointment"""
        tomorrow = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        payload = {
            "appointment_type": "automobile",
            "product_id": "prod_car_456",
            "product_name": "Mercedes Classe C 2024",
            "category": "automobile",
            "name": f"{self.test_prefix}_Marie Diallo",
            "email": "test_automobile@test.com",
            "phone": "+221776543210",
            "preferred_date": tomorrow,
            "preferred_time": "14:30",
            "message": "Test rendez-vous automobile",
            "contact_method": "email"
        }
        
        response = self.session.post(f"{BASE_URL}/api/appointments", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "appointment_id" in data
        print(f"✅ Created automobile appointment: {data['appointment_id']}")
        return data["appointment_id"]
    
    def test_create_general_appointment(self):
        """POST /api/appointments - Create general appointment (default type)"""
        tomorrow = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        payload = {
            "name": f"{self.test_prefix}_Test General",
            "email": "test_general@test.com",
            "phone": "+221770001122",
            "preferred_date": tomorrow,
            "preferred_time": "16:00",
            "contact_method": "whatsapp"
        }
        
        response = self.session.post(f"{BASE_URL}/api/appointments", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "appointment_id" in data
        print(f"✅ Created general appointment: {data['appointment_id']}")
        return data["appointment_id"]
    
    # ============ GET ADMIN APPOINTMENTS TESTS ============
    
    def test_get_all_appointments(self):
        """GET /api/admin/appointments - List all appointments"""
        response = self.session.get(f"{BASE_URL}/api/admin/appointments")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Retrieved {len(data)} appointments")
        
        # Verify each appointment has required fields
        if len(data) > 0:
            apt = data[0]
            assert "appointment_id" in apt
            assert "customer" in apt
            assert "status" in apt
            print(f"✅ First appointment structure valid: {apt['appointment_id']}")
    
    def test_filter_appointments_by_type_immobilier(self):
        """GET /api/admin/appointments?appointment_type=immobilier"""
        response = self.session.get(f"{BASE_URL}/api/admin/appointments?appointment_type=immobilier")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned are immobilier type
        for apt in data:
            assert apt.get("appointment_type") == "immobilier", f"Expected immobilier, got {apt.get('appointment_type')}"
        
        print(f"✅ Filtered {len(data)} immobilier appointments")
    
    def test_filter_appointments_by_type_automobile(self):
        """GET /api/admin/appointments?appointment_type=automobile"""
        response = self.session.get(f"{BASE_URL}/api/admin/appointments?appointment_type=automobile")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all returned are automobile type
        for apt in data:
            assert apt.get("appointment_type") == "automobile", f"Expected automobile, got {apt.get('appointment_type')}"
        
        print(f"✅ Filtered {len(data)} automobile appointments")
    
    def test_filter_appointments_by_type_general(self):
        """GET /api/admin/appointments?appointment_type=general"""
        response = self.session.get(f"{BASE_URL}/api/admin/appointments?appointment_type=general")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Filtered {len(data)} general appointments")
    
    # ============ UPDATE APPOINTMENT TESTS ============
    
    def test_confirm_appointment_with_address_contact(self):
        """PUT /api/admin/appointments/{id} - Confirm with meeting_address and meeting_contact"""
        # First create an appointment to update
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        create_payload = {
            "appointment_type": "immobilier",
            "property_id": "prop_update_test",
            "property_title": "Appartement Plateau Test",
            "name": f"{self.test_prefix}_Update Test",
            "email": "update_test@test.com",
            "phone": "+221779998877",
            "preferred_date": tomorrow,
            "preferred_time": "11:00",
            "contact_method": "whatsapp"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/appointments", json=create_payload)
        assert create_response.status_code == 200
        apt_id = create_response.json()["appointment_id"]
        print(f"Created appointment for update test: {apt_id}")
        
        # Now confirm with address and contact
        update_payload = {
            "status": "confirmed",
            "confirmed_date": tomorrow,
            "confirmed_time": "11:00",
            "meeting_address": "123 Rue du Plateau, Dakar",
            "meeting_contact": "Mamadou - 77 888 99 00",
            "send_whatsapp": False  # Don't actually send WhatsApp in test
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/admin/appointments/{apt_id}", json=update_payload)
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        data = update_response.json()
        assert data.get("message") == "Rendez-vous mis à jour"
        print(f"✅ Confirmed appointment {apt_id} with address and contact")
        
        # Verify the update persisted by fetching appointments
        get_response = self.session.get(f"{BASE_URL}/api/admin/appointments")
        assert get_response.status_code == 200
        appointments = get_response.json()
        
        updated_apt = next((a for a in appointments if a["appointment_id"] == apt_id), None)
        assert updated_apt is not None, "Could not find updated appointment"
        assert updated_apt["status"] == "confirmed", f"Expected 'confirmed', got '{updated_apt['status']}'"
        assert updated_apt.get("meeting_address") == "123 Rue du Plateau, Dakar", f"meeting_address not persisted"
        assert updated_apt.get("meeting_contact") == "Mamadou - 77 888 99 00", f"meeting_contact not persisted"
        print(f"✅ Verified meeting_address and meeting_contact persisted correctly")
    
    def test_update_appointment_not_found(self):
        """PUT /api/admin/appointments/{id} - Non-existent appointment returns 404"""
        response = self.session.put(f"{BASE_URL}/api/admin/appointments/rdv_nonexistent123", json={
            "status": "confirmed"
        })
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Non-existent appointment returns 404")
    
    # ============ STATS ENDPOINT TEST ============
    
    def test_get_appointments_stats(self):
        """GET /api/admin/appointments/stats"""
        response = self.session.get(f"{BASE_URL}/api/admin/appointments/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify stats structure
        assert "total" in data, "Missing 'total' in stats"
        assert "pending" in data, "Missing 'pending' in stats"
        assert "confirmed" in data, "Missing 'confirmed' in stats"
        assert "completed" in data, "Missing 'completed' in stats"
        assert "cancelled" in data, "Missing 'cancelled' in stats"
        
        # Verify values are integers
        assert isinstance(data["total"], int)
        assert isinstance(data["pending"], int)
        
        print(f"✅ Stats: total={data['total']}, pending={data['pending']}, confirmed={data['confirmed']}")
    
    # ============ SEND REMINDERS TEST ============
    
    def test_manual_send_reminders(self):
        """POST /api/admin/appointments/send-reminders - Manual trigger"""
        response = self.session.post(f"{BASE_URL}/api/admin/appointments/send-reminders")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✅ Manual reminders triggered: {data['message']}")
    
    # ============ AUTH TESTS ============
    
    def test_admin_endpoints_require_auth(self):
        """Admin endpoints reject unauthenticated requests"""
        unauthenticated = requests.Session()
        unauthenticated.headers.update({"Content-Type": "application/json"})
        
        # Test admin appointments list
        response = unauthenticated.get(f"{BASE_URL}/api/admin/appointments")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Test admin stats
        response = unauthenticated.get(f"{BASE_URL}/api/admin/appointments/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Test update endpoint
        response = unauthenticated.put(f"{BASE_URL}/api/admin/appointments/rdv_test", json={"status": "confirmed"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        print("✅ All admin endpoints correctly require authentication")


class TestAppointmentValidation:
    """Test appointment input validation"""
    
    def test_create_appointment_missing_required_fields(self):
        """POST /api/appointments - Missing required fields returns 422"""
        payload = {
            "appointment_type": "immobilier"
            # Missing name, email, phone, preferred_date, preferred_time
        }
        
        response = requests.post(f"{BASE_URL}/api/appointments", json=payload)
        
        # FastAPI returns 422 for validation errors
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
        print("✅ Missing required fields returns 422 validation error")
    
    def test_create_appointment_invalid_email(self):
        """POST /api/appointments - Invalid email format returns 422"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        payload = {
            "appointment_type": "immobilier",
            "name": "Test Invalid Email",
            "email": "not-a-valid-email",
            "phone": "+221771234567",
            "preferred_date": tomorrow,
            "preferred_time": "10:00"
        }
        
        response = requests.post(f"{BASE_URL}/api/appointments", json=payload)
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
        print("✅ Invalid email format returns 422 validation error")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])

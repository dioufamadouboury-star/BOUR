"""
Tests for Custom Requests API
- Vehicle requests
- Sofa orders
- Reupholstery quotes
- Admin endpoints
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestVehicleRequests:
    """Test vehicle request endpoints"""
    
    def test_create_vehicle_request_success(self):
        """Test creating a vehicle request with valid data"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "brand": "Toyota",
            "model": "Land Cruiser",
            "year_min": "2020",
            "year_max": "2024",
            "budget_min": "15000000",
            "budget_max": "25000000",
            "km_max": "50000",
            "fuel": "Diesel",
            "transmission": "Automatique",
            "color": "Noir",
            "customs_status": "sous_douane",
            "desired_date": "2026-06-01",
            "full_name": f"TEST_User_{unique_id}",
            "phone": "+221771234567",
            "whatsapp": "+221771234567",
            "address": "Almadies",
            "city": "Dakar",
            "comments": "Test request",
            "reference_images": []
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/vehicle", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "request_number" in data
        assert data["request_number"].startswith("VEH-")
        assert "message" in data
        
        # Store for cleanup
        self.vehicle_request_number = data["request_number"]
        return data["request_number"]
    
    def test_create_vehicle_request_minimal(self):
        """Test creating vehicle request with minimal required fields"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "brand": "Honda",
            "full_name": f"TEST_Minimal_{unique_id}",
            "phone": "+221770000000",
            "city": "Dakar"
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/vehicle", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["request_number"].startswith("VEH-")
    
    def test_create_vehicle_request_dedouane(self):
        """Test creating vehicle request with dedouane customs status"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "brand": "Mercedes-Benz",
            "model": "GLE",
            "customs_status": "dedouane",
            "full_name": f"TEST_Dedouane_{unique_id}",
            "phone": "+221771111111",
            "city": "Dakar"
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/vehicle", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
    
    def test_create_vehicle_request_missing_brand(self):
        """Test that brand is required"""
        payload = {
            "full_name": "Test User",
            "phone": "+221770000000",
            "city": "Dakar"
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/vehicle", json=payload)
        assert response.status_code == 422  # Validation error


class TestSofaRequests:
    """Test sofa order request endpoints"""
    
    def test_create_sofa_request_success(self):
        """Test creating a sofa request with valid data"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "sofa_type": "Canapé d'angle",
            "width": "300",
            "depth": "180",
            "height": "85",
            "seat_height": "45",
            "fabric": "Velours",
            "color": "Gris",
            "cushion_type": "Mousse haute densité",
            "quantity": "1",
            "with_armrests": True,
            "with_headrests": True,
            "with_storage": False,
            "full_name": f"TEST_Sofa_{unique_id}",
            "phone": "+221772222222",
            "whatsapp": "",
            "address": "Point E",
            "city": "Dakar",
            "budget_range": "400000-600000",
            "comments": "Test sofa order",
            "reference_images": []
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/sofa", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "request_number" in data
        assert data["request_number"].startswith("SAL-")
        assert "message" in data
        
        return data["request_number"]
    
    def test_create_sofa_request_minimal(self):
        """Test creating sofa request with minimal required fields"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "sofa_type": "Canapé 3 places",
            "full_name": f"TEST_SofaMin_{unique_id}",
            "phone": "+221773333333",
            "city": "Dakar"
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/sofa", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["request_number"].startswith("SAL-")
    
    def test_create_sofa_request_with_all_options(self):
        """Test creating sofa request with all options enabled"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "sofa_type": "Canapé convertible",
            "with_armrests": True,
            "with_headrests": True,
            "with_storage": True,
            "full_name": f"TEST_SofaOpts_{unique_id}",
            "phone": "+221774444444",
            "city": "Dakar"
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/sofa", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True


class TestReupholsteryRequests:
    """Test reupholstery quote request endpoints"""
    
    def test_create_reupholstery_request_success(self):
        """Test creating a reupholstery request with valid data"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "furniture_type": "Canapé",
            "service_type": "rehoussage",
            "piece_count": "2",
            "fabric_preference": "Velours",
            "current_condition": "Tissu usé, quelques taches",
            "pickup_needed": True,
            "full_name": f"TEST_Reup_{unique_id}",
            "phone": "+221775555555",
            "whatsapp": "",
            "address": "Mermoz",
            "city": "Dakar",
            "urgency": "normal",
            "comments": "Test reupholstery request",
            "photos": ["/uploads/test.jpg"]
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/reupholstery", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "request_number" in data
        assert data["request_number"].startswith("REH-")
        assert "message" in data
        
        return data["request_number"]
    
    def test_create_reupholstery_request_urgent(self):
        """Test creating urgent reupholstery request"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "furniture_type": "Fauteuil",
            "service_type": "reparation",
            "piece_count": "1",
            "pickup_needed": False,
            "full_name": f"TEST_ReupUrg_{unique_id}",
            "phone": "+221776666666",
            "address": "Plateau",
            "city": "Dakar",
            "urgency": "urgent"
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/reupholstery", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["request_number"].startswith("REH-")
    
    def test_create_reupholstery_request_express(self):
        """Test creating express reupholstery request"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "furniture_type": "Chaise",
            "service_type": "rembourrage",
            "piece_count": "6",
            "pickup_needed": True,
            "full_name": f"TEST_ReupExp_{unique_id}",
            "phone": "+221777777777",
            "address": "Sacré Coeur",
            "city": "Dakar",
            "urgency": "express"
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-requests/reupholstery", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True


class TestTrackRequest:
    """Test request tracking endpoint"""
    
    def test_track_existing_request(self):
        """Test tracking an existing request"""
        # First create a request
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "brand": "BMW",
            "full_name": f"TEST_Track_{unique_id}",
            "phone": "+221778888888",
            "city": "Dakar"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/custom-requests/vehicle", json=payload)
        assert create_response.status_code == 200
        request_number = create_response.json()["request_number"]
        
        # Now track it
        track_response = requests.get(f"{BASE_URL}/api/custom-requests/track/{request_number}")
        assert track_response.status_code == 200
        
        data = track_response.json()
        assert data["request_number"] == request_number
        assert data["request_type"] == "vehicle"
        assert data["status"] == "pending"
        assert "created_at" in data
        assert data["quote_sent"] is False
    
    def test_track_nonexistent_request(self):
        """Test tracking a non-existent request returns 404"""
        response = requests.get(f"{BASE_URL}/api/custom-requests/track/FAKE-12345678")
        assert response.status_code == 404


class TestAdminEndpoints:
    """Test admin endpoints for custom requests"""
    
    def test_admin_list_all_requests(self):
        """Test listing all custom requests"""
        response = requests.get(f"{BASE_URL}/api/custom-requests/admin/list")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "requests" in data
        assert isinstance(data["requests"], list)
    
    def test_admin_list_filter_by_type_vehicle(self):
        """Test filtering requests by vehicle type"""
        response = requests.get(f"{BASE_URL}/api/custom-requests/admin/list?request_type=vehicle")
        assert response.status_code == 200
        
        data = response.json()
        for req in data["requests"]:
            assert req["request_type"] == "vehicle"
    
    def test_admin_list_filter_by_type_sofa(self):
        """Test filtering requests by sofa type"""
        response = requests.get(f"{BASE_URL}/api/custom-requests/admin/list?request_type=sofa")
        assert response.status_code == 200
        
        data = response.json()
        for req in data["requests"]:
            assert req["request_type"] == "sofa"
    
    def test_admin_list_filter_by_type_reupholstery(self):
        """Test filtering requests by reupholstery type"""
        response = requests.get(f"{BASE_URL}/api/custom-requests/admin/list?request_type=reupholstery")
        assert response.status_code == 200
        
        data = response.json()
        for req in data["requests"]:
            assert req["request_type"] == "reupholstery"
    
    def test_admin_list_filter_by_status(self):
        """Test filtering requests by status"""
        response = requests.get(f"{BASE_URL}/api/custom-requests/admin/list?status=pending")
        assert response.status_code == 200
        
        data = response.json()
        for req in data["requests"]:
            assert req["status"] == "pending"
    
    def test_admin_stats(self):
        """Test admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/custom-requests/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "vehicle" in data
        assert "sofa" in data
        assert "reupholstery" in data
        
        # Check vehicle stats structure
        assert "total" in data["vehicle"]
        assert "pending" in data["vehicle"]
        
        # Check sofa stats structure
        assert "total" in data["sofa"]
        assert "pending" in data["sofa"]
        
        # Check reupholstery stats structure
        assert "total" in data["reupholstery"]
        assert "pending" in data["reupholstery"]
    
    def test_admin_get_request_details(self):
        """Test getting full details of a request"""
        # First create a request
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "brand": "Audi",
            "model": "Q7",
            "full_name": f"TEST_Details_{unique_id}",
            "phone": "+221779999999",
            "city": "Dakar"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/custom-requests/vehicle", json=payload)
        assert create_response.status_code == 200
        request_number = create_response.json()["request_number"]
        
        # Get details
        details_response = requests.get(f"{BASE_URL}/api/custom-requests/admin/{request_number}")
        assert details_response.status_code == 200
        
        data = details_response.json()
        assert data["request_number"] == request_number
        assert data["brand"] == "Audi"
        assert data["model"] == "Q7"
        assert data["full_name"] == f"TEST_Details_{unique_id}"
        assert data["status"] == "pending"
        assert "admin_notes" in data
    
    def test_admin_get_nonexistent_request(self):
        """Test getting details of non-existent request returns 404"""
        response = requests.get(f"{BASE_URL}/api/custom-requests/admin/FAKE-99999999")
        assert response.status_code == 404
    
    def test_admin_update_status(self):
        """Test updating request status"""
        # First create a request
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "brand": "Porsche",
            "full_name": f"TEST_Status_{unique_id}",
            "phone": "+221770101010",
            "city": "Dakar"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/custom-requests/vehicle", json=payload)
        assert create_response.status_code == 200
        request_number = create_response.json()["request_number"]
        
        # Update status
        update_payload = {
            "status": "searching",
            "admin_notes": "Started searching for vehicle"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/custom-requests/admin/{request_number}/status",
            json=update_payload
        )
        assert update_response.status_code == 200
        
        data = update_response.json()
        assert data["success"] is True
        
        # Verify the update
        details_response = requests.get(f"{BASE_URL}/api/custom-requests/admin/{request_number}")
        details = details_response.json()
        assert details["status"] == "searching"
        assert details["admin_notes"] == "Started searching for vehicle"
    
    def test_admin_update_status_with_quote(self):
        """Test updating status with quote amount"""
        # First create a sofa request
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "sofa_type": "Canapé 2 places",
            "full_name": f"TEST_Quote_{unique_id}",
            "phone": "+221770202020",
            "city": "Dakar"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/custom-requests/sofa", json=payload)
        assert create_response.status_code == 200
        request_number = create_response.json()["request_number"]
        
        # Update with quote
        update_payload = {
            "status": "quoted",
            "quote_amount": 350000,
            "admin_notes": "Quote sent to customer"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/custom-requests/admin/{request_number}/status",
            json=update_payload
        )
        assert update_response.status_code == 200
        
        # Verify the update
        details_response = requests.get(f"{BASE_URL}/api/custom-requests/admin/{request_number}")
        details = details_response.json()
        assert details["status"] == "quoted"
        assert details["quote_amount"] == 350000
        assert details["quote_sent"] is True
    
    def test_admin_update_nonexistent_request(self):
        """Test updating non-existent request returns 404"""
        update_payload = {"status": "searching"}
        response = requests.put(
            f"{BASE_URL}/api/custom-requests/admin/FAKE-88888888/status",
            json=update_payload
        )
        assert response.status_code == 404


class TestProposeVehicle:
    """Test vehicle proposal endpoint"""
    
    def test_propose_vehicle_success(self):
        """Test proposing a vehicle to a request"""
        # First create a vehicle request
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "brand": "Lexus",
            "model": "RX",
            "full_name": f"TEST_Propose_{unique_id}",
            "phone": "+221770303030",
            "city": "Dakar"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/custom-requests/vehicle", json=payload)
        assert create_response.status_code == 200
        request_number = create_response.json()["request_number"]
        
        # Propose a vehicle
        vehicle_payload = {
            "title": "Lexus RX 350 2022",
            "price": 18000000,
            "price_type": "sous_douane",
            "images": ["/uploads/lexus1.jpg"],
            "specs": {
                "year": 2022,
                "km": 25000,
                "fuel": "Essence"
            },
            "notes": "Excellent condition, low mileage"
        }
        
        propose_response = requests.post(
            f"{BASE_URL}/api/custom-requests/admin/{request_number}/propose-vehicle",
            json=vehicle_payload
        )
        assert propose_response.status_code == 200
        
        data = propose_response.json()
        assert data["success"] is True
        
        # Verify the proposal was added
        details_response = requests.get(f"{BASE_URL}/api/custom-requests/admin/{request_number}")
        details = details_response.json()
        assert details["status"] == "found"
        assert len(details["proposed_vehicles"]) == 1
        assert details["proposed_vehicles"][0]["title"] == "Lexus RX 350 2022"
        assert details["proposed_vehicles"][0]["price"] == 18000000
    
    def test_propose_vehicle_to_sofa_request_fails(self):
        """Test that proposing vehicle to sofa request fails"""
        # First create a sofa request
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "sofa_type": "Fauteuil",
            "full_name": f"TEST_PropFail_{unique_id}",
            "phone": "+221770404040",
            "city": "Dakar"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/custom-requests/sofa", json=payload)
        assert create_response.status_code == 200
        request_number = create_response.json()["request_number"]
        
        # Try to propose a vehicle
        vehicle_payload = {
            "title": "Test Vehicle",
            "price": 10000000,
            "price_type": "sous_douane"
        }
        
        propose_response = requests.post(
            f"{BASE_URL}/api/custom-requests/admin/{request_number}/propose-vehicle",
            json=vehicle_payload
        )
        assert propose_response.status_code == 400
    
    def test_propose_vehicle_to_nonexistent_request(self):
        """Test proposing vehicle to non-existent request returns 404"""
        vehicle_payload = {
            "title": "Test Vehicle",
            "price": 10000000,
            "price_type": "sous_douane"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/custom-requests/admin/FAKE-77777777/propose-vehicle",
            json=vehicle_payload
        )
        assert response.status_code == 404

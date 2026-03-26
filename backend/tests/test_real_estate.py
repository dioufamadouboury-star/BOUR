"""
Backend tests for Real Estate (Immobilier) module
Tests property CRUD operations, image handling, and admin endpoints
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://subcats-preview.preview.emergentagent.com')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def auth_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@yamaplus.com",
        "password": "Admin123!"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed — skipping authenticated tests")

@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestPublicPropertyEndpoints:
    """Test public property endpoints"""
    
    def test_get_properties_list(self, api_client):
        """GET /api/properties - List available properties"""
        response = api_client.get(f"{BASE_URL}/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
        assert "total" in data
        assert isinstance(data["properties"], list)
    
    def test_get_properties_with_filters(self, api_client):
        """GET /api/properties with listing_type filter"""
        response = api_client.get(f"{BASE_URL}/api/properties?listing_type=rent_long")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
        # All returned properties should have listing_type=rent_long
        for prop in data["properties"]:
            assert prop.get("listing_type") == "rent_long"
    
    def test_get_featured_properties(self, api_client):
        """GET /api/properties/featured - Get featured properties"""
        response = api_client.get(f"{BASE_URL}/api/properties/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_property_stats(self, api_client):
        """GET /api/properties/stats - Get property statistics"""
        response = api_client.get(f"{BASE_URL}/api/properties/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "by_listing_type" in data
        assert "cities" in data
    
    def test_get_single_property(self, api_client):
        """GET /api/properties/{id} - Get single property details"""
        # First get list to find a property ID
        list_response = api_client.get(f"{BASE_URL}/api/properties?limit=1")
        assert list_response.status_code == 200
        properties = list_response.json().get("properties", [])
        
        if not properties:
            pytest.skip("No properties available to test")
        
        property_id = properties[0]["property_id"]
        response = api_client.get(f"{BASE_URL}/api/properties/{property_id}")
        assert response.status_code == 200
        data = response.json()
        assert "property" in data
        assert data["property"]["property_id"] == property_id
    
    def test_get_nonexistent_property(self, api_client):
        """GET /api/properties/{id} - 404 for non-existent property"""
        response = api_client.get(f"{BASE_URL}/api/properties/nonexistent_id_12345")
        assert response.status_code == 404


class TestAdminPropertyEndpoints:
    """Test admin property endpoints (require authentication)"""
    
    def test_admin_get_properties(self, authenticated_client):
        """GET /api/admin/properties - List all properties for admin"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/properties")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
        assert "total" in data
    
    def test_admin_get_properties_with_filter(self, authenticated_client):
        """GET /api/admin/properties with listing_type filter"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/properties?listing_type=sale")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
    
    def test_admin_create_property(self, authenticated_client):
        """POST /api/admin/properties - Create new property"""
        unique_id = uuid.uuid4().hex[:8]
        property_data = {
            "title": f"TEST_Property_{unique_id}",
            "description": "Test property for automated testing",
            "property_type": "apartment",
            "listing_type": "rent_long",
            "price": 150000,
            "price_period": "per_month",
            "location_city": "Dakar",
            "location_area": "Plateau",
            "surface": 80,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
            "amenities": ["WiFi", "Climatisation", "Parking"],
            "is_furnished": True,
            "is_available": True,
            "contact_phone": "+221783827575",
            "contact_name": "Test Contact",
            "featured": False
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/admin/properties", json=property_data)
        assert response.status_code == 200
        data = response.json()
        assert "property_id" in data
        assert data["title"] == property_data["title"]
        assert data["images"] == property_data["images"]
        assert len(data["images"]) == 2
        
        # Cleanup - delete the test property
        property_id = data["property_id"]
        authenticated_client.delete(f"{BASE_URL}/api/admin/properties/{property_id}")
    
    def test_admin_create_property_with_max_images(self, authenticated_client):
        """POST /api/admin/properties - Create property with 6 images (max allowed)"""
        unique_id = uuid.uuid4().hex[:8]
        property_data = {
            "title": f"TEST_MaxImages_{unique_id}",
            "description": "Test property with maximum images",
            "property_type": "villa",
            "listing_type": "sale",
            "price": 250000000,
            "location_city": "Dakar",
            "images": [
                "https://example.com/img1.jpg",
                "https://example.com/img2.jpg",
                "https://example.com/img3.jpg",
                "https://example.com/img4.jpg",
                "https://example.com/img5.jpg",
                "https://example.com/img6.jpg"
            ],
            "amenities": ["Piscine", "Jardin"],
            "is_available": True
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/admin/properties", json=property_data)
        assert response.status_code == 200
        data = response.json()
        assert len(data["images"]) == 6
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/admin/properties/{data['property_id']}")
    
    def test_admin_update_property_images(self, authenticated_client):
        """PUT /api/admin/properties/{id} - Update property images"""
        # First create a property
        unique_id = uuid.uuid4().hex[:8]
        create_data = {
            "title": f"TEST_UpdateImages_{unique_id}",
            "description": "Test property for image update",
            "property_type": "apartment",
            "listing_type": "rent_long",
            "price": 100000,
            "location_city": "Dakar",
            "images": ["https://example.com/original.jpg"],
            "is_available": True
        }
        
        create_response = authenticated_client.post(f"{BASE_URL}/api/admin/properties", json=create_data)
        assert create_response.status_code == 200
        property_id = create_response.json()["property_id"]
        
        # Update with new images
        update_data = {
            "images": [
                "https://example.com/new1.jpg",
                "https://example.com/new2.jpg",
                "https://example.com/new3.jpg"
            ]
        }
        
        update_response = authenticated_client.put(f"{BASE_URL}/api/admin/properties/{property_id}", json=update_data)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = authenticated_client.get(f"{BASE_URL}/api/properties/{property_id}")
        assert get_response.status_code == 200
        updated_property = get_response.json()["property"]
        assert len(updated_property["images"]) == 3
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/admin/properties/{property_id}")
    
    def test_admin_delete_property(self, authenticated_client):
        """DELETE /api/admin/properties/{id} - Delete property"""
        # First create a property
        unique_id = uuid.uuid4().hex[:8]
        create_data = {
            "title": f"TEST_Delete_{unique_id}",
            "description": "Test property for deletion",
            "property_type": "studio",
            "listing_type": "rent_short",
            "price": 25000,
            "location_city": "Saly",
            "is_available": True
        }
        
        create_response = authenticated_client.post(f"{BASE_URL}/api/admin/properties", json=create_data)
        assert create_response.status_code == 200
        property_id = create_response.json()["property_id"]
        
        # Delete the property
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/admin/properties/{property_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = authenticated_client.get(f"{BASE_URL}/api/properties/{property_id}")
        assert get_response.status_code == 404
    
    def test_admin_toggle_featured(self, authenticated_client):
        """PUT /api/admin/properties/{id}/toggle-featured - Toggle featured status"""
        # Get first property
        list_response = authenticated_client.get(f"{BASE_URL}/api/admin/properties?limit=1")
        properties = list_response.json().get("properties", [])
        
        if not properties:
            pytest.skip("No properties available to test")
        
        property_id = properties[0]["property_id"]
        original_featured = properties[0].get("featured", False)
        
        # Toggle featured
        response = authenticated_client.put(f"{BASE_URL}/api/admin/properties/{property_id}/toggle-featured")
        assert response.status_code == 200
        data = response.json()
        assert data["featured"] == (not original_featured)
        
        # Toggle back
        authenticated_client.put(f"{BASE_URL}/api/admin/properties/{property_id}/toggle-featured")
    
    def test_admin_toggle_availability(self, authenticated_client):
        """PUT /api/admin/properties/{id}/toggle-availability - Toggle availability"""
        # Get first property
        list_response = authenticated_client.get(f"{BASE_URL}/api/admin/properties?limit=1")
        properties = list_response.json().get("properties", [])
        
        if not properties:
            pytest.skip("No properties available to test")
        
        property_id = properties[0]["property_id"]
        original_available = properties[0].get("is_available", True)
        
        # Toggle availability
        response = authenticated_client.put(f"{BASE_URL}/api/admin/properties/{property_id}/toggle-availability")
        assert response.status_code == 200
        data = response.json()
        assert data["is_available"] == (not original_available)
        
        # Toggle back
        authenticated_client.put(f"{BASE_URL}/api/admin/properties/{property_id}/toggle-availability")


class TestAdminAuthRequired:
    """Test that admin endpoints require authentication"""
    
    def test_admin_properties_requires_auth(self, api_client):
        """GET /api/admin/properties - 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/admin/properties")
        assert response.status_code == 401
    
    def test_admin_create_requires_auth(self, api_client):
        """POST /api/admin/properties - 401 without auth"""
        response = api_client.post(f"{BASE_URL}/api/admin/properties", json={
            "title": "Test",
            "description": "Test",
            "property_type": "apartment",
            "listing_type": "rent_long",
            "price": 100000,
            "location_city": "Dakar"
        })
        assert response.status_code == 401

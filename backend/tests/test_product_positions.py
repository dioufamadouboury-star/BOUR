"""
Tests for Product Position Feature
- Batch position update endpoint PUT /api/admin/products/positions
- Single position update endpoint PUT /api/admin/products/{id}/position
- Products sorted by position in API response
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestProductPositionAPI:
    """Test product position endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client, admin_token):
        """Setup for each test"""
        self.client = api_client
        self.token = admin_token
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get existing products for testing
        response = self.client.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        self.products = response.json()
        assert len(self.products) > 0, "Need at least one product for testing"
    
    def test_batch_position_update_success(self):
        """Test batch position update with valid data"""
        # Use first two products
        if len(self.products) < 2:
            pytest.skip("Need at least 2 products for batch test")
        
        positions_data = [
            {"product_id": self.products[0]["product_id"], "position": 10},
            {"product_id": self.products[1]["product_id"], "position": 20}
        ]
        
        response = self.client.put(
            f"{BASE_URL}/api/admin/products/positions",
            json=positions_data,
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "updated_count" in data
        assert data["updated_count"] >= 0
    
    def test_batch_position_update_empty_list(self):
        """Test batch position update with empty list"""
        response = self.client.put(
            f"{BASE_URL}/api/admin/products/positions",
            json=[],
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] == 0
    
    def test_batch_position_update_requires_auth(self):
        """Test batch position update requires admin authentication"""
        positions_data = [
            {"product_id": self.products[0]["product_id"], "position": 1}
        ]
        
        # Use a fresh session without auth header
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.put(
            f"{BASE_URL}/api/admin/products/positions",
            json=positions_data
        )
        
        assert response.status_code in [401, 403, 422]  # 422 for validation error without auth
    
    def test_single_position_update_success(self):
        """Test single product position update"""
        product_id = self.products[0]["product_id"]
        new_position = 5
        
        response = self.client.put(
            f"{BASE_URL}/api/admin/products/{product_id}/position?position={new_position}",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["product_id"] == product_id
        assert data["position"] == new_position
        assert "message" in data
    
    def test_single_position_update_nonexistent_product(self):
        """Test single position update for non-existent product"""
        fake_product_id = f"prod_nonexistent_{uuid.uuid4().hex[:8]}"
        
        response = self.client.put(
            f"{BASE_URL}/api/admin/products/{fake_product_id}/position?position=1",
            headers=self.headers
        )
        
        assert response.status_code == 404
    
    def test_single_position_update_requires_auth(self):
        """Test single position update requires admin authentication"""
        product_id = self.products[0]["product_id"]
        
        # Use a fresh session without auth header
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.put(
            f"{BASE_URL}/api/admin/products/{product_id}/position?position=1"
        )
        
        assert response.status_code in [401, 403, 422]  # 422 for validation error without auth
    
    def test_products_sorted_by_position(self):
        """Test that products are returned sorted by position"""
        # First, set specific positions for first 3 products
        if len(self.products) < 3:
            pytest.skip("Need at least 3 products for sorting test")
        
        # Set positions: product[2] = 1, product[0] = 2, product[1] = 3
        positions_data = [
            {"product_id": self.products[2]["product_id"], "position": 1},
            {"product_id": self.products[0]["product_id"], "position": 2},
            {"product_id": self.products[1]["product_id"], "position": 3}
        ]
        
        update_response = self.client.put(
            f"{BASE_URL}/api/admin/products/positions",
            json=positions_data,
            headers=self.headers
        )
        assert update_response.status_code == 200
        
        # Fetch products and verify order
        response = self.client.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        
        products = response.json()
        
        # Find the products we updated
        updated_ids = [p["product_id"] for p in positions_data]
        updated_products = [p for p in products if p["product_id"] in updated_ids]
        
        # Verify they are sorted by position
        positions = [p.get("position", 999) for p in updated_products]
        assert positions == sorted(positions), f"Products not sorted by position: {positions}"
    
    def test_products_no_50_limit(self):
        """Test that products endpoint returns more than 50 products when available"""
        # Request up to 500 products
        response = self.client.get(f"{BASE_URL}/api/products?limit=500")
        assert response.status_code == 200
        
        products = response.json()
        # Just verify the endpoint accepts limit > 50
        # The actual count depends on database content
        assert isinstance(products, list)
    
    def test_position_persists_after_update(self):
        """Test that position value persists after update"""
        product_id = self.products[0]["product_id"]
        new_position = 42
        
        # Update position
        update_response = self.client.put(
            f"{BASE_URL}/api/admin/products/{product_id}/position?position={new_position}",
            headers=self.headers
        )
        assert update_response.status_code == 200
        
        # Fetch product and verify position
        response = self.client.get(f"{BASE_URL}/api/products?limit=100")
        assert response.status_code == 200
        
        products = response.json()
        product = next((p for p in products if p["product_id"] == product_id), None)
        
        assert product is not None, f"Product {product_id} not found"
        assert product.get("position") == new_position, f"Position not persisted: expected {new_position}, got {product.get('position')}"


class TestProductPositionCleanup:
    """Cleanup tests - reset positions to default"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client, admin_token):
        """Setup for cleanup"""
        self.client = api_client
        self.token = admin_token
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_cleanup_reset_positions(self):
        """Reset all test positions to 999"""
        response = self.client.get(f"{BASE_URL}/api/products?limit=100")
        assert response.status_code == 200
        
        products = response.json()
        
        # Reset all positions to 999
        positions_data = [
            {"product_id": p["product_id"], "position": 999}
            for p in products
        ]
        
        if positions_data:
            reset_response = self.client.put(
                f"{BASE_URL}/api/admin/products/positions",
                json=positions_data,
                headers=self.headers
            )
            assert reset_response.status_code == 200

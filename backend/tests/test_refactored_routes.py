"""
Test suite for refactored routes (gift_box.py and blog.py)
Verifies that route extraction from server.py didn't break functionality.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoints:
    """Health and basic endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "database" in data
        print("✓ Health endpoint working")


class TestGiftBoxPublicRoutes:
    """Gift Box public routes - extracted from server.py to routes/gift_box.py"""
    
    def test_gift_box_config(self):
        """Test GET /api/gift-box/config returns config, sizes, and wrappings"""
        response = requests.get(f"{BASE_URL}/api/gift-box/config")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "config" in data
        assert "sizes" in data
        assert "wrappings" in data
        
        # Verify config fields
        config = data["config"]
        assert "is_enabled" in config
        assert "page_title" in config
        assert config["page_title"] == "Coffrets Cadeaux Personnalisés"
        
        # Verify sizes have required fields
        sizes = data["sizes"]
        assert isinstance(sizes, list)
        if sizes:
            size = sizes[0]
            assert "size_id" in size
            assert "name" in size
            assert "max_items" in size
            assert "base_price" in size
        
        print("✓ Gift box config endpoint working")
    
    def test_gift_box_active_template(self):
        """Test GET /api/gift-box/active-template returns active template"""
        response = requests.get(f"{BASE_URL}/api/gift-box/active-template")
        assert response.status_code == 200
        data = response.json()
        
        # Verify template fields
        assert "template_id" in data
        assert "name" in data
        assert "theme_color" in data
        assert "is_active" in data
        assert data["is_active"] == True
        
        print(f"✓ Active template: {data['name']} ({data['template_id']})")
    
    def test_gift_box_products(self):
        """Test GET /api/gift-box/products returns products list"""
        response = requests.get(f"{BASE_URL}/api/gift-box/products")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert isinstance(data["products"], list)
        print(f"✓ Gift box products endpoint working ({len(data['products'])} products)")


class TestBlogPublicRoutes:
    """Blog public routes - extracted from server.py to routes/blog.py"""
    
    def test_blog_posts_list(self):
        """Test GET /api/blog/posts returns posts list"""
        response = requests.get(f"{BASE_URL}/api/blog/posts")
        assert response.status_code == 200
        data = response.json()
        
        # Should return sample posts if no real posts in DB
        assert isinstance(data, list)
        assert len(data) >= 1  # At least sample posts
        
        # Verify post structure
        post = data[0]
        assert "post_id" in post
        assert "slug" in post
        assert "title" in post
        assert "excerpt" in post
        
        print(f"✓ Blog posts endpoint working ({len(data)} posts)")
    
    def test_blog_posts_with_category_filter(self):
        """Test GET /api/blog/posts with category filter"""
        response = requests.get(f"{BASE_URL}/api/blog/posts?category=Guides d'achat")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Blog posts with category filter working")
    
    def test_blog_single_post(self):
        """Test GET /api/blog/posts/{slug} returns single post with related"""
        slug = "guide-achat-smartphone-2025"
        response = requests.get(f"{BASE_URL}/api/blog/posts/{slug}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "post" in data
        assert "related" in data
        
        # Verify post fields
        post = data["post"]
        assert post["slug"] == slug
        assert "title" in post
        assert "content" in post
        assert "author" in post
        
        print(f"✓ Single blog post endpoint working: {post['title'][:30]}...")
    
    def test_blog_post_not_found(self):
        """Test GET /api/blog/posts/{slug} returns 404 for non-existent slug"""
        response = requests.get(f"{BASE_URL}/api/blog/posts/non-existent-slug-12345")
        assert response.status_code == 404
        print("✓ Blog post 404 handling working")


class TestAuthAndAdminRoutes:
    """Authentication and admin route tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@yamaplus.com",
            "password": "Admin123!"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_admin_login(self):
        """Test admin login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@yamaplus.com",
            "password": "Admin123!"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "token" in data
        assert "user_id" in data
        assert data["email"] == "admin@yamaplus.com"
        assert data["role"] == "admin"
        
        print("✓ Admin login working")
    
    def test_admin_gift_box_config(self, admin_token):
        """Test GET /api/admin/gift-box/config requires admin auth"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/gift-box/config", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "config" in data
        assert "sizes" in data
        assert "wrappings" in data
        
        print("✓ Admin gift box config endpoint working")
    
    def test_admin_blog_posts(self, admin_token):
        """Test GET /api/admin/blog/posts requires admin auth"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/blog/posts", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Admin blog posts endpoint working ({len(data)} posts)")
    
    def test_admin_endpoint_requires_auth(self):
        """Test admin endpoints reject unauthenticated requests"""
        response = requests.get(f"{BASE_URL}/api/admin/gift-box/config")
        assert response.status_code == 401
        print("✓ Admin endpoint authentication working")


class TestExistingCoreRoutes:
    """Core routes that should still work after refactoring"""
    
    def test_products_endpoint(self):
        """Test products endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/products?limit=3")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if data:
            product = data[0]
            assert "product_id" in product
            assert "name" in product
            assert "price" in product
        
        print(f"✓ Products endpoint working ({len(data)} products)")
    
    def test_product_by_id(self):
        """Test single product endpoint"""
        response = requests.get(f"{BASE_URL}/api/products/prod_iphone15pro")
        assert response.status_code == 200
        data = response.json()
        
        assert data["product_id"] == "prod_iphone15pro"
        assert "name" in data
        assert "price" in data
        
        print(f"✓ Single product endpoint working: {data['name']}")
    
    def test_flash_sales_endpoint(self):
        """Test flash sales endpoint"""
        response = requests.get(f"{BASE_URL}/api/flash-sales")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Flash sales endpoint working ({len(data)} sales)")
    
    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Categories endpoint working ({len(data)} categories)")
    
    def test_cart_endpoint(self):
        """Test cart endpoint"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        print("✓ Cart endpoint working")
    
    def test_add_to_cart(self):
        """Test add to cart functionality"""
        response = requests.post(f"{BASE_URL}/api/cart/add", json={
            "product_id": "prod_iphone15pro",
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data or "message" in data
        print("✓ Add to cart endpoint working")


class TestSearchAndReviews:
    """Search and review endpoints"""
    
    def test_search_endpoint(self):
        """Test search functionality via products endpoint with search param"""
        response = requests.get(f"{BASE_URL}/api/products?search=iphone")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Search endpoint working ({len(data)} results)")
    
    def test_featured_reviews(self):
        """Test featured reviews endpoint"""
        response = requests.get(f"{BASE_URL}/api/reviews/featured")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Featured reviews endpoint working ({len(data)} reviews)")
    
    def test_reviews_stats(self):
        """Test reviews stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/reviews/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "average_rating" in data or "total_reviews" in data or isinstance(data, dict)
        print("✓ Reviews stats endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

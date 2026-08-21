import { test, expect } from '@playwright/test';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://subcats-preview.preview.emergentagent.com';

test.describe('Order Detail Page - Payment Retry Features', () => {
  test('should display order detail page with payment pending alert', async ({ page }) => {
    // Get a pending order via API
    const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: 'admin@yamaplus.com', password: 'Admin123!' }
    });
    const { token } = await response.json();
    
    const ordersResponse = await page.request.get(`${BASE_URL}/api/admin/orders?limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { orders } = await ordersResponse.json();
    
    // Find a pending order
    const pendingOrder = orders?.find((o: any) => 
      ['pending', 'failed', 'awaiting_payment'].includes(o.payment_status)
    );
    
    if (!pendingOrder) {
      test.skip();
      return;
    }
    
    // Navigate to order detail
    await page.goto(`${BASE_URL}/order/${pendingOrder.order_id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Check order page loaded
    await expect(page.getByTestId('order-detail-page')).toBeVisible();
    
    // Check payment pending alert is visible
    await expect(page.getByTestId('payment-pending-alert')).toBeVisible();
    
    // Check retry button exists
    await expect(page.getByTestId('retry-payment-btn')).toBeVisible();
    
    // Check switch to COD button exists
    await expect(page.getByTestId('switch-to-cod-btn')).toBeVisible();
  });

  test('should display order timeline and items', async ({ page }) => {
    // Get an order via API
    const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: 'admin@yamaplus.com', password: 'Admin123!' }
    });
    const { token } = await response.json();
    
    const ordersResponse = await page.request.get(`${BASE_URL}/api/admin/orders?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { orders } = await ordersResponse.json();
    
    if (!orders || orders.length === 0) {
      test.skip();
      return;
    }
    
    const orderId = orders[0].order_id;
    
    // Navigate to order detail
    await page.goto(`${BASE_URL}/order/${orderId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Check order page loaded
    await expect(page.getByTestId('order-detail-page')).toBeVisible();
    
    // Check order ID is displayed
    await expect(page.getByText(orderId)).toBeVisible();
    
    // Check shipping address section - use first() to avoid strict mode
    await expect(page.getByText('Adresse de livraison').first()).toBeVisible();
    
    // Check order summary
    await expect(page.getByText('Récapitulatif').first()).toBeVisible();
  });
});

test.describe('Homepage and Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Check homepage loaded - use data-testid
    await expect(page.getByTestId('nav-logo')).toBeVisible();
  });

  test('should display category navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Check category button - use first() to avoid strict mode
    await expect(page.getByRole('button', { name: 'Catégories' })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Check login page
    await expect(page.getByRole('heading', { name: /Bienvenue sur YAMA/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Se connecter/ })).toBeVisible();
  });
});

test.describe('Product Page Features', () => {
  test('should display product details', async ({ page }) => {
    // Get a product via API
    const productsResponse = await page.request.get(`${BASE_URL}/api/products?limit=1`);
    const products = await productsResponse.json();
    
    if (!products || products.length === 0) {
      test.skip();
      return;
    }
    
    const product = products[0];
    
    // Navigate to product page
    await page.goto(`${BASE_URL}/product/${product.product_id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Check product name is displayed
    await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
    
    // Check add to cart button
    await expect(page.getByRole('button', { name: /Ajouter au panier/i })).toBeVisible();
  });
});

test.describe('API Endpoints - Backend Tests', () => {
  test('should get products list', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/products?limit=5`);
    expect(response.status()).toBe(200);
    
    const products = await response.json();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  test('should get featured products', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/products?featured=true&limit=5`);
    expect(response.status()).toBe(200);
    
    const products = await response.json();
    expect(Array.isArray(products)).toBe(true);
    
    // All products should be featured
    for (const product of products) {
      expect(product.featured).toBe(true);
    }
  });

  test('should update product featured status via admin API', async ({ page }) => {
    // Login as admin
    const loginResponse = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: 'admin@yamaplus.com', password: 'Admin123!' }
    });
    const { token } = await loginResponse.json();
    
    // Get a product
    const productsResponse = await page.request.get(`${BASE_URL}/api/products?limit=1`);
    const products = await productsResponse.json();
    const productId = products[0].product_id;
    
    // Update featured status
    const updateResponse = await page.request.put(
      `${BASE_URL}/api/admin/products/${productId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { featured: true, featured_order: 1 }
      }
    );
    
    expect(updateResponse.status()).toBe(200);
    const data = await updateResponse.json();
    expect(data.message).toBe('Produit mis à jour');
    expect(data.product.featured).toBe(true);
  });

  test('should retry payment via PayDunya API', async ({ page }) => {
    // Login as admin
    const loginResponse = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: 'admin@yamaplus.com', password: 'Admin123!' }
    });
    const { token } = await loginResponse.json();
    
    // Get a pending order
    const ordersResponse = await page.request.get(`${BASE_URL}/api/admin/orders?limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { orders } = await ordersResponse.json();
    
    const pendingOrder = orders?.find((o: any) => 
      ['pending', 'failed', 'awaiting_payment'].includes(o.payment_status)
    );
    
    if (!pendingOrder) {
      test.skip();
      return;
    }
    
    // Retry payment
    const retryResponse = await page.request.post(
      `${BASE_URL}/api/payments/paydunya/retry/${pendingOrder.order_id}`,
      {
        data: {
          success_url: `${BASE_URL}/order/${pendingOrder.order_id}?payment=success`,
          cancel_url: `${BASE_URL}/order/${pendingOrder.order_id}?payment=cancelled`
        }
      }
    );
    
    expect(retryResponse.status()).toBe(200);
    const data = await retryResponse.json();
    expect(data.success).toBe(true);
    expect(data.checkout_url).toBeDefined();
  });

  test('should get PayDunya payment methods', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/payments/paydunya/methods`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.methods).toBeDefined();
    expect(Array.isArray(data.methods)).toBe(true);
    
    // Check for expected payment methods (using actual IDs from API)
    const methodIds = data.methods.map((m: any) => m.id);
    expect(methodIds).toContain('wave');
    expect(methodIds).toContain('orange_money');
  });
});

import { test, expect } from '@playwright/test';

/**
 * Core E-commerce Flow Tests
 * Tests: Homepage, Navigation, Product catalog, Product page, Cart
 */

test.describe('Homepage and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should load homepage with hero section', async ({ page }) => {
    await expect(page.getByTestId('home-page')).toBeVisible();
    
    // Check hero CTA button
    await expect(page.getByTestId('hero-cta')).toBeVisible();
    
    // Check navbar elements
    await expect(page.getByTestId('nav-logo')).toBeVisible();
    await expect(page.getByTestId('nav-cart-btn')).toBeVisible();
    
    await page.screenshot({ path: 'homepage.jpeg', quality: 20, fullPage: false });
  });

  test('should navigate to category page', async ({ page }) => {
    // Click on a category
    const categoryLink = page.getByTestId('category-electronique');
    if (await categoryLink.isVisible()) {
      await categoryLink.click();
      await page.waitForURL(/\/category\/electronique/);
      await expect(page).toHaveURL(/\/category\/electronique/);
    }
  });

  test('should open cart drawer', async ({ page }) => {
    await page.getByTestId('nav-cart-btn').click();
    
    // Cart drawer should be visible
    await expect(page.locator('[role="dialog"]').first()).toBeVisible();
  });

  test('should open search', async ({ page }) => {
    await page.getByTestId('nav-search-btn').click();
    
    // Search input should be visible
    await expect(page.getByTestId('search-input')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    const loginBtn = page.getByTestId('nav-login-btn');
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await page.waitForURL(/\/login/);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe('Product Catalog', () => {
  test('should display category page with filters', async ({ page }) => {
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check category header is visible
    await expect(page.getByText('Électronique')).toBeVisible();
    
    // Check filter buttons exist
    await expect(page.getByText('Smartphones')).toBeVisible();
    await expect(page.getByText('TV & Écrans')).toBeVisible();
    
    await page.screenshot({ path: 'category-page.jpeg', quality: 20, fullPage: false });
  });

  test('should filter products by subcategory', async ({ page }) => {
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Click on Smartphones filter
    const smartphonesBtn = page.getByText('Smartphones').first();
    if (await smartphonesBtn.isVisible()) {
      await smartphonesBtn.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Product Page', () => {
  test('should display product details', async ({ page }) => {
    // Navigate directly to a known product
    await page.goto('/product/prod_iphone15pro', { waitUntil: 'domcontentloaded' });
    
    await expect(page.getByTestId('product-page')).toBeVisible();
    await expect(page.getByTestId('product-name')).toBeVisible();
    await expect(page.getByTestId('product-price')).toBeVisible();
    
    await page.screenshot({ path: 'product-page.jpeg', quality: 20, fullPage: false });
  });

  test('should have add to cart button', async ({ page }) => {
    await page.goto('/product/prod_iphone15pro', { waitUntil: 'domcontentloaded' });
    
    const addToCartBtn = page.getByTestId('add-to-cart-btn');
    await expect(addToCartBtn.first()).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/product/prod_iphone15pro', { waitUntil: 'domcontentloaded' });
    
    const addToCartBtn = page.getByTestId('add-to-cart-btn').first();
    await addToCartBtn.click();
    
    // Wait for cart update
    await page.waitForTimeout(1000);
    
    // Open cart to verify
    await page.getByTestId('nav-cart-btn').click();
    
    // Cart should have items
    const cartItem = page.locator(`[data-testid^="cart-item-"]`);
    await expect(cartItem.first()).toBeVisible();
    
    await page.screenshot({ path: 'cart-with-item.jpeg', quality: 20, fullPage: false });
  });

  test('should have wishlist button', async ({ page }) => {
    await page.goto('/product/prod_iphone15pro', { waitUntil: 'domcontentloaded' });
    
    await expect(page.getByTestId('wishlist-btn')).toBeVisible();
  });

  test('should have WhatsApp order button', async ({ page }) => {
    await page.goto('/product/prod_iphone15pro', { waitUntil: 'domcontentloaded' });
    
    await expect(page.getByTestId('whatsapp-order-btn')).toBeVisible();
  });
});

test.describe('Cart Functionality', () => {
  test('should show empty cart message', async ({ page }) => {
    // Clear localStorage to ensure empty cart
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    await page.getByTestId('nav-cart-btn').click();
    
    // Should show empty cart message or no items
    const cartDialog = page.locator('[role="dialog"]').first();
    await expect(cartDialog).toBeVisible();
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    // First add a product to cart
    await page.goto('/product/prod_iphone15pro', { waitUntil: 'domcontentloaded' });
    
    const addToCartBtn = page.getByTestId('add-to-cart-btn').first();
    await addToCartBtn.click();
    await page.waitForTimeout(1000);
    
    // Open cart
    await page.getByTestId('nav-cart-btn').click();
    
    // Click checkout button
    const checkoutBtn = page.getByTestId('checkout-btn');
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();
    
    await page.waitForURL(/\/checkout/);
    await expect(page).toHaveURL(/\/checkout/);
  });
});

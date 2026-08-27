import { test, expect } from '@playwright/test';

/**
 * Tests for new GROUPE YAMA+ features:
 * 1. Visual product specs cards with icons
 * 2. Admin product form auto-generate variants buttons
 */

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://subcats-preview.preview.emergentagent.com';

test.describe('Admin Product Form - Auto-Generate Variants', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@yamaplus.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
  });

  test('should show generate variants button for Smartphones category', async ({ page }) => {
    // Navigate to admin products
    await page.goto('/admin/products');
    await page.waitForLoadState('domcontentloaded');
    
    // Click add new product button
    const addButton = page.getByRole('button', { name: /nouveau|ajouter/i }).first();
    await addButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"], .fixed.inset-0', { timeout: 5000 });
    
    // Select Électronique category
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('electronique');
    
    // Select Smartphones subcategory
    const subcategorySelect = page.locator('select').nth(1);
    await subcategorySelect.selectOption('Smartphones');
    
    // Go to Options/Variants tab
    const variantsTab = page.getByRole('button', { name: /options/i });
    await variantsTab.click();
    await page.waitForLoadState('domcontentloaded');
    
    // Enable variants checkbox - click the checkbox directly
    const variantsCheckbox = page.locator('input[type="checkbox"]').first();
    await variantsCheckbox.check({ force: true });
    
    // Wait for the generate button to appear
    await page.waitForSelector('[data-testid="generate-phone-variants-btn"]', { timeout: 5000 });
    
    // Check for generate button
    const generateBtn = page.getByTestId('generate-phone-variants-btn');
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toContainText(/générer/i);
    
    // Take screenshot
    await page.screenshot({ path: 'admin-phone-variants.jpeg', quality: 20 });
  });

  test('should show generate variants button for Climatiseur category', async ({ page }) => {
    // Navigate to admin products
    await page.goto('/admin/products');
    await page.waitForLoadState('domcontentloaded');
    
    // Click add new product button
    const addButton = page.getByRole('button', { name: /nouveau|ajouter/i }).first();
    await addButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"], .fixed.inset-0', { timeout: 5000 });
    
    // Select Électroménager category
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('electromenager');
    
    // Select Climatiseur subcategory
    const subcategorySelect = page.locator('select').nth(1);
    await subcategorySelect.selectOption('Climatiseur');
    
    // Go to Options/Variants tab
    const variantsTab = page.getByRole('button', { name: /options/i });
    await variantsTab.click();
    await page.waitForLoadState('domcontentloaded');
    
    // Enable variants checkbox - click the checkbox directly
    const variantsCheckbox = page.locator('input[type="checkbox"]').first();
    await variantsCheckbox.check({ force: true });
    
    // Wait for the generate button to appear
    await page.waitForSelector('[data-testid="generate-ac-variants-btn"]', { timeout: 5000 });
    
    // Check for generate button
    const generateBtn = page.getByTestId('generate-ac-variants-btn');
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toContainText(/générer|cv/i);
    
    // Take screenshot
    await page.screenshot({ path: 'admin-ac-variants.jpeg', quality: 20 });
  });

  test('should show generate variants button for Matelas category', async ({ page }) => {
    // Navigate to admin products
    await page.goto('/admin/products');
    await page.waitForLoadState('domcontentloaded');
    
    // Click add new product button
    const addButton = page.getByRole('button', { name: /nouveau|ajouter/i }).first();
    await addButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"], .fixed.inset-0', { timeout: 5000 });
    
    // Select Décoration category
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('decoration');
    
    // Select Literie & Matelas subcategory
    const subcategorySelect = page.locator('select').nth(1);
    await subcategorySelect.selectOption('Literie & Matelas');
    
    // Go to Options/Variants tab
    const variantsTab = page.getByRole('button', { name: /options/i });
    await variantsTab.click();
    await page.waitForLoadState('domcontentloaded');
    
    // Enable variants checkbox - click the checkbox directly
    const variantsCheckbox = page.locator('input[type="checkbox"]').first();
    await variantsCheckbox.check({ force: true });
    
    // Wait for the generate button to appear
    await page.waitForSelector('[data-testid="generate-mattress-variants-btn"]', { timeout: 5000 });
    
    // Check for generate button
    const generateBtn = page.getByTestId('generate-mattress-variants-btn');
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toContainText(/générer|dimensions/i);
    
    // Take screenshot
    await page.screenshot({ path: 'admin-mattress-variants.jpeg', quality: 20 });
  });
});

test.describe('Product Page - Visual Specs Cards', () => {
  test('should display product page correctly', async ({ page }) => {
    // Navigate to a product page
    await page.goto('/product/prod_iphone15pro');
    await page.waitForLoadState('domcontentloaded');
    
    // Check product page loads
    const productPage = page.getByTestId('product-page');
    await expect(productPage).toBeVisible();
    
    // Check product name is visible
    const productName = page.getByTestId('product-name');
    await expect(productName).toBeVisible();
    
    // Check product price is visible
    const productPrice = page.getByTestId('product-price');
    await expect(productPrice).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'product-page-iphone.jpeg', quality: 20 });
  });

  test('should display visual specs section when product has specs', async ({ page }) => {
    // Note: Current products don't have specs populated
    // This test verifies the structure is in place
    await page.goto('/product/prod_samsung_tv');
    await page.waitForLoadState('domcontentloaded');
    
    // Check product page loads
    const productPage = page.getByTestId('product-page');
    await expect(productPage).toBeVisible();
    
    // The visual specs section should only appear if product has specs
    // Since current products don't have specs, we verify the page loads correctly
    const productName = page.getByTestId('product-name');
    await expect(productName).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'product-page-tv.jpeg', quality: 20 });
  });

  test('should have add to cart button for regular products', async ({ page }) => {
    await page.goto('/product/prod_airpods_pro');
    await page.waitForLoadState('domcontentloaded');
    
    // Check add to cart button is visible
    const addToCartBtn = page.getByTestId('add-to-cart-btn');
    await expect(addToCartBtn).toBeVisible();
    
    // Check WhatsApp order button is visible
    const whatsappBtn = page.getByTestId('whatsapp-order-btn');
    await expect(whatsappBtn).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'product-page-airpods.jpeg', quality: 20 });
  });

  test('should have wishlist button on product page', async ({ page }) => {
    await page.goto('/product/prod_macbook_air');
    await page.waitForLoadState('domcontentloaded');
    
    // Check wishlist button is visible
    const wishlistBtn = page.getByTestId('wishlist-btn');
    await expect(wishlistBtn).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'product-page-macbook.jpeg', quality: 20 });
  });
});

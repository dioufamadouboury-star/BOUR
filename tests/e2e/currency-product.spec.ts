import { test, expect } from '@playwright/test';

test.describe('Currency Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should display currency selector and allow switching', async ({ page }) => {
    // Verify XOF is default
    const currencyButton = page.locator('button:has-text("XOF")').first();
    await expect(currencyButton).toBeVisible();
    await expect(currencyButton).toContainText('🇸🇳');
    
    // Open dropdown
    await currencyButton.click();
    
    // Verify all currencies are shown
    await expect(page.getByText('Euro', { exact: true })).toBeVisible();
    await expect(page.getByText('Dollar US', { exact: true })).toBeVisible();
    await expect(page.getByText('Franc CFA', { exact: true })).toBeVisible();
    
    // Select EUR
    await page.locator('button:has-text("EUR")').click();
    
    // Verify currency changed
    const updatedButton = page.locator('button:has-text("EUR")').first();
    await expect(updatedButton).toBeVisible();
    await expect(updatedButton).toContainText('🇪🇺');
    
    // Reload and verify persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('button:has-text("EUR")').first()).toBeVisible();
  });
});

test.describe('Product Page - Appointment Button Logic', () => {
  // Increase timeout for product tests due to rate limiting
  test.setTimeout(60000);
  
  test('should NOT show appointment button for electronique products', async ({ page }) => {
    // Wait before making API calls to avoid rate limiting
    await page.waitForTimeout(5000);
    
    // Navigate with retry logic
    let retries = 3;
    while (retries > 0) {
      await page.goto('/product/prod_galaxy_watch', { waitUntil: 'networkidle' });
      
      // Check if product loaded
      const productName = page.getByTestId('product-name');
      const isVisible = await productName.isVisible().catch(() => false);
      
      if (isVisible) {
        break;
      }
      
      retries--;
      if (retries > 0) {
        await page.waitForTimeout(3000);
      }
    }
    
    // Verify product loaded
    await expect(page.getByTestId('product-name')).toBeVisible();
    
    // Verify appointment button is NOT visible (only for automobile/immobilier)
    await expect(page.getByTestId('appointment-btn')).not.toBeVisible();
    
    // Verify add to cart button IS visible
    await expect(page.getByTestId('add-to-cart-btn')).toBeVisible();
    await expect(page.getByTestId('wishlist-btn')).toBeVisible();
    await expect(page.getByTestId('whatsapp-order-btn')).toBeVisible();
    
    // Verify price alert button is visible
    await expect(page.getByTestId('price-alert-btn')).toBeVisible();
    
    // Verify price is displayed
    await expect(page.getByTestId('product-price')).toContainText('FCFA');
  });
});

test.describe('Category Page - Subcategory Filters', () => {
  test('should display category page with subcategory filters', async ({ page }) => {
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    
    // Verify category page loads
    await expect(page.getByRole('heading', { name: 'Électronique & High-Tech' })).toBeVisible();
    
    // Verify subcategory filters are visible
    await expect(page.getByRole('button', { name: /Smartphones/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /TV/i })).toBeVisible();
  });
});

test.describe('Homepage', () => {
  test('should load homepage correctly with navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Verify header elements
    await expect(page.getByRole('button', { name: /Catégories/i })).toBeVisible();
    
    // Verify currency selector is present
    await expect(page.locator('button:has-text("XOF")').first()).toBeVisible();
    
    // Test navigation to category
    await page.getByRole('button', { name: /Catégories/i }).click();
    await page.getByRole('link', { name: 'Électronique' }).first().click();
    
    await page.waitForURL(/\/category\/electronique/);
  });
});

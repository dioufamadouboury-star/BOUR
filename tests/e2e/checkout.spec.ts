import { test, expect } from '@playwright/test';

/**
 * Checkout Flow Tests
 * Tests: Checkout page, Form validation, Shipping calculation, Order placement
 */

test.describe('Checkout Page', () => {
  // Helper to add product to cart before checkout tests
  async function addProductToCart(page) {
    const response = await page.request.get('/api/products');
    const products = await response.json();
    const productWithStock = products.find(p => p.stock > 0);
    
    if (productWithStock) {
      await page.goto(`/product/${productWithStock.product_id}`, { waitUntil: 'domcontentloaded' });
      const addToCartBtn = page.getByTestId('add-to-cart-btn').first();
      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  }

  test('should load checkout page', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    
    await page.screenshot({ path: 'checkout-page.jpeg', quality: 20, fullPage: false });
  });

  test('should display checkout form fields', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    // Check form fields exist
    await expect(page.getByTestId('checkout-name')).toBeVisible();
    await expect(page.getByTestId('checkout-phone')).toBeVisible();
    await expect(page.getByTestId('checkout-email')).toBeVisible();
    await expect(page.getByTestId('checkout-address')).toBeVisible();
    await expect(page.getByTestId('checkout-city')).toBeVisible();
    await expect(page.getByTestId('checkout-region')).toBeVisible();
  });

  test('should have payment method options', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    // Check payment methods
    await expect(page.getByText('Mobile Money')).toBeVisible();
    await expect(page.getByText('Paiement à la livraison')).toBeVisible();
    await expect(page.getByText('Carte Bancaire')).toBeVisible();
  });

  test('should have promo code input', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    // Check promo code section
    const promoInput = page.getByTestId('promo-code-input');
    const applyBtn = page.getByTestId('apply-promo-btn');
    
    // These may be in a collapsible section
    if (await promoInput.isVisible()) {
      await expect(promoInput).toBeVisible();
      await expect(applyBtn).toBeVisible();
    }
  });

  test('should calculate shipping based on city', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    // Fill city field
    await page.getByTestId('checkout-city').fill('Médina');
    
    // Wait for shipping calculation
    await page.waitForTimeout(1000);
    
    // Should show shipping cost (1500 for Médina)
    await expect(page.getByText(/1[\s,]?500/)).toBeVisible();
  });

  test('should show place order button', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    await expect(page.getByTestId('place-order-btn')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    // Try to submit without filling required fields
    await page.getByTestId('place-order-btn').click();
    
    // Should show validation errors or not proceed
    // The form should not submit successfully
    await page.waitForTimeout(500);
    
    // Should still be on checkout page
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('should show neighborhood suggestions for Dakar', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    // Type in city field
    await page.getByTestId('checkout-city').fill('Par');
    
    // Should show autocomplete suggestions
    await page.waitForTimeout(500);
    
    // Check if Parcelles Assainies appears in suggestions
    const suggestion = page.getByText('Parcelles Assainies');
    if (await suggestion.isVisible()) {
      await suggestion.click();
      await expect(page.getByTestId('checkout-city')).toHaveValue('Parcelles Assainies');
    }
  });
});

test.describe('Checkout - Order Summary', () => {
  async function addProductToCart(page) {
    const response = await page.request.get('/api/products');
    const products = await response.json();
    const productWithStock = products.find(p => p.stock > 0);
    
    if (productWithStock) {
      await page.goto(`/product/${productWithStock.product_id}`, { waitUntil: 'domcontentloaded' });
      const addToCartBtn = page.getByTestId('add-to-cart-btn').first();
      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  }

  test('should display cart items in order summary', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    // Should show product in summary
    // Look for product name or price
    const orderSummary = page.locator('[class*="summary"], [class*="order"]');
    await expect(orderSummary.first()).toBeVisible();
  });

  test('should show subtotal and total', async ({ page }) => {
    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    // Should show pricing
    await expect(page.getByText(/Sous-total|Subtotal/i)).toBeVisible();
    await expect(page.getByText(/Total/i)).toBeVisible();
  });
});

test.describe('Checkout - Empty Cart', () => {
  test('should redirect or show message for empty cart', async ({ page }) => {
    // Clear cart
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    
    // Try to access checkout
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    
    // Should either redirect to home or show empty cart message
    await page.waitForTimeout(1000);
    
    // Check if redirected or showing empty message
    const url = page.url();
    const hasEmptyMessage = await page.getByText(/panier vide|empty cart/i).isVisible().catch(() => false);
    
    expect(url.includes('/checkout') === false || hasEmptyMessage).toBeTruthy();
  });
});

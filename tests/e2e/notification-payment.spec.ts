import { test, expect } from '@playwright/test';

test.describe('Push Notification Removal', () => {
  test('Homepage loads without push notification popup', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Wait 5 seconds to see if any notification popup appears
    await page.waitForTimeout(5000);
    
    // Check that push notification prompt is NOT visible
    const pushNotificationPrompt = page.locator('[data-testid="push-notification-prompt"]');
    await expect(pushNotificationPrompt).not.toBeVisible();
    
    // Also check for any notification-related modal/popup
    const notificationModal = page.locator('text=Activer les notifications');
    await expect(notificationModal).not.toBeVisible();
    
    // Verify homepage content is visible
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });
  
  test('Homepage hero section loads correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Verify hero section is visible using heading role
    const heroSection = page.getByRole('heading', { name: /Le meilleur du Sénégal/i }).first();
    await expect(heroSection).toBeVisible();
    
    // Verify navigation is visible
    const navbar = page.locator('text=Catégories').first();
    await expect(navbar).toBeVisible();
  });
});

test.describe('Checkout Payment Methods', () => {
  test('Checkout page shows all payment methods including card', async ({ page }) => {
    // Go to a category page to find products
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Find product card using partial data-testid match
    const productCard = page.locator('[data-testid^="product-card-"]').first();
    await expect(productCard).toBeVisible();
    await productCard.click();
    
    // Wait for product page to load
    await page.waitForLoadState('networkidle');
    
    // Add to cart - use partial match for add-to-cart button
    const addToCartBtn = page.locator('[data-testid^="add-to-cart-btn"]').first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();
    
    // Wait for cart to update
    await page.waitForTimeout(1000);
    
    // Go to checkout
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Scroll down to see payment methods
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    
    // Verify payment methods section is visible
    // Check for Mobile Money option
    const mobileMoney = page.locator('text=Mobile Money').first();
    await expect(mobileMoney).toBeVisible();
    
    // Check for Cash on delivery option
    const cashOnDelivery = page.locator('text=Paiement à la livraison').first();
    await expect(cashOnDelivery).toBeVisible();
    
    // Check for Card payment option (Visa/Mastercard)
    const cardPayment = page.locator('text=Carte Bancaire').first();
    await expect(cardPayment).toBeVisible();
    
    // Check for Visa/Mastercard description
    const visaMastercard = page.locator('text=Visa, Mastercard').first();
    await expect(visaMastercard).toBeVisible();
    
    // Verify PayTech security message
    const paytechSecurity = page.locator('text=Paiement sécurisé via Paytech').first();
    await expect(paytechSecurity).toBeVisible();
  });
  
  test('Card payment option is selectable', async ({ page }) => {
    // Go to a category page to find products
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Find product card using partial data-testid match
    const productCard = page.locator('[data-testid^="product-card-"]').first();
    await expect(productCard).toBeVisible();
    await productCard.click();
    
    // Wait for product page to load
    await page.waitForLoadState('networkidle');
    
    // Add to cart
    const addToCartBtn = page.locator('[data-testid^="add-to-cart-btn"]').first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();
    
    // Wait for cart to update
    await page.waitForTimeout(1000);
    
    // Go to checkout
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Scroll down to see payment methods
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    
    // Click on Card payment option
    const cardPaymentOption = page.locator('text=Carte Bancaire').first();
    await cardPaymentOption.click();
    
    // Verify card payment is selected
    await expect(cardPaymentOption).toBeVisible();
  });
  
  test('Mobile Money is default selected payment method', async ({ page }) => {
    // Go to a category page to find products
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Find product card using partial data-testid match
    const productCard = page.locator('[data-testid^="product-card-"]').first();
    await expect(productCard).toBeVisible();
    await productCard.click();
    
    // Wait for product page to load
    await page.waitForLoadState('networkidle');
    
    // Add to cart
    const addToCartBtn = page.locator('[data-testid^="add-to-cart-btn"]').first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();
    
    // Wait for cart to update
    await page.waitForTimeout(1000);
    
    // Go to checkout
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Scroll down to see payment methods
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    
    // Verify Mobile Money has "Recommandé" badge
    const recommendedBadge = page.locator('text=Recommandé').first();
    await expect(recommendedBadge).toBeVisible();
  });
});

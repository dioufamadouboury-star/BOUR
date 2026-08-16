import { test, expect } from '@playwright/test';

/**
 * Push Notification Prompt and Spotlight Carousel Tests
 * 
 * NOTE: Push notification prompt tests are LIMITED in headless browser environments
 * because Notification.permission is 'denied' by default in headless Chromium.
 * The component correctly checks this and doesn't show the prompt when permission is denied.
 * 
 * For full push notification testing, use a real browser or mobile device testing.
 */

test.describe('Spotlight Carousel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('push_prompt_seen_v3', 'true');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
  });

  test('Spotlight carousel shows one product at a time with navigation arrows', async ({ page }) => {
    // Scroll to the spotlight carousel section
    const carouselHeading = page.locator('h2', { hasText: 'Découvrez nos dernières arrivées' });
    await carouselHeading.scrollIntoViewIfNeeded();
    
    // Wait for product to load in carousel
    const productCard = page.locator('a[href^="/product/"]').first();
    await expect(productCard).toBeVisible();
    
    // Check that navigation arrows are visible
    const leftArrow = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }).first();
    const rightArrow = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).first();
    
    await expect(leftArrow).toBeVisible();
    await expect(rightArrow).toBeVisible();
  });

  test('Product card in carousel has name, price, and Voir le produit button', async ({ page }) => {
    // Scroll to the spotlight carousel section
    const carouselHeading = page.locator('h2', { hasText: 'Découvrez nos dernières arrivées' });
    await carouselHeading.scrollIntoViewIfNeeded();
    
    // Wait for product to load
    const productCard = page.locator('a[href^="/product/"]').first();
    await expect(productCard).toBeVisible();
    
    // Check product name (h3 element)
    const productName = productCard.locator('h3');
    await expect(productName).toBeVisible();
    const nameText = await productName.textContent();
    expect(nameText).toBeTruthy();
    expect(nameText!.length).toBeGreaterThan(0);
    
    // Check price is displayed (contains FCFA)
    await expect(productCard.locator('text=FCFA')).toBeVisible();
    
    // Check "Voir le produit" button
    const viewButton = productCard.locator('button', { hasText: 'Voir le produit' });
    await expect(viewButton).toBeVisible();
  });

  test('Carousel navigation arrows work correctly', async ({ page }) => {
    // Scroll to the spotlight carousel section
    const carouselHeading = page.locator('h2', { hasText: 'Découvrez nos dernières arrivées' });
    await carouselHeading.scrollIntoViewIfNeeded();
    
    // Wait for product to load in carousel
    const productCard = page.locator('a[href^="/product/"]').first();
    await expect(productCard).toBeVisible();
    
    // Get initial product name
    const productName = productCard.locator('h3');
    await expect(productName).toBeVisible();
    const initialName = await productName.textContent();
    
    // Click right arrow
    const rightArrow = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).first();
    await rightArrow.click();
    
    // Wait for animation
    await page.waitForTimeout(700);
    
    // Wait for new product to appear
    await expect(productCard).toBeVisible();
    const newProductName = productCard.locator('h3');
    await expect(newProductName).toBeVisible();
    const newName = await newProductName.textContent();
    
    // Verify the carousel changed (different product name)
    expect(newName).not.toBe(initialName);
    
    // Click left arrow to go back
    const leftArrow = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }).first();
    await leftArrow.click();
    
    await page.waitForTimeout(700);
    
    // Verify we're back to the initial product
    await expect(productCard).toBeVisible();
    const backName = await productCard.locator('h3').textContent();
    expect(backName).toBe(initialName);
  });

  test('Carousel auto-advances every 4 seconds', async ({ page }) => {
    // Scroll to the spotlight carousel section
    const carouselHeading = page.locator('h2', { hasText: 'Découvrez nos dernières arrivées' });
    await carouselHeading.scrollIntoViewIfNeeded();
    
    // Wait for product to load in carousel
    const productCard = page.locator('a[href^="/product/"]').first();
    await expect(productCard).toBeVisible();
    
    // Get initial product name
    const productName = productCard.locator('h3');
    await expect(productName).toBeVisible();
    const initialName = await productName.textContent();
    
    // Wait for auto-advance (4 seconds + buffer)
    await page.waitForTimeout(4500);
    
    // Wait for new product to appear
    await expect(productCard).toBeVisible();
    const newName = await productCard.locator('h3').textContent();
    
    // Verify the carousel auto-advanced (different product name)
    expect(newName).not.toBe(initialName);
  });
});

test.describe('Homepage Integration', () => {
  test('Homepage loads correctly with all sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('push_prompt_seen_v3', 'true');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    
    // Check homepage is loaded
    await expect(page.getByTestId('home-page')).toBeVisible();
    
    // Check hero section
    await expect(page.locator('text=Le meilleur du Sénégal')).toBeVisible();
    
    // Check categories section
    await expect(page.locator('text=Explorez nos univers')).toBeVisible();
    
    // Check WhatsApp button
    await expect(page.getByTestId('whatsapp-btn')).toBeVisible();
  });
});

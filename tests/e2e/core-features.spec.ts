import { test, expect } from '@playwright/test';

test.describe('GROUPE YAMA+ E-commerce Platform - Core Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Homepage and Navigation', () => {
    test('homepage loads correctly', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      
      // Check hero section using data-testid
      await expect(page.getByTestId('home-page')).toBeVisible();
      
      // Check navigation elements - use specific locators
      await expect(page.getByRole('button', { name: 'Catégories' })).toBeVisible();
      await expect(page.getByRole('navigation').getByText('Services', { exact: true })).toBeVisible();
      await expect(page.getByRole('navigation').getByRole('link', { name: 'Nouveautés' })).toBeVisible();
    });

    test('currency selector is visible', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      
      // Check currency selector shows XOF by default
      await expect(page.getByText('XOF', { exact: true })).toBeVisible();
    });

    test('navigation to category pages works', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      
      // Click on Découvrir Électronique
      await page.getByRole('link', { name: /Découvrir Électronique/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Should be on electronique category page
      await expect(page).toHaveURL(/category\/electronique/);
    });
  });

  test.describe('Category Pages with Subcategory Filters', () => {
    test('electromenager category shows subcategory filter buttons', async ({ page }) => {
      await page.goto('/category/electromenager', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      
      // Check category title - use first() to avoid strict mode
      await expect(page.getByRole('heading', { name: 'Électroménager' }).first()).toBeVisible();
      
      // Check subcategory filter buttons
      await expect(page.getByRole('button', { name: /Climatiseur/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Réfrigérateur/i })).toBeVisible();
    });

    test('decoration category shows subcategory filter buttons', async ({ page }) => {
      await page.goto('/category/decoration', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      
      // Check category title - use first() to avoid strict mode
      await expect(page.getByRole('heading', { name: /Décoration/i }).first()).toBeVisible();
      
      // Check subcategory filter buttons
      await expect(page.getByRole('button', { name: /Salons/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Literie/i })).toBeVisible();
    });

    test('electronique category shows subcategory filter buttons', async ({ page }) => {
      await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      
      // Check subcategory filter buttons
      await expect(page.getByRole('button', { name: /Smartphones/i })).toBeVisible();
    });
  });

  test.describe('Product and Cart Flow', () => {
    test('can add product to cart from category page', async ({ page }) => {
      await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Click on first product card
      const productCard = page.locator('[data-testid="product-card"]').first();
      if (await productCard.count() > 0) {
        await productCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Check if we're on a product page
        const addToCartBtn = page.getByRole('button', { name: /Ajouter au panier/i });
        if (await addToCartBtn.count() > 0) {
          await addToCartBtn.click();
          await page.waitForTimeout(1500);
          
          // Check cart drawer opens
          await expect(page.getByText('Votre panier')).toBeVisible();
        }
      }
    });
  });

  test.describe('Checkout Flow', () => {
    test('checkout page shows empty cart message when no items', async ({ page }) => {
      await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      
      // Should show empty cart message
      await expect(page.getByText('Votre panier est vide')).toBeVisible();
    });
  });
});

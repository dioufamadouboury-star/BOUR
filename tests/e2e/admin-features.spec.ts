import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard and Product Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // Helper function to login as admin
  async function loginAsAdmin(page) {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@yamaplus.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    // Wait for dashboard to load
    await page.waitForSelector('text=Tableau de bord', { timeout: 10000 });
  }

  test.describe('Admin Authentication', () => {
    test('admin login page loads correctly', async ({ page }) => {
      await page.goto('/admin', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      
      // Check login form
      await expect(page.locator('text=Bienvenue sur YAMA+')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Se connecter")')).toBeVisible();
    });

    test('admin can login with valid credentials', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Should see dashboard
      await expect(page.locator('text=Tableau de bord')).toBeVisible();
    });
  });

  test.describe('Admin Dashboard Stats', () => {
    test('dashboard shows revenue and order stats', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Check dashboard stats cards
      await expect(page.getByText('FCFA').first()).toBeVisible();
      await expect(page.getByText('Commandes').first()).toBeVisible();
      await expect(page.getByText('Produits').first()).toBeVisible();
      await expect(page.getByText('Clients').first()).toBeVisible();
    });

    test('dashboard shows recent orders', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Check recent orders section
      await expect(page.getByText('Commandes récentes')).toBeVisible();
    });
  });

  test.describe('Product Management', () => {
    test('products list page loads correctly', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to products
      await page.click('text=Produits');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check products page
      await expect(page.getByRole('heading', { name: 'Produits' })).toBeVisible();
      await expect(page.getByText('Ajouter un produit')).toBeVisible();
    });

    test('product form modal opens correctly', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to products
      await page.click('text=Produits');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Open product form
      await page.click('text=Ajouter un produit');
      await page.waitForTimeout(1000);
      
      // Check form modal
      await expect(page.getByText('Nouveau produit')).toBeVisible();
      await expect(page.getByText('Général', { exact: true })).toBeVisible();
      await expect(page.getByText('Images', { exact: true })).toBeVisible();
      await expect(page.getByText('Options', { exact: true })).toBeVisible();
    });

    test('product form shows Climatiseur variant option', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to products
      await page.click('text=Produits');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Open product form
      await page.click('text=Ajouter un produit');
      await page.waitForTimeout(1000);
      
      // Select Électroménager category
      await page.selectOption('select:has-text("Électronique")', 'electromenager');
      await page.waitForTimeout(500);
      
      // Select Climatiseur subcategory
      await page.selectOption('select:has-text("Sélectionner")', 'Climatiseur');
      await page.waitForTimeout(500);
      
      // Click on Options tab
      await page.click('text=Options');
      await page.waitForTimeout(500);
      
      // Check Climatiseur variant option is visible
      await expect(page.getByText('Activer les variantes (Puissance CV)')).toBeVisible();
    });

    test('product form shows Matelas variant option', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to products
      await page.click('text=Produits');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Open product form
      await page.click('text=Ajouter un produit');
      await page.waitForTimeout(1000);
      
      // Select Décoration category
      await page.selectOption('select:has-text("Électronique")', 'decoration');
      await page.waitForTimeout(500);
      
      // Select Literie & Matelas subcategory
      await page.selectOption('select:has-text("Sélectionner")', 'Literie & Matelas');
      await page.waitForTimeout(500);
      
      // Click on Options tab
      await page.click('text=Options');
      await page.waitForTimeout(500);
      
      // Check Matelas variant option is visible
      await expect(page.getByText('Activer les variantes (Dimensions)')).toBeVisible();
    });
  });

  test.describe('Featured Products Admin', () => {
    test('featured products admin page loads', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to Mise en avant
      await page.click('text=Mise en avant');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Check page elements
      await expect(page.getByText('Mise en avant des produits')).toBeVisible();
      await expect(page.getByRole('button', { name: /Produits à la une/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Nouveautés/i })).toBeVisible();
    });
  });
});

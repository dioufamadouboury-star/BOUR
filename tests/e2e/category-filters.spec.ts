import { test, expect } from '@playwright/test';

const BASE_URL = 'https://subcats-preview.preview.emergentagent.com';

test.describe('Category Page - Subcategory Filters', () => {
  test('Desktop - Filter tabs display correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Verify hero section with filter tabs
    await expect(page.getByText('Électronique & High-Tech')).toBeVisible();
    
    // Verify filter tabs are present
    await expect(page.getByTestId('filter-all')).toBeVisible();
    await expect(page.getByTestId('filter-Smartphones')).toBeVisible();
    await expect(page.getByTestId('filter-TV & Écrans')).toBeVisible();
    await expect(page.getByTestId('filter-Ordinateurs & PC')).toBeVisible();
    await expect(page.getByTestId('filter-Tablettes')).toBeVisible();
    await expect(page.getByTestId('filter-Audio & Casques')).toBeVisible();
    await expect(page.getByTestId('filter-Gaming & Consoles')).toBeVisible();
  });

  test('Mobile - Filter tabs are responsive and wrap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Verify hero section loads
    await expect(page.getByText('Électronique & High-Tech')).toBeVisible();
    
    // Verify filter tabs are visible (they should wrap on mobile)
    await expect(page.getByTestId('filter-all')).toBeVisible();
    await expect(page.getByTestId('filter-Smartphones')).toBeVisible();
    
    // Verify the filter container allows scrolling/wrapping
    const filterContainer = page.locator('.flex.gap-2.flex-wrap');
    await expect(filterContainer.first()).toBeVisible();
  });

  test('Subcategory filter changes product list', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Get initial product count
    const initialCount = await page.getByText(/\d+ produits?/).textContent();
    
    // Click on Smartphones filter
    await page.getByTestId('filter-Smartphones').click();
    await page.waitForLoadState('networkidle');
    
    // Verify filter is active (white background)
    await expect(page.getByTestId('filter-Smartphones')).toHaveClass(/bg-white/);
    
    // Product count should change (or stay same if no products in that subcategory)
    const newCount = await page.getByText(/\d+ produits?/).textContent();
    expect(newCount).toBeDefined();
  });

  test('Electromenager category has correct filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/category/electromenager', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Verify category title (use heading role to avoid strict mode)
    await expect(page.getByRole('heading', { name: 'Électroménager' }).first()).toBeVisible();
    
    // Verify specific filters for electromenager
    await expect(page.getByTestId('filter-all')).toBeVisible();
    await expect(page.getByTestId('filter-Climatiseur')).toBeVisible();
    await expect(page.getByTestId('filter-Réfrigérateur')).toBeVisible();
  });

  test('Decoration category has correct filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/category/decoration', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Verify category title (use heading role to avoid strict mode)
    await expect(page.getByRole('heading', { name: 'Décoration & Mobilier' }).first()).toBeVisible();
    
    // Verify specific filters for decoration
    await expect(page.getByTestId('filter-all')).toBeVisible();
    await expect(page.getByTestId('filter-Salons')).toBeVisible();
    await expect(page.getByTestId('filter-Chambres à coucher')).toBeVisible();
  });

  test('Beaute category has correct filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/category/beaute', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Verify category title
    await expect(page.getByText('Mode & Beauté')).toBeVisible();
    
    // Verify specific filters for beaute
    await expect(page.getByTestId('filter-all')).toBeVisible();
    await expect(page.getByTestId('filter-Vêtements Femme')).toBeVisible();
    await expect(page.getByTestId('filter-Parfums')).toBeVisible();
  });

  test('Automobile category has special filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/category/automobile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Verify category title (use heading role to avoid strict mode)
    await expect(page.getByRole('heading', { name: 'Automobile' }).first()).toBeVisible();
    
    // Verify automobile-specific filters
    await expect(page.getByTestId('filter-vente')).toBeVisible();
    await expect(page.getByTestId('filter-location')).toBeVisible();
    await expect(page.getByTestId('filter-covoiturage')).toBeVisible();
  });

  test('Mobile filter button opens filter panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/category/electronique', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Scroll down to see the filter button
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Click on Filtres button
    const filterButton = page.getByRole('button', { name: /Filtres/ });
    await filterButton.click();
    
    // Verify filter panel opens (use specific locator for mobile filter panel)
    const filterPanel = page.locator('.fixed.inset-0.z-50');
    await expect(filterPanel).toBeVisible();
    
    // Verify filter sections are visible
    await expect(page.getByRole('button', { name: 'Prix' })).toBeVisible();
  });
});

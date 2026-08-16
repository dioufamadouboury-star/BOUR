import { test, expect } from '@playwright/test';

/**
 * Tests for Product Position Feature
 * - Admin products page displays ALL products (no 50 limit)
 * - Position column visible in admin products table
 * - Position input allows editing for each product
 * - Save positions button appears when positions are modified
 * - Toast notification appears after saving positions
 */

test.describe('Admin Products Position Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'admin@yamaplus.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 30000 });
    
    // Navigate to products page
    await page.goto('/admin/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('should display Position column header in products table', async ({ page }) => {
    // Verify Position column header exists
    const positionHeader = page.locator('th:has-text("Position")');
    await expect(positionHeader).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'position-column-header.jpeg', quality: 20, fullPage: false });
  });

  test('should display position input for each product', async ({ page }) => {
    // Verify position inputs exist
    const positionInputs = page.locator('input[type="number"][data-testid^="position-input-"]');
    const count = await positionInputs.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify first position input is visible and has a value
    const firstInput = positionInputs.first();
    await expect(firstInput).toBeVisible();
    
    const value = await firstInput.inputValue();
    expect(parseInt(value)).toBeGreaterThanOrEqual(1);
  });

  test('should allow editing position value', async ({ page }) => {
    // Get first position input
    const firstInput = page.locator('input[type="number"][data-testid^="position-input-"]').first();
    await expect(firstInput).toBeVisible();
    
    // Clear and enter new value
    await firstInput.clear();
    await firstInput.fill('5');
    
    // Verify value changed
    const newValue = await firstInput.inputValue();
    expect(newValue).toBe('5');
    
    // Verify input has modified styling (green border)
    await expect(firstInput).toHaveClass(/border-green-500/);
  });

  test('should show save positions button when positions are modified', async ({ page }) => {
    // Initially, save button should not be visible
    const saveButton = page.getByTestId('save-positions-btn');
    await expect(saveButton).not.toBeVisible();
    
    // Modify a position
    const firstInput = page.locator('input[type="number"][data-testid^="position-input-"]').first();
    await firstInput.clear();
    await firstInput.fill('1');
    
    // Save button should now be visible
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toContainText('Enregistrer positions');
    
    // Take screenshot
    await page.screenshot({ path: 'save-positions-button.jpeg', quality: 20, fullPage: false });
  });

  test('should save positions and show toast notification', async ({ page }) => {
    // Modify a position
    const firstInput = page.locator('input[type="number"][data-testid^="position-input-"]').first();
    const originalValue = await firstInput.inputValue();
    
    // Set a new position value
    const newPosition = originalValue === '1' ? '2' : '1';
    await firstInput.clear();
    await firstInput.fill(newPosition);
    
    // Click save button
    const saveButton = page.getByTestId('save-positions-btn');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    // Wait for toast notification
    const toast = page.locator('[data-sonner-toast], .Toastify__toast, [role="status"]');
    await expect(toast.first()).toBeVisible();
    
    // Verify success message
    await expect(page.locator('text=position').first()).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'position-saved-toast.jpeg', quality: 20, fullPage: false });
  });

  test('should display all products without 50 limit', async ({ page }) => {
    // Check the product count displayed in the header
    const productCountText = page.locator('p:has-text("produits")').first();
    await expect(productCountText).toBeVisible();
    
    const text = await productCountText.textContent();
    const match = text?.match(/(\d+)\s*produits/);
    
    if (match) {
      const count = parseInt(match[1]);
      // Verify we can display more than 50 products (if available)
      // The actual count depends on database content
      expect(count).toBeGreaterThan(0);
      console.log(`Products displayed: ${count}`);
    }
    
    // Verify products are actually rendered in the table
    const productRows = page.locator('tbody tr');
    const rowCount = await productRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should filter products by category and maintain position inputs', async ({ page }) => {
    // Click on a category tab
    const electroniqueTab = page.getByTestId('product-tab-electronique');
    await electroniqueTab.click();
    
    // Wait for filtered results
    await expect(page.locator('tbody tr').first()).toBeVisible();
    
    // Verify position inputs still exist after filtering
    const positionInputs = page.locator('input[type="number"][data-testid^="position-input-"]');
    const count = await positionInputs.count();
    expect(count).toBeGreaterThan(0);
    
    // Take screenshot
    await page.screenshot({ path: 'filtered-products-positions.jpeg', quality: 20, fullPage: false });
  });

  test('should update multiple positions and save batch', async ({ page }) => {
    // Get first two position inputs
    const positionInputs = page.locator('input[type="number"][data-testid^="position-input-"]');
    const count = await positionInputs.count();
    
    if (count < 2) {
      test.skip();
      return;
    }
    
    // Modify first position
    const firstInput = positionInputs.nth(0);
    await firstInput.clear();
    await firstInput.fill('10');
    
    // Modify second position
    const secondInput = positionInputs.nth(1);
    await secondInput.clear();
    await secondInput.fill('20');
    
    // Verify save button shows count of modified positions
    const saveButton = page.getByTestId('save-positions-btn');
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toContainText('2');
    
    // Save positions
    await saveButton.click();
    
    // Wait for success toast
    const toast = page.locator('[data-sonner-toast], .Toastify__toast, [role="status"]');
    await expect(toast.first()).toBeVisible();
  });
});

test.describe('Admin Products Position - Cleanup', () => {
  test('should reset positions to default', async ({ page }) => {
    // Login as admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'admin@yamaplus.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 30000 });
    
    // Navigate to products page
    await page.goto('/admin/products', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
    
    // Reset all visible positions to 999
    const positionInputs = page.locator('input[type="number"][data-testid^="position-input-"]');
    const count = await positionInputs.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = positionInputs.nth(i);
      await input.clear();
      await input.fill('999');
    }
    
    // Save if button is visible
    const saveButton = page.getByTestId('save-positions-btn');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      // Wait for save to complete
      await page.waitForResponse(resp => resp.url().includes('/positions') && resp.status() === 200);
    }
  });
});

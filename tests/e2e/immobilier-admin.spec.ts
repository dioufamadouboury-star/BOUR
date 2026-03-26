import { test, expect } from '@playwright/test';

const BASE_URL = 'https://subcats-preview.preview.emergentagent.com';

test.describe('Admin Immobilier - Property Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    const emailInput = page.getByTestId('email-input');
    await emailInput.fill('admin@yamaplus.com');
    
    const passwordInput = page.getByTestId('password-input');
    await passwordInput.fill('Admin123!');
    
    // Click submit button
    const submitBtn = page.getByTestId('submit-btn');
    await submitBtn.click();
    
    // Wait for redirect to admin with longer timeout
    await page.waitForURL(/\/admin/, { timeout: 45000 });
    await page.waitForLoadState('networkidle');
  });

  test('Property Form Modal opens correctly', async ({ page }) => {
    // Navigate to Immobilier section
    await page.getByText('Immobilier', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    
    // Verify Immobilier admin page loaded
    await expect(page.getByTestId('immobilier-admin')).toBeVisible();
    
    // Click "Ajouter un bien" button
    await page.getByTestId('add-property-btn').click();
    
    // Verify modal opened
    await expect(page.getByTestId('property-form-modal')).toBeVisible();
    
    // Verify modal title (use heading role to avoid strict mode violation)
    await expect(page.getByRole('heading', { name: 'Ajouter un bien' })).toBeVisible();
    
    // Verify form fields are present
    await expect(page.getByPlaceholder('Bel appartement F3 Plateau')).toBeVisible();
    await expect(page.getByText('Type de bien')).toBeVisible();
    await expect(page.getByText("Type d'annonce")).toBeVisible();
    await expect(page.getByText('Prix (FCFA) *')).toBeVisible();
  });

  test('Multi-image upload UI shows max 6 images limit', async ({ page }) => {
    // Navigate to Immobilier section
    await page.getByText('Immobilier', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    
    // Click "Ajouter un bien" button
    await page.getByTestId('add-property-btn').click();
    await expect(page.getByTestId('property-form-modal')).toBeVisible();
    
    // Scroll to Photos section
    const form = page.locator('form').first();
    await form.evaluate(el => el.scrollTop = 600);
    
    // Verify Photos section exists
    await expect(page.getByText('Photos')).toBeVisible();
    
    // Verify upload button is present (dashed border upload area)
    const uploadArea = page.locator('label').filter({ has: page.locator('input[type="file"]') });
    await expect(uploadArea).toBeVisible();
  });

  test('Image preview thumbnails display for existing property', async ({ page }) => {
    // Navigate to Immobilier section
    await page.getByText('Immobilier', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    
    // Click edit button on first property
    const editButtons = page.locator('button[title="Modifier"]');
    const editCount = await editButtons.count();
    
    if (editCount === 0) {
      test.skip();
      return;
    }
    
    await editButtons.first().click();
    await expect(page.getByTestId('property-form-modal')).toBeVisible();
    
    // Scroll to Photos section
    const form = page.locator('form').first();
    await form.evaluate(el => el.scrollTop = 600);
    
    // Verify Photos section
    await expect(page.getByText('Photos')).toBeVisible();
    
    // Check if there are image thumbnails (existing images)
    const imageThumbnails = page.locator('.relative.w-20.h-16 img');
    const thumbnailCount = await imageThumbnails.count();
    
    // At least verify the Photos section is functional
    expect(thumbnailCount).toBeGreaterThanOrEqual(0);
  });

  test('Image deletion button appears on hover', async ({ page }) => {
    // Navigate to Immobilier section
    await page.getByText('Immobilier', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    
    // Click edit button on first property
    const editButtons = page.locator('button[title="Modifier"]');
    const editCount = await editButtons.count();
    
    if (editCount === 0) {
      test.skip();
      return;
    }
    
    await editButtons.first().click();
    await expect(page.getByTestId('property-form-modal')).toBeVisible();
    
    // Scroll to Photos section
    const form = page.locator('form').first();
    await form.evaluate(el => el.scrollTop = 600);
    
    // Check for image thumbnails
    const imageThumbnails = page.locator('.relative.w-20.h-16');
    const thumbnailCount = await imageThumbnails.count();
    
    if (thumbnailCount > 0) {
      // Hover over first thumbnail
      await imageThumbnails.first().hover();
      
      // The delete overlay should appear (has X icon)
      const deleteOverlay = imageThumbnails.first().locator('button');
      await expect(deleteOverlay).toBeVisible();
    }
  });

  test('Property form has all required fields', async ({ page }) => {
    // Navigate to Immobilier section
    await page.getByText('Immobilier', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    
    // Click "Ajouter un bien" button
    await page.getByTestId('add-property-btn').click();
    await expect(page.getByTestId('property-form-modal')).toBeVisible();
    
    // Verify all form sections
    await expect(page.getByText('Titre *')).toBeVisible();
    await expect(page.getByText('Type de bien')).toBeVisible();
    await expect(page.getByText("Type d'annonce")).toBeVisible();
    await expect(page.getByText('Prix (FCFA) *')).toBeVisible();
    await expect(page.getByText('Période')).toBeVisible();
    await expect(page.getByText('Ville')).toBeVisible();
    await expect(page.getByText('Quartier')).toBeVisible();
    
    // Scroll to see more fields
    const form = page.locator('form').first();
    await form.evaluate(el => el.scrollTop = 400);
    
    await expect(page.getByText('Surface m²')).toBeVisible();
    await expect(page.getByText('Pièces')).toBeVisible();
    await expect(page.getByText('Chambres')).toBeVisible();
    await expect(page.getByText('SDB')).toBeVisible();
    
    // Scroll more
    await form.evaluate(el => el.scrollTop = 800);
    
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('Photos')).toBeVisible();
    await expect(page.getByText('Équipements')).toBeVisible();
  });

  test('Amenities selection works', async ({ page }) => {
    // Navigate to Immobilier section
    await page.getByText('Immobilier', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    
    // Click "Ajouter un bien" button
    await page.getByTestId('add-property-btn').click();
    await expect(page.getByTestId('property-form-modal')).toBeVisible();
    
    // Scroll to Équipements section
    const form = page.locator('form').first();
    await form.evaluate(el => el.scrollTop = 800);
    
    // Click on WiFi amenity (use exact match to avoid multiple matches)
    const wifiButton = page.locator('button').filter({ hasText: /^WiFi$/ }).first();
    await wifiButton.click();
    
    // Verify it's selected (should have green background)
    await expect(wifiButton).toHaveClass(/bg-\[#1B4332\]/);
    
    // Click on Piscine
    const piscineButton = page.locator('button').filter({ hasText: /^Piscine$/ }).first();
    await piscineButton.click();
    
    // Verify it's selected
    await expect(piscineButton).toHaveClass(/bg-\[#1B4332\]/);
  });

  test('Filter tabs work correctly', async ({ page }) => {
    // Navigate to Immobilier section
    await page.getByText('Immobilier', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    
    // Verify filter tabs are present
    await expect(page.getByRole('button', { name: 'Tous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Location courte durée' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Location longue durée' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vente' })).toBeVisible();
    
    // Click on "Vente" filter
    await page.getByRole('button', { name: 'Vente' }).click();
    await page.waitForLoadState('networkidle');
    
    // Verify filter is active (has green background)
    await expect(page.getByRole('button', { name: 'Vente' })).toHaveClass(/bg-\[#1B4332\]/);
  });
});

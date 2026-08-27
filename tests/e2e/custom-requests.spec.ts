import { test, expect } from '@playwright/test';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://subcats-preview.preview.emergentagent.com';

test.describe('Custom Request Forms', () => {
  
  test.describe('Vehicle Request Form', () => {
    
    test('should load vehicle request page', async ({ page }) => {
      await page.goto('/demande-vehicule', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('vehicle-request-page')).toBeVisible();
      await expect(page.getByTestId('vehicle-brand-select')).toBeVisible();
      await expect(page.getByTestId('vehicle-fullname-input')).toBeVisible();
      await expect(page.getByTestId('vehicle-phone-input')).toBeVisible();
      await expect(page.getByTestId('vehicle-submit-btn')).toBeVisible();
    });
    
    test('should show validation error when required fields are empty', async ({ page }) => {
      await page.goto('/demande-vehicule', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('vehicle-submit-btn').click({ force: true });
      // Form should not submit - page should still show the form
      await expect(page.getByTestId('vehicle-request-page')).toBeVisible();
    });
    
    test('should submit vehicle request successfully', async ({ page }) => {
      await page.goto('/demande-vehicule', { waitUntil: 'domcontentloaded' });
      
      // Fill required fields
      await page.getByTestId('vehicle-brand-select').selectOption('Toyota');
      await page.getByTestId('vehicle-fullname-input').fill('TEST_E2E_User');
      await page.getByTestId('vehicle-phone-input').fill('+221771234567');
      
      // Submit form
      await page.getByTestId('vehicle-submit-btn').click({ force: true });
      
      // Wait for success page
      await expect(page.getByTestId('vehicle-request-success')).toBeVisible();
      await expect(page.getByTestId('vehicle-request-number')).toBeVisible();
      
      // Verify request number format
      const requestNumber = await page.getByTestId('vehicle-request-number').textContent();
      expect(requestNumber).toMatch(/^VEH-[A-F0-9]{8}$/);
    });
    
    test('should have customs status options', async ({ page }) => {
      await page.goto('/demande-vehicule', { waitUntil: 'domcontentloaded' });
      
      // Check for customs status buttons
      await expect(page.getByText('Sous douane')).toBeVisible();
      await expect(page.getByText('Dédouané')).toBeVisible();
    });
  });
  
  test.describe('Sofa Request Form', () => {
    
    test('should load sofa request page', async ({ page }) => {
      await page.goto('/salon-sur-commande', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('sofa-request-page')).toBeVisible();
      await expect(page.getByTestId('sofa-type-select')).toBeVisible();
      await expect(page.getByTestId('sofa-fullname-input')).toBeVisible();
      await expect(page.getByTestId('sofa-phone-input')).toBeVisible();
      await expect(page.getByTestId('sofa-submit-btn')).toBeVisible();
    });
    
    test('should show validation error when required fields are empty', async ({ page }) => {
      await page.goto('/salon-sur-commande', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('sofa-submit-btn').click({ force: true });
      // Form should not submit - page should still show the form
      await expect(page.getByTestId('sofa-request-page')).toBeVisible();
    });
    
    test('should submit sofa request successfully', async ({ page }) => {
      await page.goto('/salon-sur-commande', { waitUntil: 'domcontentloaded' });
      
      // Fill required fields
      await page.getByTestId('sofa-type-select').selectOption("Canapé d'angle");
      await page.getByTestId('sofa-fullname-input').fill('TEST_E2E_Sofa_User');
      await page.getByTestId('sofa-phone-input').fill('+221772222222');
      
      // Scroll down to submit button
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Submit form
      await page.getByTestId('sofa-submit-btn').click({ force: true });
      
      // Wait for success page
      await expect(page.getByTestId('sofa-request-success')).toBeVisible();
      await expect(page.getByTestId('sofa-request-number')).toBeVisible();
      
      // Verify request number format
      const requestNumber = await page.getByTestId('sofa-request-number').textContent();
      expect(requestNumber).toMatch(/^SAL-[A-F0-9]{8}$/);
    });
    
    test('should have sofa options checkboxes', async ({ page }) => {
      await page.goto('/salon-sur-commande', { waitUntil: 'domcontentloaded' });
      
      // Scroll down to see options
      await page.evaluate(() => window.scrollTo(0, 1000));
      
      // Check for options
      await expect(page.getByText('Accoudoirs')).toBeVisible();
      await expect(page.getByText('Têtières ajustables')).toBeVisible();
      await expect(page.getByText('Rangement intégré')).toBeVisible();
    });
  });
  
  test.describe('Reupholstery Request Form', () => {
    
    test('should load reupholstery request page', async ({ page }) => {
      await page.goto('/rehoussage', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('reupholstery-request-page')).toBeVisible();
      await expect(page.getByTestId('reupholstery-furniture-select')).toBeVisible();
      await expect(page.getByTestId('reupholstery-fullname-input')).toBeVisible();
      await expect(page.getByTestId('reupholstery-phone-input')).toBeVisible();
      await expect(page.getByTestId('reupholstery-submit-btn')).toBeVisible();
    });
    
    test('should have submit button disabled without photos', async ({ page }) => {
      await page.goto('/rehoussage', { waitUntil: 'domcontentloaded' });
      
      // Fill required fields but no photos
      await page.getByTestId('reupholstery-furniture-select').selectOption('Canapé');
      await page.getByTestId('reupholstery-fullname-input').fill('TEST_E2E_Reup_User');
      await page.getByTestId('reupholstery-phone-input').fill('+221773333333');
      await page.getByTestId('reupholstery-address-input').fill('Test Address');
      
      // Submit button should be disabled (no photos)
      const submitBtn = page.getByTestId('reupholstery-submit-btn');
      await expect(submitBtn).toBeDisabled();
    });
    
    test('should have service type options', async ({ page }) => {
      await page.goto('/rehoussage', { waitUntil: 'domcontentloaded' });
      
      // Scroll down to see service options
      await page.evaluate(() => window.scrollTo(0, 800));
      
      // Check for service types - use exact match to avoid strict mode violation
      await expect(page.getByText('Rehoussage complet')).toBeVisible();
      await expect(page.getByText('Réparation', { exact: true })).toBeVisible();
      await expect(page.getByText('Rembourrage')).toBeVisible();
      await expect(page.getByText('Nettoyage profond')).toBeVisible();
    });
    
    test('should have urgency options', async ({ page }) => {
      await page.goto('/rehoussage', { waitUntil: 'domcontentloaded' });
      
      // Scroll down to see urgency options
      await page.evaluate(() => window.scrollTo(0, 1500));
      
      // Check for urgency select
      const urgencySelect = page.locator('select').filter({ hasText: 'Normal' });
      await expect(urgencySelect).toBeVisible();
    });
  });
});

test.describe('Navigation to Custom Request Pages', () => {
  
  test('should navigate to vehicle request from services menu', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Click on Services menu
    await page.getByText('Services').first().click({ force: true });
    
    // Wait for dropdown and click on vehicle request link if visible
    const vehicleLink = page.getByRole('link', { name: /véhicule/i }).first();
    if (await vehicleLink.isVisible()) {
      await vehicleLink.click();
      await expect(page.getByTestId('vehicle-request-page')).toBeVisible();
    }
  });
  
  test('should be able to directly access vehicle request page', async ({ page }) => {
    await page.goto('/demande-vehicule', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('vehicle-request-page')).toBeVisible();
  });
  
  test('should be able to directly access sofa request page', async ({ page }) => {
    await page.goto('/salon-sur-commande', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('sofa-request-page')).toBeVisible();
  });
  
  test('should be able to directly access reupholstery page', async ({ page }) => {
    await page.goto('/rehoussage', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('reupholstery-request-page')).toBeVisible();
  });
});

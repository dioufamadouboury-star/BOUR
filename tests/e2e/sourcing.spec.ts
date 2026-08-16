import { test, expect } from '@playwright/test';

/**
 * Sourcing Page Tests (China Import)
 * Tests: Rates display, Calculator, Request form, Tracking
 */

test.describe('Sourcing Page - Rates Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sourcing', { waitUntil: 'domcontentloaded' });
  });

  test('should load sourcing page with hero section', async ({ page }) => {
    // Check hero content
    await expect(page.getByText('Commandez en Chine')).toBeVisible();
    await expect(page.getByText('Recevez à Dakar')).toBeVisible();
    
    // Check quick stats
    await expect(page.getByText('Avion: 8-16 jours')).toBeVisible();
    await expect(page.getByText('Maritime: 30-45 jours')).toBeVisible();
    await expect(page.getByText('Douane incluse')).toBeVisible();
    
    await page.screenshot({ path: 'sourcing-hero.jpeg', quality: 20, fullPage: false });
  });

  test('should display shipping rates tabs', async ({ page }) => {
    // Check tabs are visible
    await expect(page.getByRole('button', { name: /Tarifs/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Calculateur/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Commander/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Suivi/i })).toBeVisible();
  });

  test('should display shipping methods on rates tab', async ({ page }) => {
    // Default tab should be info/rates
    await expect(page.getByText('Tarifs Transport Chine → Sénégal')).toBeVisible();
    
    // Check shipping methods are displayed
    await expect(page.getByText('Avion - Marchandise Générale')).toBeVisible();
    await expect(page.getByText('Avion - Marchandise Sensible')).toBeVisible();
    await expect(page.getByText('Maritime (par CBM)')).toBeVisible();
    
    await page.screenshot({ path: 'sourcing-rates.jpeg', quality: 20, fullPage: false });
  });

  test('should expand shipping method to show rates', async ({ page }) => {
    // Click on air general to expand
    await page.getByText('Avion - Marchandise Générale').click();
    
    // Should show rate tiers
    await expect(page.getByText('0-10 KG')).toBeVisible();
    await expect(page.getByText('8 000 FCFA/KG')).toBeVisible();
  });
});

test.describe('Sourcing Page - Calculator Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sourcing', { waitUntil: 'domcontentloaded' });
    // Click calculator tab
    await page.getByRole('button', { name: /Calculateur/i }).click();
  });

  test('should display calculator form', async ({ page }) => {
    await expect(page.getByText('Calculateur de frais')).toBeVisible();
    await expect(page.getByPlaceholder('Ex: 5.5')).toBeVisible();
    
    await page.screenshot({ path: 'sourcing-calculator.jpeg', quality: 20, fullPage: false });
  });

  test('should calculate shipping cost', async ({ page }) => {
    // Enter weight
    await page.getByPlaceholder('Ex: 5.5').fill('10');
    
    // Click calculate button
    await page.getByRole('button', { name: /Calculer/i }).click();
    
    // Wait for result
    await expect(page.getByText('Estimation des frais')).toBeVisible();
    await expect(page.getByText('Poids facturé:')).toBeVisible();
    
    // Should show calculated cost (10kg * 8000 = 80000)
    await expect(page.getByText(/80[\s,]?000 FCFA/)).toBeVisible();
    
    await page.screenshot({ path: 'sourcing-calc-result.jpeg', quality: 20, fullPage: false });
  });

  test('should show error for empty weight', async ({ page }) => {
    // Click calculate without entering weight
    await page.getByRole('button', { name: /Calculer/i }).click();
    
    // Should show error
    await expect(page.getByText(/Veuillez entrer un poids/i)).toBeVisible();
  });

  test('should calculate with phone surcharge', async ({ page }) => {
    // Enter weight
    await page.getByPlaceholder('Ex: 5.5').fill('5');
    
    // Select sensitive method
    await page.locator('select').selectOption('air_sensitive');
    
    // Enter number of phones
    const phoneInput = page.locator('input[type="number"]').nth(1);
    await phoneInput.fill('3');
    
    // Calculate
    await page.getByRole('button', { name: /Calculer/i }).click();
    
    // Should show result
    await expect(page.getByText('Estimation des frais')).toBeVisible();
  });
});

test.describe('Sourcing Page - Request Form Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sourcing', { waitUntil: 'domcontentloaded' });
    // Click request tab
    await page.getByRole('button', { name: /Commander/i }).click();
  });

  test('should display request form', async ({ page }) => {
    await expect(page.getByText('Demander un import')).toBeVisible();
    await expect(page.getByText('Vos informations')).toBeVisible();
    await expect(page.getByText('Informations produit')).toBeVisible();
    
    await page.screenshot({ path: 'sourcing-request-form.jpeg', quality: 20, fullPage: false });
  });

  test('should have required form fields', async ({ page }) => {
    // Customer info fields
    await expect(page.getByPlaceholder(/Nom complet/i).or(page.locator('input[required]').first())).toBeVisible();
    
    // Product link field
    await expect(page.getByPlaceholder('https://...')).toBeVisible();
  });

  test('should submit request form successfully', async ({ page }) => {
    const uniqueId = Date.now().toString().slice(-6);
    
    // Fill customer info
    const nameInput = page.locator('input').filter({ hasText: '' }).first();
    await page.locator('input[type="text"]').first().fill(`TEST_Customer_${uniqueId}`);
    
    // Fill phone
    await page.locator('input[type="tel"]').fill('+221 77 123 4567');
    
    // Fill email
    await page.locator('input[type="email"]').fill(`test_${uniqueId}@example.com`);
    
    // Fill product link
    await page.getByPlaceholder('https://...').fill('https://aliexpress.com/item/test123');
    
    // Fill quantity
    const quantityInput = page.locator('input[type="number"][min="1"]');
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('2');
    }
    
    // Submit form
    await page.getByRole('button', { name: /Envoyer ma demande/i }).click();
    
    // Should show success message
    await expect(page.getByText(/Demande envoyée/i)).toBeVisible();
  });
});

test.describe('Sourcing Page - Tracking Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sourcing', { waitUntil: 'domcontentloaded' });
    // Click tracking tab
    await page.getByRole('button', { name: /Suivi/i }).click();
  });

  test('should display tracking form', async ({ page }) => {
    await expect(page.getByText('Suivi de commande')).toBeVisible();
    await expect(page.getByPlaceholder('IMP-XXXXXXXX')).toBeVisible();
    
    await page.screenshot({ path: 'sourcing-tracking.jpeg', quality: 20, fullPage: false });
  });

  test('should show error for non-existent tracking ID', async ({ page }) => {
    // Enter invalid tracking ID
    await page.getByPlaceholder('IMP-XXXXXXXX').fill('IMP-NONEXISTENT');
    
    // Click search
    await page.getByRole('button', { name: /Rechercher/i }).click();
    
    // Should show error
    await expect(page.getByText(/non trouvée/i).or(page.getByText(/Erreur/i))).toBeVisible();
  });

  test('should show error for empty tracking ID', async ({ page }) => {
    // Click search without entering ID
    await page.getByRole('button', { name: /Rechercher/i }).click();
    
    // Should show error
    await expect(page.getByText(/Veuillez entrer/i)).toBeVisible();
  });
});

test.describe('Sourcing Page - Contact Section', () => {
  test('should display contact section', async ({ page }) => {
    await page.goto('/sourcing', { waitUntil: 'domcontentloaded' });
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check contact section
    await expect(page.getByText("Besoin d'aide?")).toBeVisible();
    await expect(page.getByRole('link', { name: /WhatsApp/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Email/i })).toBeVisible();
  });
});

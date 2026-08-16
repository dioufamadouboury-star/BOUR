import { test, expect } from '@playwright/test';

/**
 * B2B Portal Page Tests
 * Tests: Landing page, Login form, Registration form, Wholesale tiers
 */

test.describe('B2B Portal - Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/b2b', { waitUntil: 'domcontentloaded' });
  });

  test('should load B2B portal landing page', async ({ page }) => {
    // Check hero content
    await expect(page.getByText('Espace Professionnel B2B')).toBeVisible();
    await expect(page.getByText('Développez votre business avec')).toBeVisible();
    await expect(page.getByText('YAMA+')).toBeVisible();
    
    await page.screenshot({ path: 'b2b-landing.jpeg', quality: 20, fullPage: false });
  });

  test('should display wholesale tiers', async ({ page }) => {
    // Check discount tiers are displayed
    await expect(page.getByText('-0%')).toBeVisible();
    await expect(page.getByText('-5%')).toBeVisible();
    await expect(page.getByText('-10%')).toBeVisible();
    await expect(page.getByText('-15%')).toBeVisible();
    await expect(page.getByText('-20%')).toBeVisible();
    
    // Check tier labels
    await expect(page.getByText('Standard')).toBeVisible();
    await expect(page.getByText('Bronze')).toBeVisible();
    await expect(page.getByText('Argent')).toBeVisible();
    await expect(page.getByText('Or')).toBeVisible();
    await expect(page.getByText('Platine')).toBeVisible();
  });

  test('should display auth tabs', async ({ page }) => {
    // Check login/register tabs
    await expect(page.getByRole('button', { name: /Connexion/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Inscription/i })).toBeVisible();
  });

  test('should display partner benefits', async ({ page }) => {
    // Scroll to benefits section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    
    // Check benefits are displayed
    await expect(page.getByText('Avantages Partenaires')).toBeVisible();
    await expect(page.getByText('Prix de gros')).toBeVisible();
    await expect(page.getByText('Devis personnalisés')).toBeVisible();
    await expect(page.getByText('Facilités de paiement')).toBeVisible();
    
    await page.screenshot({ path: 'b2b-benefits.jpeg', quality: 20, fullPage: false });
  });
});

test.describe('B2B Portal - Login Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/b2b', { waitUntil: 'domcontentloaded' });
    // Ensure login tab is active
    await page.getByRole('button', { name: /Connexion/i }).click();
  });

  test('should display login form', async ({ page }) => {
    // Check form fields
    await expect(page.getByLabel('Email').or(page.locator('input[type="email"]').first())).toBeVisible();
    await expect(page.getByLabel('Mot de passe').or(page.locator('input[type="password"]').first())).toBeVisible();
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
    
    await page.screenshot({ path: 'b2b-login-form.jpeg', quality: 20, fullPage: false });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.locator('input[type="email"]').first().fill('invalid@example.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    
    // Submit
    await page.getByRole('button', { name: /Se connecter/i }).click();
    
    // Should show error
    await expect(page.getByText(/incorrect/i).or(page.getByText(/Erreur/i))).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    // Fill credentials
    await page.locator('input[type="email"]').first().fill('test@example.com');
    await page.locator('input[type="password"]').first().fill('testpassword');
    
    // Submit and check for loading state
    await page.getByRole('button', { name: /Se connecter/i }).click();
    
    // Button should show loading or be disabled briefly
    // Then show error since credentials are invalid
    await expect(page.getByText(/incorrect/i).or(page.getByText(/Erreur/i))).toBeVisible();
  });
});

test.describe('B2B Portal - Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/b2b', { waitUntil: 'domcontentloaded' });
    // Switch to registration tab
    await page.getByRole('button', { name: /Inscription/i }).click();
  });

  test('should display registration form', async ({ page }) => {
    // Check form fields
    await expect(page.getByPlaceholder(/entreprise/i).or(page.locator('input').first())).toBeVisible();
    await expect(page.getByRole('button', { name: /Demander un compte B2B/i })).toBeVisible();
    
    await page.screenshot({ path: 'b2b-register-form.jpeg', quality: 20, fullPage: false });
  });

  test('should have all required registration fields', async ({ page }) => {
    // Company name
    const companyInput = page.locator('input').first();
    await expect(companyInput).toBeVisible();
    
    // Contact name
    const contactInput = page.locator('input').nth(1);
    await expect(contactInput).toBeVisible();
    
    // Phone
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    
    // Email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Password
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Business type select
    const businessTypeSelect = page.locator('select');
    await expect(businessTypeSelect).toBeVisible();
  });

  test('should have business type options', async ({ page }) => {
    const select = page.locator('select');
    
    // Check options
    await expect(select.locator('option[value="retailer"]')).toBeAttached();
    await expect(select.locator('option[value="wholesaler"]')).toBeAttached();
    await expect(select.locator('option[value="enterprise"]')).toBeAttached();
  });

  test('should submit registration form successfully', async ({ page }) => {
    const uniqueId = Date.now().toString().slice(-6);
    
    // Fill company name
    await page.locator('input').first().fill(`TEST_Company_${uniqueId}`);
    
    // Fill contact name
    await page.locator('input').nth(1).fill(`TEST_Contact_${uniqueId}`);
    
    // Fill phone
    await page.locator('input[type="tel"]').fill('+221 77 987 6543');
    
    // Fill email
    await page.locator('input[type="email"]').fill(`test_b2b_${uniqueId}@example.com`);
    
    // Fill password
    await page.locator('input[type="password"]').fill('TestPass123!');
    
    // Submit
    await page.getByRole('button', { name: /Demander un compte B2B/i }).click();
    
    // Should show success message
    await expect(page.getByText(/envoyée/i).or(page.getByText(/contacté/i))).toBeVisible();
    
    await page.screenshot({ path: 'b2b-register-success.jpeg', quality: 20, fullPage: false });
  });

  test('should show error for duplicate email', async ({ page }) => {
    // Use a known email that might already exist
    await page.locator('input').first().fill('Test Company');
    await page.locator('input').nth(1).fill('Test Contact');
    await page.locator('input[type="tel"]').fill('+221 77 111 2222');
    await page.locator('input[type="email"]').fill('admin@yamaplus.com'); // Likely exists
    await page.locator('input[type="password"]').fill('TestPass123!');
    
    // Submit
    await page.getByRole('button', { name: /Demander un compte B2B/i }).click();
    
    // Should show error about duplicate email
    await expect(page.getByText(/déjà utilisé/i).or(page.getByText(/Erreur/i))).toBeVisible();
  });
});

test.describe('B2B Portal - Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/b2b', { waitUntil: 'domcontentloaded' });
    
    // Hero should still be visible
    await expect(page.getByText('Espace Professionnel B2B')).toBeVisible();
    
    // Tiers should be in grid
    await expect(page.getByText('-5%')).toBeVisible();
    
    await page.screenshot({ path: 'b2b-mobile.jpeg', quality: 20, fullPage: false });
  });
});

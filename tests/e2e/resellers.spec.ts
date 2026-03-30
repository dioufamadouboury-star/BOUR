import { test, expect } from '@playwright/test';

/**
 * Reseller System E2E Tests
 * Tests: Admin reseller management, Reseller portal, Referral code capture
 */

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://subcats-preview.preview.emergentagent.com';

// Helper function for admin login
async function loginAsAdmin(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('email-input').fill('admin@yamaplus.com');
  await page.getByTestId('password-input').fill('Admin123!');
  await page.getByTestId('submit-btn').click();
  // Wait for either admin URL or dashboard element
  await Promise.race([
    page.waitForURL(/\/admin/, { timeout: 25000 }),
    page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 25000 }).catch(() => {}),
    page.waitForSelector('text=Tableau de bord', { timeout: 25000 }).catch(() => {})
  ]);
}

test.describe('Admin Resellers Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should navigate to Resellers admin page', async ({ page }) => {
    // Navigate to resellers page
    await page.goto('/admin/resellers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page loaded
    await expect(page.getByTestId('resellers-admin')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Programme Revendeurs' })).toBeVisible();
    
    await page.screenshot({ path: 'resellers-admin-page.jpeg', quality: 20, fullPage: false });
  });

  test('should display reseller stats cards', async ({ page }) => {
    await page.goto('/admin/resellers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for stats to load
    await expect(page.getByTestId('resellers-admin')).toBeVisible();
    
    // Check stats cards are visible (by text content)
    await expect(page.getByText('actifs').first()).toBeVisible();
    await expect(page.getByText('Ventes totales')).toBeVisible();
    await expect(page.getByText('Commissions totales')).toBeVisible();
    await expect(page.getByText('À verser')).toBeVisible();
  });

  test('should open create reseller modal', async ({ page }) => {
    await page.goto('/admin/resellers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click new reseller button
    await page.getByRole('button', { name: /Nouveau Revendeur/i }).click();
    
    // Verify modal opened - use heading to be specific
    await expect(page.getByRole('heading', { name: 'Nouveau Revendeur' })).toBeVisible();
    await expect(page.getByPlaceholder('Jean Dupont')).toBeVisible();
    await expect(page.getByPlaceholder('jean@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('+221 77 123 45 67')).toBeVisible();
    
    await page.screenshot({ path: 'resellers-create-modal.jpeg', quality: 20, fullPage: false });
  });

  test('should create a new reseller', async ({ page }) => {
    await page.goto('/admin/resellers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Generate unique test data
    const uniqueId = Date.now().toString().slice(-6);
    const testName = `TEST_Reseller_${uniqueId}`;
    const testEmail = `test_reseller_${uniqueId}@example.com`;
    const testPhone = `+221 77 ${uniqueId}`;
    
    // Click new reseller button
    await page.getByRole('button', { name: /Nouveau Revendeur/i }).click();
    
    // Fill form
    await page.getByPlaceholder('Jean Dupont').fill(testName);
    await page.getByPlaceholder('jean@example.com').fill(testEmail);
    await page.getByPlaceholder('+221 77 123 45 67').fill(testPhone);
    
    // Submit
    await page.getByRole('button', { name: 'Créer' }).click();
    
    // Wait for success toast
    await expect(page.locator('[data-sonner-toast]').filter({ hasText: /créé/i })).toBeVisible({ timeout: 10000 });
    
    // Verify reseller appears in list - use heading to be specific
    await expect(page.getByRole('heading', { name: testName })).toBeVisible();
    
    await page.screenshot({ path: 'resellers-created.jpeg', quality: 20, fullPage: false });
  });

  test('should show validation error for missing fields', async ({ page }) => {
    await page.goto('/admin/resellers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click new reseller button
    await page.getByRole('button', { name: /Nouveau Revendeur/i }).click();
    
    // Try to submit without filling fields
    await page.getByRole('button', { name: 'Créer' }).click();
    
    // Should show error toast
    await expect(page.locator('[data-sonner-toast]').filter({ hasText: /requis/i })).toBeVisible({ timeout: 5000 });
  });

  test('should toggle reseller active status', async ({ page }) => {
    await page.goto('/admin/resellers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for resellers list to load
    await expect(page.getByTestId('resellers-admin')).toBeVisible();
    
    // Check if there are any resellers in the list
    const resellerCards = page.locator('.bg-white.dark\\:bg-gray-800.rounded-xl.p-5.border');
    const count = await resellerCards.count();
    
    if (count > 0) {
      // Find a toggle button (X or Check icon)
      const toggleButton = resellerCards.first().locator('button').filter({ has: page.locator('svg') }).last();
      await toggleButton.click({ force: true });
      
      // Should show success toast
      await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should copy reseller referral link', async ({ page }) => {
    await page.goto('/admin/resellers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for resellers list to load
    await expect(page.getByTestId('resellers-admin')).toBeVisible();
    
    // Check if there are any resellers in the list
    const resellerCards = page.locator('.bg-white.dark\\:bg-gray-800.rounded-xl.p-5.border');
    const count = await resellerCards.count();
    
    if (count > 0) {
      // Find copy link button (Link2 icon)
      const copyButton = resellerCards.first().locator('button[title="Copier le lien"]');
      await copyButton.click({ force: true });
      
      // Should show success toast
      await expect(page.locator('[data-sonner-toast]').filter({ hasText: /copié/i })).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have Revendeurs menu item in sidebar', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Check sidebar has Revendeurs link
    await expect(page.getByRole('link', { name: 'Revendeurs' })).toBeVisible();
    
    await page.screenshot({ path: 'admin-sidebar-resellers.jpeg', quality: 20, fullPage: false });
  });

  test('should navigate to resellers page from sidebar', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Click Revendeurs link
    await page.getByRole('link', { name: 'Revendeurs' }).click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/admin\/resellers/);
    await expect(page.getByTestId('resellers-admin')).toBeVisible();
  });
});

test.describe('Reseller Portal Login', () => {
  test('should display reseller login page', async ({ page }) => {
    await page.goto('/reseller/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify login form is visible
    await expect(page.getByText('Portail Revendeurs')).toBeVisible();
    await expect(page.getByText('Connectez-vous pour accéder à votre espace')).toBeVisible();
    await expect(page.getByPlaceholder('votre@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    
    await page.screenshot({ path: 'reseller-login-page.jpeg', quality: 20, fullPage: false });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/reseller/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Fill invalid credentials
    await page.getByPlaceholder('votre@email.com').fill('invalid@example.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    
    // Submit
    await page.getByRole('button', { name: 'Se connecter' }).click();
    
    // Should show error toast
    await expect(page.locator('[data-sonner-toast]').filter({ hasText: /incorrect/i })).toBeVisible({ timeout: 10000 });
  });

  test('should have contact link for non-resellers', async ({ page }) => {
    await page.goto('/reseller/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Check for contact link
    await expect(page.getByText('Pas encore revendeur ?')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contactez-nous' })).toBeVisible();
  });
});

test.describe('Referral Code Capture', () => {
  test('should capture referral code from /r/:code URL', async ({ page }) => {
    // Visit referral URL
    await page.goto('/r/TESTCODE123', { waitUntil: 'domcontentloaded' });
    
    // Should show redirect message
    await expect(page.getByText('Redirection en cours...')).toBeVisible();
    await expect(page.getByText('Code partenaire:')).toBeVisible();
    await expect(page.getByText('TESTCODE123')).toBeVisible();
    
    await page.screenshot({ path: 'referral-redirect.jpeg', quality: 20, fullPage: false });
    
    // Wait for redirect to homepage
    await page.waitForURL('/', { timeout: 5000 });
    
    // Verify code was stored in localStorage
    const storedCode = await page.evaluate(() => localStorage.getItem('reseller_code'));
    expect(storedCode).toBe('TESTCODE123');
    
    const storedExpiry = await page.evaluate(() => localStorage.getItem('reseller_code_expiry'));
    expect(storedExpiry).toBeTruthy();
  });

  test('should store referral code with 30-day expiry', async ({ page }) => {
    // Visit referral URL
    await page.goto('/r/EXPTEST456', { waitUntil: 'domcontentloaded' });
    
    // Wait for redirect
    await page.waitForURL('/', { timeout: 5000 });
    
    // Verify expiry is approximately 30 days from now
    const storedExpiry = await page.evaluate(() => localStorage.getItem('reseller_code_expiry'));
    const expiryDate = new Date(storedExpiry);
    const now = new Date();
    const daysDiff = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    expect(daysDiff).toBeGreaterThanOrEqual(29);
    expect(daysDiff).toBeLessThanOrEqual(31);
  });
});

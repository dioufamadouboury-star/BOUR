import { test, expect } from '@playwright/test';

const BASE_URL = 'https://subcats-preview.preview.emergentagent.com';

test.describe('Login Page - Mobile Responsive', () => {
  test('Mobile - Logo is properly sized', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // On mobile, only the right panel logo is visible (left panel is hidden)
    // The visible logo is inside the form section
    const logo = page.locator('.w-full.lg\\:w-\\[42\\%\\] img[alt="GROUPE YAMA+"]');
    await expect(logo).toBeVisible();
    
    // Get logo dimensions
    const boundingBox = await logo.boundingBox();
    expect(boundingBox).not.toBeNull();
    
    // Logo should be h-20 (80px) on mobile according to the code
    // Allow some tolerance for rendering differences
    expect(boundingBox!.height).toBeGreaterThanOrEqual(70);
    expect(boundingBox!.height).toBeLessThanOrEqual(90);
  });

  test('Desktop - Logo is properly sized', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // On desktop, the right panel logo should be h-16 (64px)
    // The left panel has a larger logo
    const rightPanelLogo = page.locator('.lg\\:w-\\[42\\%\\] img[alt="GROUPE YAMA+"]');
    await expect(rightPanelLogo).toBeVisible();
    
    const boundingBox = await rightPanelLogo.boundingBox();
    expect(boundingBox).not.toBeNull();
    
    // Logo should be h-16 (64px) on desktop
    expect(boundingBox!.height).toBeGreaterThanOrEqual(55);
    expect(boundingBox!.height).toBeLessThanOrEqual(75);
  });

  test('Mobile - Login form is fully visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Verify all form elements are visible
    await expect(page.getByText('Bienvenue sur YAMA+')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('submit-btn')).toBeVisible();
    await expect(page.getByTestId('google-login-btn')).toBeVisible();
    await expect(page.getByTestId('toggle-auth-btn')).toBeVisible();
  });

  test('Mobile - Left panel is hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // The left panel with background image should be hidden on mobile
    const leftPanel = page.locator('.lg\\:flex.lg\\:w-\\[58\\%\\]');
    await expect(leftPanel).toBeHidden();
  });

  test('Desktop - Both panels are visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Left panel should be visible on desktop
    const leftPanel = page.locator('.lg\\:flex.lg\\:w-\\[58\\%\\]').first();
    await expect(leftPanel).toBeVisible();
    
    // Right panel should also be visible
    const rightPanel = page.locator('.lg\\:w-\\[42\\%\\]');
    await expect(rightPanel).toBeVisible();
  });

  test('Mobile - Toggle between login and register', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Initially in login mode
    await expect(page.getByText('Bienvenue sur YAMA+')).toBeVisible();
    await expect(page.getByTestId('submit-btn')).toContainText('Se connecter');
    
    // Click to switch to register
    await page.getByTestId('toggle-auth-btn').click();
    
    // Verify register mode
    await expect(page.getByText('Créer un compte')).toBeVisible();
    await expect(page.getByTestId('name-input')).toBeVisible();
    await expect(page.getByTestId('phone-input')).toBeVisible();
    await expect(page.getByTestId('submit-btn')).toContainText('Créer mon compte');
  });

  test('Small mobile - Logo still visible', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    // Verify logo is visible even on small screens (right panel logo)
    const logo = page.locator('.w-full.lg\\:w-\\[42\\%\\] img[alt="GROUPE YAMA+"]');
    await expect(logo).toBeVisible();
    
    // Verify form is still usable
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('submit-btn')).toBeVisible();
  });
});

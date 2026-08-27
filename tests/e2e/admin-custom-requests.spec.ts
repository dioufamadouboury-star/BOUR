import { test, expect } from '@playwright/test';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://subcats-preview.preview.emergentagent.com';

test.describe('Admin Custom Requests Dashboard', () => {
  
  test('should access admin custom requests page after login', async ({ page }) => {
    // Login as admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Fill login form
    await page.getByPlaceholder('Email ou numéro').fill('admin@yamaplus.com');
    await page.getByPlaceholder('Mot de passe').fill('Admin123!');
    await page.getByRole('button', { name: 'Se connecter' }).click({ force: true });
    
    // Wait for login to complete - look for admin dashboard elements
    await expect(page.getByText('Administration')).toBeVisible();
    
    // Navigate to admin custom requests by clicking sidebar
    await page.getByText('Demandes spéciales').click({ force: true });
    
    // Wait for the admin component to load
    await expect(page.getByTestId('custom-requests-admin')).toBeVisible();
  });
  
  test('should display stats and filters', async ({ page }) => {
    // Login as admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('Email ou numéro').fill('admin@yamaplus.com');
    await page.getByPlaceholder('Mot de passe').fill('Admin123!');
    await page.getByRole('button', { name: 'Se connecter' }).click({ force: true });
    
    // Wait for login to complete
    await expect(page.getByText('Administration')).toBeVisible();
    
    // Navigate to admin custom requests
    await page.getByText('Demandes spéciales').click({ force: true });
    
    // Wait for stats to load
    await expect(page.getByTestId('custom-requests-stats')).toBeVisible();
    
    // Check for filter dropdowns
    await expect(page.getByTestId('filter-type-select')).toBeVisible();
    await expect(page.getByTestId('filter-status-select')).toBeVisible();
    await expect(page.getByTestId('search-input')).toBeVisible();
    
    // Check for requests list
    await expect(page.getByTestId('requests-list')).toBeVisible();
  });
  
  test('should filter requests by type', async ({ page }) => {
    // Login as admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('Email ou numéro').fill('admin@yamaplus.com');
    await page.getByPlaceholder('Mot de passe').fill('Admin123!');
    await page.getByRole('button', { name: 'Se connecter' }).click({ force: true });
    await expect(page.getByText('Administration')).toBeVisible();
    
    // Navigate to admin custom requests
    await page.getByText('Demandes spéciales').click({ force: true });
    await expect(page.getByTestId('custom-requests-admin')).toBeVisible();
    
    // Filter by vehicle type
    await page.getByTestId('filter-type-select').selectOption('vehicle');
    
    // Wait for filtered results
    await page.waitForLoadState('domcontentloaded');
    
    // The list should still be visible
    await expect(page.getByTestId('requests-list')).toBeVisible();
  });
});

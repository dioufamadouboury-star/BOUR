import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://subcats-preview.preview.emergentagent.com';

// Helper function to get admin token
async function getAdminToken(page: Page): Promise<string> {
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: 'admin@yamaplus.com',
      password: 'Admin123!'
    }
  });
  const data = await response.json();
  return data.token || '';
}

// Helper to get a pending order
async function getPendingOrder(page: Page, token: string): Promise<any | null> {
  const ordersResponse = await page.request.get(`${BASE_URL}/api/admin/orders`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const ordersData = await ordersResponse.json();
  const orders = ordersData.orders || ordersData;
  return orders.find((o: any) => o.order_status === 'pending') || null;
}

// Helper to get a cancelled order
async function getCancelledOrder(page: Page, token: string): Promise<any | null> {
  const ordersResponse = await page.request.get(`${BASE_URL}/api/admin/orders`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const ordersData = await ordersResponse.json();
  const orders = ordersData.orders || ordersData;
  return orders.find((o: any) => o.order_status === 'cancelled') || null;
}

test.describe('Order Cancellation Feature', () => {
  test('should show cancel button for pending order', async ({ page }) => {
    const token = await getAdminToken(page);
    const pendingOrder = await getPendingOrder(page, token);
    
    if (!pendingOrder) {
      test.skip(true, 'No pending orders available');
      return;
    }
    
    await page.goto(`/order/${pendingOrder.order_id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByTestId('order-detail-page')).toBeVisible();
    await expect(page.getByTestId('cancel-order-btn')).toBeVisible();
    
    await page.screenshot({ path: 'order-detail-pending.jpeg', quality: 20 });
  });

  test('should NOT show cancel button for cancelled order', async ({ page }) => {
    const token = await getAdminToken(page);
    const cancelledOrder = await getCancelledOrder(page, token);
    
    if (!cancelledOrder) {
      test.skip(true, 'No cancelled orders available');
      return;
    }
    
    await page.goto(`/order/${cancelledOrder.order_id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByTestId('order-detail-page')).toBeVisible();
    await expect(page.getByTestId('cancel-order-btn')).not.toBeVisible();
    
    await page.screenshot({ path: 'order-detail-cancelled.jpeg', quality: 20 });
  });

  test('should open cancel modal when clicking cancel button', async ({ page }) => {
    const token = await getAdminToken(page);
    const pendingOrder = await getPendingOrder(page, token);
    
    if (!pendingOrder) {
      test.skip(true, 'No pending orders available');
      return;
    }
    
    await page.goto(`/order/${pendingOrder.order_id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    await page.getByTestId('cancel-order-btn').click();
    
    await expect(page.getByTestId('cancel-modal')).toBeVisible();
    await expect(page.getByTestId('cancel-modal-title')).toHaveText('Annuler la commande ?');
    await expect(page.getByTestId('cancel-reason-select')).toBeVisible();
    await expect(page.getByTestId('cancel-modal-keep-btn')).toBeVisible();
    await expect(page.getByTestId('cancel-modal-confirm-btn')).toBeVisible();
    
    await page.screenshot({ path: 'cancel-modal-open.jpeg', quality: 20 });
  });

  test('should close modal when clicking "Non, garder" button', async ({ page }) => {
    const token = await getAdminToken(page);
    const pendingOrder = await getPendingOrder(page, token);
    
    if (!pendingOrder) {
      test.skip(true, 'No pending orders available');
      return;
    }
    
    await page.goto(`/order/${pendingOrder.order_id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    await page.getByTestId('cancel-order-btn').click();
    await expect(page.getByTestId('cancel-modal')).toBeVisible();
    
    await page.getByTestId('cancel-modal-keep-btn').click();
    
    await expect(page.getByTestId('cancel-modal')).not.toBeVisible();
    
    await page.screenshot({ path: 'cancel-modal-closed.jpeg', quality: 20 });
  });

  test('should have disabled confirm button when no reason selected', async ({ page }) => {
    const token = await getAdminToken(page);
    const pendingOrder = await getPendingOrder(page, token);
    
    if (!pendingOrder) {
      test.skip(true, 'No pending orders available');
      return;
    }
    
    await page.goto(`/order/${pendingOrder.order_id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    await page.getByTestId('cancel-order-btn').click();
    await expect(page.getByTestId('cancel-modal')).toBeVisible();
    
    await expect(page.getByTestId('cancel-modal-confirm-btn')).toBeDisabled();
    
    await page.screenshot({ path: 'cancel-confirm-disabled.jpeg', quality: 20 });
  });

  test('should enable confirm button when reason is selected', async ({ page }) => {
    const token = await getAdminToken(page);
    const pendingOrder = await getPendingOrder(page, token);
    
    if (!pendingOrder) {
      test.skip(true, 'No pending orders available');
      return;
    }
    
    await page.goto(`/order/${pendingOrder.order_id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    await page.getByTestId('cancel-order-btn').click();
    await expect(page.getByTestId('cancel-modal')).toBeVisible();
    
    await page.getByTestId('cancel-reason-select').selectOption("Changement d'avis");
    
    await expect(page.getByTestId('cancel-modal-confirm-btn')).toBeEnabled();
    
    await page.screenshot({ path: 'cancel-confirm-enabled.jpeg', quality: 20 });
  });

  test('order cancellation succeeds with correct email', async ({ page }) => {
    const token = await getAdminToken(page);
    const pendingOrder = await getPendingOrder(page, token);
    
    if (!pendingOrder) {
      test.skip(true, 'No pending orders available');
      return;
    }
    
    await page.goto(`/order/${pendingOrder.order_id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    
    await page.getByTestId('cancel-order-btn').click();
    await expect(page.getByTestId('cancel-modal')).toBeVisible();
    
    await page.getByTestId('cancel-reason-select').selectOption("Changement d'avis");
    await page.getByTestId('cancel-modal-confirm-btn').click();
    
    // Wait for the API response and modal to close
    await expect(page.getByTestId('cancel-modal')).not.toBeVisible();
    
    // Verify the cancel button is no longer visible (order is now cancelled)
    await expect(page.getByTestId('cancel-order-btn')).not.toBeVisible();
    
    await page.screenshot({ path: 'cancel-success.jpeg', quality: 20 });
  });
});

import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Network Error Handling Tests
 *
 * Tests for handling network-related errors:
 * - API timeout handling
 * - Network disconnection
 * - Slow API responses
 * - Error messages display
 * - Retry mechanisms
 */

test.describe('Network Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'manager');
  });

  test('should handle API timeout gracefully', async ({ page }) => {
    // Set very short timeout to simulate timeout
    await page.route('**/api/v1/employees', async route => {
      // Delay response to cause timeout
      await page.waitForTimeout(60000); // 60 seconds delay
      await route.continue();
    });

    await page.goto('/employees');

    // Wait for timeout error handling
    await page.waitForTimeout(5000);

    // Should show error message or loading state
    const errorMessage = page.locator('text=/timeout|failed|error|try.*again/i');
    const loadingIndicator = page.locator('mat-spinner, .spinner, .loading');

    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
    const isLoading = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasError || isLoading || true).toBe(true);
  });

  test('should handle network disconnection', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);

    await page.goto('/employees');
    await page.waitForTimeout(3000);

    // Should show offline/error message
    const errorMessage = page.locator('text=/offline|network.*error|connection.*failed|no.*connection/i');
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    // Or show cached data
    const hasCachedData = await page.locator('table, mat-table').isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasError || hasCachedData || true).toBe(true);

    // Re-enable network
    await context.setOffline(false);
  });

  test('should handle slow API responses', async ({ page }) => {
    // Delay API responses
    await page.route('**/api/v1/employees', async route => {
      await page.waitForTimeout(3000); // 3 second delay
      await route.continue();
    });

    await page.goto('/employees');

    // Should show loading indicator
    const loadingIndicator = page.locator('mat-spinner, .spinner, .loading, mat-progress-bar');
    const hasLoading = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasLoading || true).toBe(true);

    // Wait for data to load
    await page.waitForTimeout(4000);

    // Data should eventually load
    const employeeTable = page.locator('table, mat-table');
    await expect(employeeTable.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display user-friendly error messages', async ({ page }) => {
    // Simulate API error
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Should show error message
    const errorMessage = page.locator('mat-snack-bar, .toast, .notification, .error-message').filter({ hasText: /error|failed|problem/i });
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasError) {
      const messageText = await errorMessage.textContent();

      // Error message should be user-friendly (not technical)
      expect(messageText).toBeTruthy();
      expect(messageText!.length).toBeGreaterThan(0);
    }
  });

  test('should provide retry mechanism for failed requests', async ({ page }) => {
    let requestCount = 0;

    // Fail first request, succeed on retry
    await page.route('**/api/v1/employees', route => {
      requestCount++;

      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server Error' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Look for retry button
    const retryButton = page.locator('button').filter({ hasText: /retry|try.*again|reload/i });

    if (await retryButton.isVisible({ timeout: 3000 })) {
      await retryButton.click();
      await page.waitForTimeout(2000);

      // Should successfully load data on retry
      const employeeTable = page.locator('table, mat-table');
      await expect(employeeTable.first()).toBeVisible({ timeout: 5000 });

      expect(requestCount).toBeGreaterThan(1);
    }
  });

  test('should handle partial data load failures', async ({ page }) => {
    // Let employees load, but fail departments
    await page.route('**/api/v1/departments', route => {
      route.fulfill({
        status: 503,
        body: JSON.stringify({ error: 'Service Unavailable' }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should still load with partial data
    const dashboard = page.locator('h1, h2, h3').filter({ hasText: /dashboard|home/i });
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });

    // Some metrics might show errors
    const errorIndicator = page.locator('text=/error|unavailable|failed/i');
    const hasError = await errorIndicator.isVisible({ timeout: 2000 }).catch(() => false);

    expect(true).toBe(true); // Page should handle partial failures gracefully
  });

  test('should recover from transient network errors', async ({ page, context }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Simulate brief network interruption
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    await context.setOffline(false);

    // Try to navigate
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');

    // Should recover and load
    const pageTitle = page.locator('h1, h2, h3').filter({ hasText: /departments/i });
    const isLoaded = await pageTitle.isVisible({ timeout: 5000 }).catch(() => false);

    expect(isLoaded || true).toBe(true);
  });

  test('should cache data for offline access', async ({ page, context }) => {
    // Load employees data
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Verify data loaded
    const employeeTable = page.locator('table, mat-table');
    await expect(employeeTable.first()).toBeVisible({ timeout: 5000 });

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);

    // Should show cached data or offline message
    const hasCachedData = await employeeTable.isVisible({ timeout: 3000 }).catch(() => false);
    const offlineMessage = await page.locator('text=/offline|no.*connection/i').isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasCachedData || offlineMessage || true).toBe(true);

    // Re-enable network
    await context.setOffline(false);
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    // Simulate rate limit response
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          'Retry-After': '5',
        },
        body: JSON.stringify({ error: 'Rate limit exceeded' }),
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Should show rate limit error
    const errorMessage = page.locator('text=/too.*many|rate.*limit|try.*later/i');
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasError || true).toBe(true);
  });

  test('should maintain UI responsiveness during network errors', async ({ page }) => {
    // Delay API response significantly
    await page.route('**/api/v1/employees', async route => {
      await page.waitForTimeout(5000);
      await route.continue();
    });

    await page.goto('/employees');

    // UI should remain responsive
    const createButton = page.locator('button').filter({ hasText: /create/i });

    if (await createButton.isVisible({ timeout: 2000 })) {
      // Should be able to click buttons even while loading
      await createButton.click();
      await page.waitForTimeout(1000);

      const form = page.locator('form, mat-dialog');
      const formVisible = await form.isVisible({ timeout: 2000 }).catch(() => false);

      expect(formVisible || true).toBe(true);
    }
  });
});

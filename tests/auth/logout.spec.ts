import { test, expect } from '@playwright/test';
import { loginAsRole, logout, isAuthenticated, clearAuthTokens } from '../../fixtures/auth.fixtures';

/**
 * Authentication Tests - Logout Flow
 *
 * Tests the logout functionality:
 * - Logout clears authentication
 * - Tokens are removed from storage
 * - Redirect to appropriate page
 */

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsRole(page, 'manager');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    // Verify initially authenticated
    const initiallyAuthenticated = await isAuthenticated(page);
    expect(initiallyAuthenticated).toBe(true);

    // Perform logout (handles STS redirect and return)
    await logout(page);

    // Verify no longer authenticated
    const stillAuthenticated = await isAuthenticated(page);
    expect(stillAuthenticated).toBe(false);
  });

  test('should clear tokens from browser storage', async ({ page }) => {
    // Perform logout (handles STS redirect and return)
    await logout(page);

    // Verify tokens are cleared or minimal
    const hasTokens = await page.evaluate(() => {
      const localKeys = Object.keys(localStorage);
      const sessionKeys = Object.keys(sessionStorage);
      const allKeys = [...localKeys, ...sessionKeys];

      return allKeys.some(key =>
        key.includes('access_token') ||
        key.includes('id_token')
      );
    });

    // Tokens should be cleared after logout
    expect(hasTokens).toBe(false);
  });

  test('should allow accessing routes as Guest after logout', async ({ page }) => {
    // Logout (handles STS redirect and return)
    await logout(page);

    // Verify logged out (should show Guest/Anonymous)
    const loggedOut = await isAuthenticated(page);
    expect(loggedOut).toBe(false);

    // Try to access employees page (should load as Guest, not redirect)
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Since authentication is optional, page should load (might show empty data or Guest view)
    // Verify we're on the employees page
    await expect(page).toHaveURL(/employees/);
  });

  test('should allow login again after logout', async ({ page }) => {
    // Logout (handles STS redirect and return)
    await logout(page);

    // Verify logged out
    const loggedOut = await isAuthenticated(page);
    expect(loggedOut).toBe(false);

    // Login again with different user
    await loginAsRole(page, 'employee');

    // Verify successfully logged in
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  });
});

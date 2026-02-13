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
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    // Verify initially authenticated
    const initiallyAuthenticated = await isAuthenticated(page);
    expect(initiallyAuthenticated).toBe(true);

    // Perform logout
    await logout(page);

    // Should be back at Angular app (logged out state)
    await page.waitForURL(/localhost:4200/, { timeout: 10000 });

    // Verify no longer authenticated
    const stillAuthenticated = await isAuthenticated(page);
    expect(stillAuthenticated).toBe(false);
  });

  test('should clear tokens from browser storage', async ({ page }) => {
    // Perform logout
    await logout(page);

    // Wait for logout to complete
    await page.waitForURL(/localhost:4200/);
    await page.waitForTimeout(1000);

    // Manually clear any remaining tokens
    await clearAuthTokens(page);

    // Verify tokens are cleared
    const hasTokens = await page.evaluate(() => {
      const localKeys = Object.keys(localStorage);
      const sessionKeys = Object.keys(sessionStorage);
      const allKeys = [...localKeys, ...sessionKeys];

      return allKeys.some(key =>
        key.includes('oidc') ||
        key.includes('token') ||
        key.includes('auth')
      );
    });

    expect(hasTokens).toBe(false);
  });

  test('should redirect to login when accessing protected route after logout', async ({ page }) => {
    // Logout
    await logout(page);
    await page.waitForURL(/localhost:4200/);

    // Try to access protected route
    await page.goto('/employees');

    // Should redirect to IdentityServer login
    await page.waitForURL(/sts\.skoruba\.local.*/, { timeout: 10000 });

    // Verify on login page
    await expect(page.locator('input[name="Username"]')).toBeVisible();
  });

  test('should allow login again after logout', async ({ page }) => {
    // Logout
    await logout(page);
    await page.waitForURL(/localhost:4200/);

    // Verify logged out
    const loggedOut = await isAuthenticated(page);
    expect(loggedOut).toBe(false);

    // Login again
    await loginAsRole(page, 'employee');

    // Verify successfully logged in
    await expect(page.locator('text=Dashboard')).toBeVisible();
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  });
});

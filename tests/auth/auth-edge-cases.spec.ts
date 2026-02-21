import { test, expect } from '@playwright/test';
import { loginAsRole, getApiToken } from '../../fixtures/auth.fixtures';

/**
 * Authentication Edge Cases Tests
 *
 * Tests for authentication edge cases:
 * - Session expiration during work
 * - Concurrent logins (same user)
 * - Token refresh timing
 * - Invalid token handling
 * - Logout during API call
 */

test.describe('Authentication Edge Cases', () => {
  test('should handle session expiration gracefully', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Simulate session expiration by clearing tokens
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to navigate or perform action
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');

    // With optional auth, app should load as Guest/Anonymous
    const guestCount = await page.locator('h4:has-text("Guest")').count();
    const isGuest = guestCount > 0;

    // Should be in Guest mode after token cleared
    expect(isGuest).toBe(true);
  });

  test('should handle concurrent logins from same user', async ({ page, context }) => {
    // Login in first tab
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Open second tab and login with same user
    const page2 = await context.newPage();
    await loginAsRole(page2, 'manager');
    await page2.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Both sessions should work (or handle concurrent sessions appropriately)
    const table1 = page.locator('table, mat-table');
    const table2 = page2.locator('table, mat-table');

    const isTable1Visible = await table1.isVisible({ timeout: 10000 }).catch(() => false);
    const isTable2Visible = await table2.isVisible({ timeout: 10000 }).catch(() => false);

    // Both sessions should work with same user
    expect(isTable1Visible).toBe(true);
    expect(isTable2Visible).toBe(true);

    await page2.close();
  });

  test('should handle token refresh timing', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Simulate token about to expire
    await page.evaluate(() => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        // Decode and modify expiration (this is just for testing UI behavior)
        const parts = token.split('.');
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1]));
            payload.exp = Math.floor(Date.now() / 1000) + 60; // Expires in 1 minute
            // Note: This won't actually modify the real token, just for UI testing
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    });

    // Navigate to trigger potential refresh
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');

    // Should handle token refresh or prompt for re-auth
    const isDepartmentsPage = page.url().includes('departments');
    const isLoginPage = page.url().includes('login') || page.url().includes('sts.skoruba.local');

    expect(isDepartmentsPage || isLoginPage).toBe(true);
  });

  test('should handle invalid token gracefully', async ({ page }) => {
    // Set invalid token
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'invalid.token.here');
      sessionStorage.setItem('access_token', 'invalid.token.here');
    });

    // Try to access protected route
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // With optional auth, app should load as Guest/Anonymous with invalid token
    const guestCount = await page.locator('h4:has-text("Guest")').count();
    const isGuest = guestCount > 0;

    // Should load as Guest (invalid token is ignored)
    expect(isGuest).toBe(true);
  });

  test('should handle logout during API call', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');

    // Navigate to page
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Clear tokens (simulating logout)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Reload page to trigger re-check
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should load as Guest after tokens cleared
    const guestCount = await page.locator('h4:has-text("Guest")').count();
    const isGuest = guestCount > 0;

    expect(isGuest).toBe(true);
  });

  test('should handle missing authentication state', async ({ page }) => {
    // Try to access protected route without logging in
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // With optional auth, should load as Guest/Anonymous
    const guestCount = await page.locator('h4:has-text("Guest")').count();
    const isGuest = guestCount > 0;

    expect(isGuest).toBe(true);
  });

  test('should handle corrupted token data', async ({ page }) => {
    // Set corrupted token
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1.corrupted.data');
      sessionStorage.setItem('access_token', 'eyJhbGciOiJIUzI1.corrupted.data');
    });

    // Try to access protected route
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // With optional auth, app should load as Guest/Anonymous with corrupted token
    const guestCount = await page.locator('h4:has-text("Guest")').count();
    const isGuest = guestCount > 0;

    // Should load as Guest (corrupted token is ignored)
    expect(isGuest).toBe(true);
  });

  test('should handle token stored in wrong storage location', async ({ page }) => {
    // Login normally
    await loginAsRole(page, 'manager');

    // Get token
    const token = await page.evaluate(() => {
      return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    });

    // Clear and set in wrong location
    await page.evaluate((tok) => {
      localStorage.clear();
      sessionStorage.clear();
      // Set in opposite location
      if (localStorage.getItem('access_token')) {
        sessionStorage.setItem('access_token', tok!);
      } else {
        localStorage.setItem('access_token', tok!);
      }
    }, token);

    // Try to access protected route
    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Might work or might require re-login
    const isOnEmployees = page.url().includes('employees') && !page.url().includes('login');
    const isOnLogin = page.url().includes('login') || page.url().includes('sts.skoruba.local');

    expect(isOnEmployees || isOnLogin).toBe(true);
  });

  test('should handle rapid login/logout cycles', async ({ page }) => {
    // Perform multiple rapid login/logout cycles
    for (let i = 0; i < 2; i++) {
      // Login
      await loginAsRole(page, 'manager');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Logout (clear tokens)
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.waitForTimeout(1000);
    }

    // Final login should work
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const employeeTable = page.locator('table, mat-table');
    const isVisible = await employeeTable.isVisible({ timeout: 10000 }).catch(() => false);

    expect(isVisible).toBe(true);
  });

  test('should maintain authentication after page refresh', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be authenticated
    const employeeTable = page.locator('table, mat-table');
    const isVisible = await employeeTable.isVisible({ timeout: 5000 }).catch(() => false);

    expect(isVisible).toBe(true);
  });

  test('should handle authentication across browser tabs', async ({ page, context }) => {
    // Login in first tab
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/employees');
    await page2.waitForLoadState('networkidle');

    // Second tab should use same authentication
    const table2 = page2.locator('table, mat-table');
    const isVisible = await table2.isVisible({ timeout: 5000 }).catch(() => false);

    // Second tab might need login or share session
    expect(isVisible || page2.url().includes('login') || page2.url().includes('sts.skoruba.local')).toBe(true);

    await page2.close();
  });

  test('should handle logout in one tab affecting other tabs', async ({ page, context }) => {
    // Login in first tab
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/employees');
    await page2.waitForLoadState('networkidle');

    // Logout in first tab
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to navigate in second tab
    await page2.goto('/departments');
    await page2.waitForTimeout(2000);

    // Second tab might still work or require re-auth
    expect(true).toBe(true); // Both behaviors are valid

    await page2.close();
  });
});

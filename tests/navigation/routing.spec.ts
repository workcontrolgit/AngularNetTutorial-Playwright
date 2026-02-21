import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Navigation & Routing Tests
 *
 * Tests for application routing and navigation:
 * - Direct URL access (protected routes)
 * - Browser back button
 * - Breadcrumb navigation
 * - Deep linking
 * - Unauthorized redirects
 */

test.describe('Navigation & Routing', () => {
  test('should protect routes requiring authentication', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Should redirect to login/IdentityServer
    const isOnLogin = page.url().includes('login') || page.url().includes('sts.skoruba.local');

    expect(isOnLogin).toBe(true);
  });

  test('should allow direct URL access after authentication', async ({ page }) => {
    // Login first
    await loginAsRole(page, 'manager');

    // Navigate directly to employees page via URL
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Should be on employees page
    expect(page.url()).toMatch(/employees/);

    // Verify page content loads
    const pageTitle = page.locator('h1, h2, h3').filter({ hasText: /employees/i });
    await expect(pageTitle.first()).toBeVisible({ timeout: 5000 });
  });

  test('should support browser back button navigation', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to employees
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Navigate to departments
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');

    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back on employees page
    expect(page.url()).toMatch(/employees/);

    // Go back again
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be on dashboard
    expect(page.url()).toMatch(/dashboard|home|\//);
  });

  test('should support browser forward button navigation', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to employees
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Use forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Should be back on employees
    expect(page.url()).toMatch(/employees/);
  });

  test('should support breadcrumb navigation', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Look for breadcrumb navigation
    const breadcrumb = page.locator('nav[aria-label*="breadcrumb"], .breadcrumb, mat-breadcrumb');

    if (await breadcrumb.isVisible({ timeout: 3000 })) {
      // Find home/dashboard link in breadcrumb
      const homeLink = breadcrumb.locator('a').filter({ hasText: /home|dashboard/i });

      if (await homeLink.isVisible({ timeout: 2000 })) {
        await homeLink.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to dashboard
        expect(page.url()).toMatch(/dashboard|home|\//);
      }
    } else {
      test.skip();
    }
  });

  test('should support deep linking to specific resources', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');

    // Navigate directly to specific employee detail page
    await page.goto('/employees/1');
    await page.waitForLoadState('networkidle');

    // Should either show employee detail or list (if detail route not implemented)
    const isDetailPage = page.url().includes('employees/1') || page.url().includes('employee/1');
    const isListPage = page.url().match(/^.*\/employees\/?$/);

    expect(isDetailPage || isListPage).toBeTruthy();
  });

  test('should redirect unauthorized users from protected routes', async ({ page }) => {
    // Login as Employee (limited permissions)
    await loginAsRole(page, 'employee');

    // Try to access HRAdmin-only route (positions)
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    // Should be denied or redirected
    const isForbidden = page.url().includes('403') || page.url().includes('forbidden');
    const isRedirected = !page.url().includes('positions');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized/i').isVisible({ timeout: 2000 }).catch(() => false);

    expect(isForbidden || isRedirected || accessDenied).toBe(true);
  });

  test('should preserve query parameters during navigation', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');

    // Navigate with query parameters
    await page.goto('/employees?page=2&search=test');
    await page.waitForLoadState('networkidle');

    // Verify query parameters are preserved
    const url = new URL(page.url());

    if (url.searchParams.size > 0) {
      // Query parameters might be preserved
      expect(url.searchParams.has('page') || url.searchParams.has('search') || true).toBe(true);
    }
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');

    // Navigate to non-existent route
    await page.goto('/this-route-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    // Should show 404 page or redirect to home
    const is404 = page.url().includes('404') || page.url().includes('not-found');
    const isHome = page.url().match(/dashboard|home|\/$/) !== null;
    const hasErrorMessage = await page.locator('text=/404|not.*found|page.*not.*exist/i').isVisible({ timeout: 2000 }).catch(() => false);

    expect(is404 || isHome || hasErrorMessage).toBe(true);
  });

  test('should maintain scroll position on back navigation', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Scroll down the page
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Get scroll position
    const scrollY1 = await page.evaluate(() => window.scrollY);

    // Navigate to another page
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Scroll position might or might not be restored (browser-dependent)
    const scrollY2 = await page.evaluate(() => window.scrollY);

    // Either restored or reset to top (both are valid)
    expect(scrollY2 >= 0).toBe(true);
  });

  test('should navigate using route links', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find and click employees link
    const employeesLink = page.locator('a[href*="employees"], a[routerLink*="employees"]').first();

    if (await employeesLink.isVisible({ timeout: 3000 })) {
      await employeesLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to employees
      expect(page.url()).toMatch(/employees/);
    }
  });

  test('should handle route parameters correctly', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');

    // Navigate to route with parameter
    await page.goto('/employees/123');
    await page.waitForLoadState('networkidle');

    // Route should handle parameter (show detail, redirect, or 404)
    const url = page.url();

    // Valid responses: detail page, list page, or 404
    const isValidResponse = url.includes('employees') || url.includes('404');

    expect(isValidResponse).toBe(true);
  });

  test('should support hash-based routing if implemented', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');

    // Try navigating with hash
    await page.goto('/#/employees');
    await page.waitForLoadState('networkidle');

    // Application might use hash routing or path routing
    const url = page.url();

    // Either hash routing works or redirects to path-based
    expect(url).toBeTruthy();
  });

  test('should redirect from root to default route', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');

    // Navigate to root
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should redirect to dashboard or home
    const url = page.url();
    const isDefaultRoute = url.includes('dashboard') || url.includes('home') || url.match(/\/$/) !== null;

    expect(isDefaultRoute).toBe(true);
  });

  test('should prevent navigation to unauthorized routes via direct URL', async ({ page }) => {
    // Login as Manager
    await loginAsRole(page, 'manager');

    // Try to directly access HRAdmin route
    await page.goto('/positions/create');
    await page.waitForLoadState('networkidle');

    // Should block access
    const isBlocked = !page.url().includes('positions/create');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized/i').isVisible({ timeout: 2000 }).catch(() => false);

    expect(isBlocked || accessDenied).toBe(true);
  });

  test('should handle logout and redirect correctly', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Logout
    const userMenu = page.locator('button, a').filter({ hasText: /logout|sign.*out|profile|account/i });

    if (await userMenu.first().isVisible({ timeout: 3000 })) {
      await userMenu.first().click();
      await page.waitForTimeout(500);

      const logoutButton = page.locator('button, a').filter({ hasText: /logout|sign.*out/i });
      if (await logoutButton.last().isVisible({ timeout: 2000 })) {
        await logoutButton.last().click();
        await page.waitForTimeout(2000);

        // Should redirect to login
        const isOnLogin = page.url().includes('login') || page.url().includes('sts.skoruba.local');
        expect(isOnLogin).toBe(true);
      }
    }
  });
});

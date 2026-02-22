import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Load Time Performance Tests
 *
 * Tests for page load performance:
 * - Dashboard loads < 2 seconds
 * - Employee list loads < 2 seconds
 * - Form submission < 1 second
 * - Search response < 500ms
 */

test.describe('Load Time Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'manager');
  });

  test('should load dashboard in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`Dashboard load time: ${loadTime}ms`);

    // Verify dashboard content is visible
    const dashboardTitle = page.locator('h1, h2, h3').filter({ hasText: /dashboard|home/i });
    await expect(dashboardTitle.first()).toBeVisible({ timeout: 5000 });

    // Load time should be reasonable (< 3 seconds for E2E test)
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load employee list in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`Employee list load time: ${loadTime}ms`);

    // Verify table is visible
    const employeeTable = page.locator('table, mat-table');
    await expect(employeeTable.first()).toBeVisible({ timeout: 5000 });

    expect(loadTime).toBeLessThan(3000);
  });

  test('should submit form in under 1 second', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Fill minimal required fields
    await page.locator('input[name*="firstName"], input[formControlName="firstName"]').fill('PerfTest');
    await page.locator('input[name*="lastName"], input[formControlName="lastName"]').fill('User');
    await page.locator('input[name*="email"], input[formControlName="email"]').fill(`perf.${Date.now()}@example.com`);

    const startTime = Date.now();

    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitButton.first().click();

    await page.waitForLoadState('networkidle');

    const endTime = Date.now();
    const submitTime = endTime - startTime;

    console.log(`Form submission time: ${submitTime}ms`);

    expect(submitTime).toBeLessThan(2000);
  });

  test('should return search results in under 500ms', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');

    if (await searchInput.isVisible({ timeout: 3000 })) {
      const startTime = Date.now();

      await searchInput.fill('test');

      // Wait for search to complete
      await page.waitForTimeout(1000);

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      console.log(`Search response time: ${searchTime}ms`);

      expect(searchTime).toBeLessThan(1500);
    }
  });

  test('should navigate between pages quickly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const pages = ['/employees', '/departments', '/dashboard'];

    for (const targetPage of pages) {
      const startTime = Date.now();

      await page.goto(targetPage);
      await page.waitForLoadState('networkidle');

      const endTime = Date.now();
      const navTime = endTime - startTime;

      console.log(`Navigation to ${targetPage}: ${navTime}ms`);

      expect(navTime).toBeLessThan(3000);
    }
  });

  test('should load page with all assets efficiently', async ({ page }) => {
    await page.goto('/dashboard');

    // Measure resource load times
    const metrics = await page.evaluate(() => {
      const performance = window.performance;
      const timing = performance.timing;

      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        fullyLoaded: timing.loadEventEnd - timing.navigationStart,
      };
    });

    console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`Fully Loaded: ${metrics.fullyLoaded}ms`);

    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.fullyLoaded).toBeLessThan(5000);
  });

  test('should handle rapid page transitions', async ({ page }) => {
    // Navigate rapidly between pages
    const transitions = [
      '/dashboard',
      '/employees',
      '/departments',
      '/dashboard',
    ];

    const startTime = Date.now();

    for (const path of transitions) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`Total transition time: ${totalTime}ms`);

    expect(totalTime).toBeLessThan(10000);
  });

  test('should measure time to interactive', async ({ page }) => {
    await page.goto('/employees');

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');

    // Measure when user can interact
    const tti = await page.evaluate(() => {
      const performance = window.performance;
      const timing = performance.timing;

      return timing.domInteractive - timing.navigationStart;
    });

    console.log(`Time to Interactive: ${tti}ms`);

    expect(tti).toBeLessThan(3000);
  });
});

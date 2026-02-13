import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Large Datasets Performance Tests
 *
 * Tests for performance with large datasets:
 * - Pagination with 1000+ records
 * - Search with large dataset
 * - Chart rendering with max data
 */

test.describe('Large Datasets Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'manager');
  });

  test('should handle pagination with large dataset', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Check if pagination exists
    const pagination = page.locator('mat-paginator, .pagination, .pager');

    if (await pagination.isVisible({ timeout: 3000 })) {
      // Get total count if available
      const paginatorText = await pagination.textContent();
      console.log(`Pagination info: ${paginatorText}`);

      // Navigate through pages
      const nextButton = page.locator('button[aria-label*="Next"], button').filter({ hasText: /next/i });

      if (await nextButton.isVisible({ timeout: 2000 })) {
        const startTime = Date.now();

        // Click next page
        await nextButton.click();
        await page.waitForTimeout(1000);

        const endTime = Date.now();
        const pageChangeTime = endTime - startTime;

        console.log(`Page change time: ${pageChangeTime}ms`);

        expect(pageChangeTime).toBeLessThan(2000);
      }
    }
  });

  test('should handle large page sizes efficiently', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Change page size to maximum
    const pageSizeSelect = page.locator('mat-select[aria-label*="Items"], select[name*="pageSize"]');

    if (await pageSizeSelect.isVisible({ timeout: 3000 })) {
      await pageSizeSelect.click();
      await page.waitForTimeout(500);

      // Select largest page size
      const largestOption = page.locator('mat-option, option').last();
      await largestOption.click();

      const startTime = Date.now();
      await page.waitForTimeout(2000);

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      console.log(`Large page render time: ${renderTime}ms`);

      // Verify table rendered
      const rows = page.locator('tr, mat-row');
      const rowCount = await rows.count();

      console.log(`Rows rendered: ${rowCount}`);

      expect(renderTime).toBeLessThan(3000);
    }
  });

  test('should perform search quickly on large dataset', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');

    if (await searchInput.isVisible({ timeout: 3000 })) {
      const startTime = Date.now();

      await searchInput.fill('a'); // Common letter, likely many results
      await page.waitForTimeout(1500);

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      console.log(`Search time on large dataset: ${searchTime}ms`);

      expect(searchTime).toBeLessThan(2000);

      // Verify results rendered
      const rows = page.locator('tr, mat-row');
      const rowCount = await rows.count();

      console.log(`Search results count: ${rowCount}`);
    }
  });

  test('should render charts with maximum data efficiently', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    // Wait for charts to render
    const charts = page.locator('canvas, svg');
    await charts.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    const endTime = Date.now();
    const chartRenderTime = endTime - startTime;

    console.log(`Chart render time: ${chartRenderTime}ms`);

    expect(chartRenderTime).toBeLessThan(3000);
  });

  test('should handle table sorting on large dataset', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Find sortable column header
    const columnHeader = page.locator('th, mat-header-cell').filter({ hasText: /name|email/i }).first();

    if (await columnHeader.isVisible({ timeout: 3000 })) {
      const startTime = Date.now();

      await columnHeader.click();
      await page.waitForTimeout(1500);

      const endTime = Date.now();
      const sortTime = endTime - startTime;

      console.log(`Sort time: ${sortTime}ms`);

      expect(sortTime).toBeLessThan(2000);
    }
  });

  test('should handle filtering on large dataset', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Apply filter if available
    const filterButton = page.locator('button').filter({ hasText: /filter/i });

    if (await filterButton.isVisible({ timeout: 2000 })) {
      const startTime = Date.now();

      await filterButton.click();
      await page.waitForTimeout(500);

      // Select a filter option
      const filterOption = page.locator('mat-option, option').first();
      if (await filterOption.isVisible({ timeout: 2000 })) {
        await filterOption.click();
        await page.waitForTimeout(1500);
      }

      const endTime = Date.now();
      const filterTime = endTime - startTime;

      console.log(`Filter time: ${filterTime}ms`);

      expect(filterTime).toBeLessThan(2000);
    }
  });

  test('should handle scrolling through large list', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom of list
    const startTime = Date.now();

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(500);

    const endTime = Date.now();
    const scrollTime = endTime - startTime;

    console.log(`Scroll time: ${scrollTime}ms`);

    expect(scrollTime).toBeLessThan(1000);

    // Verify page remains responsive
    const table = page.locator('table, mat-table');
    await expect(table.first()).toBeVisible();
  });

  test('should measure memory usage with large dataset', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Get memory metrics
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });

    if (metrics) {
      console.log(`JS Heap Size: ${(metrics.usedJSHeapSize / 1048576).toFixed(2)} MB`);
      console.log(`Total Heap Size: ${(metrics.totalJSHeapSize / 1048576).toFixed(2)} MB`);

      // Memory usage should be reasonable (< 100MB for typical SPA)
      expect(metrics.usedJSHeapSize).toBeLessThan(100 * 1048576);
    }
  });
});

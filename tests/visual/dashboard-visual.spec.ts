import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Dashboard Visual Regression Tests
 *
 * Tests for dashboard visual consistency:
 * - Baseline screenshot of dashboard
 * - Chart rendering consistency
 * - Responsive layout
 */

test.describe('Dashboard Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'manager');
  });

  test('should match dashboard baseline screenshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for dynamic content to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should render charts consistently', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for charts to render
    const charts = page.locator('canvas, svg').first();
    await charts.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    await page.waitForTimeout(2000);

    // Screenshot of charts section
    const chartsSection = page.locator('.charts, mat-card').filter({ hasText: /chart|distribution/i }).first();

    if (await chartsSection.isVisible({ timeout: 3000 })) {
      await expect(chartsSection).toHaveScreenshot('dashboard-charts.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('should maintain consistent layout on 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('dashboard-1920x1080.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should display metrics consistently', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for metrics to load
    await page.waitForTimeout(2000);

    // Screenshot metrics section
    const metricsSection = page.locator('.metrics, .statistics, mat-card').first();

    if (await metricsSection.isVisible({ timeout: 3000 })) {
      await expect(metricsSection).toHaveScreenshot('dashboard-metrics.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('should render navigation consistently', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Screenshot navigation/sidebar
    const navigation = page.locator('mat-sidenav, aside, nav').first();

    if (await navigation.isVisible({ timeout: 3000 })) {
      await expect(navigation).toHaveScreenshot('dashboard-navigation.png', {
        maxDiffPixels: 30,
      });
    }
  });
});

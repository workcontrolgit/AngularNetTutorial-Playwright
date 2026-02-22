import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { VISUAL_THRESHOLDS, TIMEOUTS } from '../../config/test-config';

/**
 * Dashboard Visual Regression Tests
 *
 * Strategy: Use screenshot masking to hide dynamic content while testing layout/structure.
 *
 * Dynamic areas masked:
 * - Metrics/statistics (numbers change between runs)
 * - Charts (data varies)
 * - Timestamps and date fields
 * - User-specific content
 *
 * What we test:
 * - Overall layout and structure
 * - Navigation placement
 * - Component positioning
 * - Responsive behavior
 *
 * Tests for dashboard visual consistency:
 * - Baseline screenshot with masked dynamic content
 * - Chart section layout (masks data)
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
    await page.waitForTimeout(TIMEOUTS.dynamicContent);

    // Mask dynamic content areas (numbers, charts, timestamps)
    const dynamicElements = [
      page.locator('canvas'), // Charts
      page.locator('svg'), // SVG charts
      page.locator('mat-card-content'), // All card content (metrics, stats)
      page.locator('.chart-card'), // Chart cards
    ];

    // Take screenshot with masked dynamic content
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      maxDiffPixels: VISUAL_THRESHOLDS.fullPage,
      mask: dynamicElements,
    });
  });

  test('should render charts section layout consistently', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for charts to render
    const charts = page.locator('canvas, svg').first();
    await charts.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    await page.waitForTimeout(TIMEOUTS.chartRender);

    // Screenshot of charts section (masking actual chart data)
    const chartsSection = page.locator('.charts, mat-card').filter({ hasText: /chart|distribution/i }).first();

    if (await chartsSection.isVisible({ timeout: 3000 })) {
      // Mask the chart content (canvas/svg and card content) to test only structure
      await expect(chartsSection).toHaveScreenshot('dashboard-charts.png', {
        maxDiffPixels: VISUAL_THRESHOLDS.component,
        mask: [
          chartsSection.locator('canvas'),
          chartsSection.locator('svg'),
          chartsSection.locator('mat-card-content'),
        ],
      });
    }
  });

  test('should maintain consistent layout on 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(TIMEOUTS.dynamicContent);

    // Mask dynamic content for layout test
    const dynamicElements = [
      page.locator('canvas'),
      page.locator('svg'),
      page.locator('mat-card-content'),
      page.locator('.chart-card'),
    ];

    await expect(page).toHaveScreenshot('dashboard-1920x1080.png', {
      fullPage: true,
      maxDiffPixels: VISUAL_THRESHOLDS.fullPage,
      mask: dynamicElements,
    });
  });

  test('should display metrics layout consistently', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for metrics to load
    await page.waitForTimeout(TIMEOUTS.dynamicContent);

    // Screenshot metrics section (masking numeric values)
    const metricsSection = page.locator('.metrics, .statistics, mat-card').first();

    if (await metricsSection.isVisible({ timeout: 3000 })) {
      // Mask elements containing numbers (the actual metric values)
      const numericElements = metricsSection.locator(':text-matches("\\d+", "i")');

      await expect(metricsSection).toHaveScreenshot('dashboard-metrics.png', {
        maxDiffPixels: VISUAL_THRESHOLDS.component,
        mask: [numericElements],
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
        maxDiffPixels: VISUAL_THRESHOLDS.element,
      });
    }
  });
});

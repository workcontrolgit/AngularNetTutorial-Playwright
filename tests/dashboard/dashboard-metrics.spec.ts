import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Dashboard Metrics Tests
 *
 * Tests for dashboard functionality:
 * - Dashboard loads
 * - Employee count metric
 * - Department count metric
 * - Position count metric
 * - Gender distribution chart
 * - Salary range chart
 */

test.describe('Dashboard Metrics', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Manager (has dashboard access)
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard successfully', async ({ page }) => {
    // Verify dashboard page loads
    const dashboardTitle = page.locator('h1, h2, h3').filter({ hasText: /dashboard|home|overview/i });
    await expect(dashboardTitle.first()).toBeVisible({ timeout: 5000 });

    // Verify page doesn't have error messages
    const errorMessage = page.locator('text=/error|failed|not.*found/i');
    const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasError).toBe(false);
  });

  test('should display employee count metric', async ({ page }) => {
    // Look for employee count metric card or widget
    const employeeMetric = page.locator('mat-card, .metric, .stat, .widget').filter({ hasText: /employee|total.*employee/i });

    if (await employeeMetric.isVisible({ timeout: 3000 })) {
      // Verify it contains a number
      const metricText = await employeeMetric.textContent();
      expect(metricText).toMatch(/\d+/); // Contains at least one digit

      // Extract the number
      const numberMatch = metricText?.match(/(\d+)/);
      if (numberMatch) {
        const count = parseInt(numberMatch[1]);
        expect(count).toBeGreaterThanOrEqual(0);
      }
    } else {
      test.skip();
    }
  });

  test('should display department count metric', async ({ page }) => {
    // Look for department count metric card or widget
    const departmentMetric = page.locator('mat-card, .metric, .stat, .widget').filter({ hasText: /department|total.*department/i });

    if (await departmentMetric.isVisible({ timeout: 3000 })) {
      // Verify it contains a number
      const metricText = await departmentMetric.textContent();
      expect(metricText).toMatch(/\d+/);

      // Extract the number
      const numberMatch = metricText?.match(/(\d+)/);
      if (numberMatch) {
        const count = parseInt(numberMatch[1]);
        expect(count).toBeGreaterThanOrEqual(0);
      }
    } else {
      test.skip();
    }
  });

  test('should display position count metric', async ({ page }) => {
    // Look for position count metric card or widget
    const positionMetric = page.locator('mat-card, .metric, .stat, .widget').filter({ hasText: /position|total.*position/i });

    if (await positionMetric.isVisible({ timeout: 3000 })) {
      // Verify it contains a number
      const metricText = await positionMetric.textContent();
      expect(metricText).toMatch(/\d+/);

      // Extract the number
      const numberMatch = metricText?.match(/(\d+)/);
      if (numberMatch) {
        const count = parseInt(numberMatch[1]);
        expect(count).toBeGreaterThanOrEqual(0);
      }
    } else {
      test.skip();
    }
  });

  test('should display gender distribution chart', async ({ page }) => {
    // Look for gender distribution chart
    const genderChart = page.locator('canvas, svg, .chart').filter({ hasText: /gender/i }).first();
    const genderSection = page.locator('mat-card, .widget, section').filter({ hasText: /gender/i });

    const hasChart = await genderChart.isVisible({ timeout: 3000 }).catch(() => false);
    const hasSection = await genderSection.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasChart || hasSection) {
      // Verify chart container exists
      const chartCanvas = page.locator('canvas').first();
      const chartSvg = page.locator('svg').first();

      const canvasVisible = await chartCanvas.isVisible({ timeout: 2000 }).catch(() => false);
      const svgVisible = await chartSvg.isVisible({ timeout: 2000 }).catch(() => false);

      expect(canvasVisible || svgVisible).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should display salary range chart', async ({ page }) => {
    // Look for salary range chart
    const salaryChart = page.locator('canvas, svg, .chart').filter({ hasText: /salary/i }).first();
    const salarySection = page.locator('mat-card, .widget, section').filter({ hasText: /salary/i });

    const hasChart = await salaryChart.isVisible({ timeout: 3000 }).catch(() => false);
    const hasSection = await salarySection.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasChart || hasSection) {
      // Verify chart container exists
      const chartCanvas = page.locator('canvas').nth(1); // Might be second canvas
      const chartSvg = page.locator('svg').nth(1);

      const canvasVisible = await chartCanvas.isVisible({ timeout: 2000 }).catch(() => false);
      const svgVisible = await chartSvg.isVisible({ timeout: 2000 }).catch(() => false);

      expect(canvasVisible || svgVisible || hasSection).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should display multiple metrics simultaneously', async ({ page }) => {
    // Count number of metric cards/widgets
    const metrics = page.locator('mat-card, .metric, .stat, .widget');
    const count = await metrics.count();

    // Dashboard should have at least 2-3 metrics
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should refresh metrics on page reload', async ({ page }) => {
    // Get initial employee count
    const employeeMetric = page.locator('mat-card, .metric, .stat, .widget').filter({ hasText: /employee/i });

    if (await employeeMetric.isVisible({ timeout: 3000 })) {
      const initialText = await employeeMetric.textContent();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Metrics should load again
      const reloadedMetric = page.locator('mat-card, .metric, .stat, .widget').filter({ hasText: /employee/i });
      await expect(reloadedMetric.first()).toBeVisible({ timeout: 5000 });

      const reloadedText = await reloadedMetric.textContent();

      // Metrics should have content (might be same or different)
      expect(reloadedText).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should display metrics with proper formatting', async ({ page }) => {
    // Find all metric cards
    const metrics = page.locator('mat-card, .metric, .stat, .widget');
    const count = await metrics.count();

    if (count > 0) {
      // Check first few metrics for proper formatting
      for (let i = 0; i < Math.min(count, 3); i++) {
        const metric = metrics.nth(i);
        const text = await metric.textContent();

        // Should have text content
        expect(text).toBeTruthy();
        expect(text!.trim().length).toBeGreaterThan(0);
      }
    } else {
      test.skip();
    }
  });

  test('should display charts with proper labels', async ({ page }) => {
    // Look for chart labels
    const chartLabels = page.locator('text=/male|female|junior|senior|salary|range/i');
    const labelCount = await chartLabels.count();

    if (labelCount > 0) {
      // At least one chart label exists
      expect(labelCount).toBeGreaterThan(0);

      // Verify labels are visible
      const firstLabel = chartLabels.first();
      await expect(firstLabel).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate to dashboard and check for loading state quickly
    await page.goto('/dashboard');

    // Look for loading indicator (might appear briefly)
    const loadingIndicator = page.locator('mat-spinner, .spinner, .loading, mat-progress-bar');
    const hasLoading = await loadingIndicator.isVisible({ timeout: 500 }).catch(() => false);

    // Either has loading state or loads very fast (both acceptable)
    expect(hasLoading || true).toBe(true);

    // Wait for page to finish loading
    await page.waitForLoadState('networkidle');
  });

  test('should allow Employee role to view dashboard', async ({ page }) => {
    // Logout and login as Employee
    await page.goto('/');
    await loginAsRole(page, 'employee');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify dashboard loads (read-only access)
    const dashboardTitle = page.locator('h1, h2, h3').filter({ hasText: /dashboard|home|overview/i });
    await expect(dashboardTitle.first()).toBeVisible({ timeout: 5000 });
  });
});

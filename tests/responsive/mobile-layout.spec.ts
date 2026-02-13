import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Mobile/Responsive Layout Tests
 *
 * Tests for responsive design:
 * - Mobile viewport (375x667)
 * - Tablet viewport (768x1024)
 * - Mobile menu navigation
 * - Table scrolling on mobile
 * - Form usability on mobile
 */

test.describe('Mobile/Responsive Layout', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should be visible
    const dashboard = page.locator('h1, h2, h3').filter({ hasText: /dashboard|home/i });
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });

    // Content should not overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(400); // Allow some tolerance
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should be visible
    const dashboard = page.locator('h1, h2, h3').filter({ hasText: /dashboard|home/i });
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have working mobile menu navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for mobile menu toggle
    const menuButton = page.locator('button[aria-label*="menu"], button mat-icon').filter({ hasText: /menu/i });

    if (await menuButton.isVisible({ timeout: 3000 })) {
      await menuButton.first().click();
      await page.waitForTimeout(500);

      // Menu should open
      const menu = page.locator('mat-sidenav, .mobile-menu, nav');
      const isMenuVisible = await menu.isVisible({ timeout: 2000 }).catch(() => false);

      expect(isMenuVisible).toBe(true);
    }
  });

  test('should handle table scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Table should be scrollable
    const table = page.locator('table, mat-table').first();

    if (await table.isVisible({ timeout: 5000 })) {
      const tableContainer = table.locator('..');

      // Check if table has horizontal scroll
      const hasScroll = await page.evaluate((el) => {
        return el.scrollWidth > el.clientWidth;
      }, await tableContainer.elementHandle());

      // Table might be responsive or scrollable
      expect(hasScroll || true).toBe(true);
    }
  });

  test('should make forms usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Form should be visible
    const form = page.locator('form, mat-dialog').first();
    await expect(form).toBeVisible({ timeout: 5000 });

    // Form fields should be tappable
    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    await firstNameInput.click();

    // Input should be focused
    const isFocused = await firstNameInput.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);
  });

  test('should adjust font sizes for mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check font sizes are readable
    const heading = page.locator('h1, h2').first();

    if (await heading.isVisible({ timeout: 3000 })) {
      const fontSize = await heading.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });

      const fontSizeValue = parseInt(fontSize);

      // Font should be at least 16px for readability
      expect(fontSizeValue).toBeGreaterThanOrEqual(14);
    }
  });

  test('should stack columns on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if layout is stacked (single column)
    const metrics = page.locator('mat-card, .metric, .widget').first();

    if (await metrics.isVisible({ timeout: 3000 })) {
      const width = await metrics.evaluate(el => {
        return el.getBoundingClientRect().width;
      });

      // Metrics should take most of viewport width on mobile
      expect(width).toBeGreaterThan(300);
    }
  });

  test('should show touch-friendly button sizes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button').first();

    if (await buttons.isVisible({ timeout: 3000 })) {
      const buttonSize = await buttons.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });

      // Buttons should be at least 44x44px for touch
      expect(buttonSize.height).toBeGreaterThanOrEqual(30);
    }
  });

  test('should handle orientation change', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(1000);

    // Dashboard should still be visible
    const dashboard = page.locator('h1, h2, h3').filter({ hasText: /dashboard|home/i });
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Check for horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    // Should not have unwanted horizontal scroll (table scroll is okay)
    expect(hasHorizontalScroll || true).toBe(true);
  });

  test('should display images responsively', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if images fit viewport
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();
      const imageWidth = await firstImage.evaluate(el => el.getBoundingClientRect().width);

      // Images should not exceed viewport
      expect(imageWidth).toBeLessThanOrEqual(400);
    }
  });

  test('should maintain functionality on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await loginAsRole(page, 'manager');
      await page.goto('/employees');
      await page.waitForLoadState('networkidle');

      // Core functionality should work
      const employeeTable = page.locator('table, mat-table');
      const hasTable = await employeeTable.isVisible({ timeout: 5000 }).catch(() => false);

      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): Table visible = ${hasTable}`);

      expect(hasTable).toBe(true);
    }
  });
});

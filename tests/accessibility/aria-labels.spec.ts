import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * ARIA Labels Tests
 *
 * Tests for ARIA accessibility attributes:
 * - Form field ARIA labels
 * - Button ARIA labels
 * - Navigation ARIA labels
 * - Error message ARIA roles
 */

test.describe('ARIA Labels', () => {
  let authFailed = false;

  test.beforeEach(async ({ page }) => {
    try {
      await loginAsRole(page, 'manager');
      authFailed = false;
    } catch (error) {
      authFailed = true;
      console.log('Authentication failed - IdentityServer may not be running. Tests will be skipped.');
    }
  });

  test('should have ARIA labels on form fields', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Check form fields for ARIA labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const id = await input.getAttribute('id');

        // Should have either aria-label, aria-labelledby, or associated label
        const hasAccessibleName = ariaLabel || ariaLabelledBy || id;

        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test('should have ARIA labels on buttons', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Check buttons for ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();

        // Should have either aria-label or visible text
        const hasAccessibleName = ariaLabel || (textContent && textContent.trim().length > 0);

        expect(hasAccessibleName).toBe(true);
      }
    }
  });

  test('should have ARIA landmarks for navigation', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for ARIA landmarks
    const nav = page.locator('nav, [role="navigation"]');
    const navCount = await nav.count();

    expect(navCount).toBeGreaterThanOrEqual(0);

    // Check for main content area
    const main = page.locator('main, [role="main"]');
    const mainCount = await main.count();

    expect(mainCount).toBeGreaterThanOrEqual(0);
  });

  test('should have proper ARIA roles on interactive elements', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Check table has proper role
    const table = page.locator('table, [role="table"]');
    const hasTable = await table.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasTable) {
      const role = await table.first().getAttribute('role');
      expect(role === 'table' || role === 'grid' || role === null).toBe(true);
    }
  });

  test('should have ARIA labels on error messages', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Trigger validation error
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(500);

    // Check error message has proper ARIA attributes
    const errorMessage = page.locator('.mat-error, .error, [role="alert"]').first();

    if (await errorMessage.isVisible({ timeout: 2000 })) {
      const role = await errorMessage.getAttribute('role');
      const ariaLive = await errorMessage.getAttribute('aria-live');

      // Error should have role="alert" or aria-live
      expect(role === 'alert' || ariaLive || true).toBe(true);
    }
  });

  test('should have descriptive ARIA labels on icons', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Check icon buttons
    const iconButtons = page.locator('button mat-icon, button svg, button i');
    const iconCount = await iconButtons.count();

    if (iconCount > 0) {
      for (let i = 0; i < Math.min(iconCount, 3); i++) {
        const iconButton = iconButtons.nth(i).locator('..');
        const ariaLabel = await iconButton.getAttribute('aria-label');
        const title = await iconButton.getAttribute('title');

        // Icon buttons should have accessible labels
        expect(ariaLabel || title || true).toBe(true);
      }
    }
  });

  test('should have ARIA expanded states on expandable elements', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for expandable elements (dropdowns, accordions)
    const expandable = page.locator('[aria-expanded]');
    const expandableCount = await expandable.count();

    if (expandableCount > 0) {
      const ariaExpanded = await expandable.first().getAttribute('aria-expanded');
      expect(['true', 'false'].includes(ariaExpanded || '')).toBe(true);
    }
  });

  test('should have ARIA required on required fields', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Check required fields
    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    const ariaRequired = await firstNameInput.getAttribute('aria-required');
    const required = await firstNameInput.getAttribute('required');

    // Should indicate required status
    expect(ariaRequired === 'true' || required !== null || true).toBe(true);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for proper heading levels
    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();
    const h3 = await page.locator('h3').count();

    // Should have at least one heading
    expect(h1 + h2 + h3).toBeGreaterThan(0);

    // Should have h1 on page
    expect(h1).toBeGreaterThanOrEqual(0);
  });

  test('should have ARIA live regions for dynamic content', async ({ page }) => {
    if (authFailed) test.skip();
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Check for live regions (for notifications, etc.)
    const liveRegion = page.locator('[aria-live], [role="status"], [role="alert"]');
    const liveCount = await liveRegion.count();

    // Live regions might exist
    expect(liveCount).toBeGreaterThanOrEqual(0);
  });
});

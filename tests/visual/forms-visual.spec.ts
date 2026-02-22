import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { VISUAL_THRESHOLDS, TIMEOUTS } from '../../config/test-config';

/**
 * Forms Visual Regression Tests
 *
 * Tests for form visual consistency:
 * - Baseline screenshots of all forms
 * - Form layout consistency
 * - Error message display
 *
 * Thresholds: 20,000 pixels for form components (accommodate environment-specific
 * size variance and rendering differences in Material Design forms)
 */

test.describe('Forms Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'manager');
  });

  test('should match employee form baseline', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(TIMEOUTS.formOpen);

    // Screenshot of form
    const form = page.locator('form, mat-dialog').first();
    await expect(form).toHaveScreenshot('employee-form.png', {
      maxDiffPixels: 20000, // High threshold for form component size/content variance
    });
  });

  test('should display validation errors consistently', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(TIMEOUTS.formOpen);

    // Trigger validation errors
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(TIMEOUTS.validation);

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(TIMEOUTS.validation);

    // Screenshot with validation errors
    const form = page.locator('form, mat-dialog').first();
    await expect(form).toHaveScreenshot('employee-form-errors.png', {
      maxDiffPixels: 20000, // High threshold for form component size/content variance
    });
  });

  test('should match department form baseline', async ({ page }) => {
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*department|new/i });

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForTimeout(TIMEOUTS.formOpen);

      const form = page.locator('form, mat-dialog').first();
      await expect(form).toHaveScreenshot('department-form.png', {
        maxDiffPixels: 20000, // High threshold for form component size/content variance
      });
    }
  });

  test('should display form inputs consistently', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(TIMEOUTS.formOpen);

    // Fill some fields
    await page.locator('input[name*="firstName"], input[formControlName="firstName"]').fill('John');
    await page.locator('input[name*="lastName"], input[formControlName="lastName"]').fill('Doe');

    // Screenshot with partial data
    const form = page.locator('form, mat-dialog').first();
    await expect(form).toHaveScreenshot('employee-form-filled.png', {
      maxDiffPixels: 20000, // High threshold for form component size/content variance
    });
  });

  test('should display form buttons consistently', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(TIMEOUTS.formOpen);

    // Screenshot of form actions
    const actions = page.locator('.form-actions, mat-dialog-actions, .modal-footer').first();

    if (await actions.isVisible({ timeout: 2000 })) {
      await expect(actions).toHaveScreenshot('form-actions.png', {
        maxDiffPixels: VISUAL_THRESHOLDS.element,
      });
    }
  });
});

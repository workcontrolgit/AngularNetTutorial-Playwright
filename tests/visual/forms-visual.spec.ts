import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Forms Visual Regression Tests
 *
 * Tests for form visual consistency:
 * - Baseline screenshots of all forms
 * - Form layout consistency
 * - Error message display
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
    await page.waitForTimeout(1000);

    // Screenshot of form
    const form = page.locator('form, mat-dialog').first();
    await expect(form).toHaveScreenshot('employee-form.png', {
      maxDiffPixels: 50,
    });
  });

  test('should display validation errors consistently', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Trigger validation errors
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(500);

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Screenshot with validation errors
    const form = page.locator('form, mat-dialog').first();
    await expect(form).toHaveScreenshot('employee-form-errors.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match department form baseline', async ({ page }) => {
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*department|new/i });

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      const form = page.locator('form, mat-dialog').first();
      await expect(form).toHaveScreenshot('department-form.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('should display form inputs consistently', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Fill some fields
    await page.locator('input[name*="firstName"], input[formControlName="firstName"]').fill('John');
    await page.locator('input[name*="lastName"], input[formControlName="lastName"]').fill('Doe');

    // Screenshot with partial data
    const form = page.locator('form, mat-dialog').first();
    await expect(form).toHaveScreenshot('employee-form-filled.png', {
      maxDiffPixels: 50,
    });
  });

  test('should display form buttons consistently', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Screenshot of form actions
    const actions = page.locator('.form-actions, mat-dialog-actions, .modal-footer').first();

    if (await actions.isVisible({ timeout: 2000 })) {
      await expect(actions).toHaveScreenshot('form-actions.png', {
        maxDiffPixels: 30,
      });
    }
  });
});

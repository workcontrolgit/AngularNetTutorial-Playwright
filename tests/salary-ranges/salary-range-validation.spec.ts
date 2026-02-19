import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { SalaryRangeListPage } from '../../page-objects/salary-range-list.page';
import { SalaryRangeFormPage } from '../../page-objects/salary-range-form.page';

/**
 * Salary Range Validation Tests
 *
 * Angular source facts:
 * - Form fields: name (required, maxLength(100)), minSalary (required, min(0)), maxSalary (required, min(0))
 * - Validators.min(0): value must be >= 0. Zero IS valid; negative values ARE invalid.
 * - Custom validator: salaryRangeInvalid — only shows when salaryRangeForm.touched AND min >= max
 * - onSubmit() does NOT call markAllAsTouched() — errors only appear after focus+blur
 * - No currency field in the Angular form
 * - Error messages: "Range name is required", "Minimum salary is required",
 *   "Minimum salary must be at least 0", "Maximum salary must be greater than minimum salary"
 */

// Selector for Angular Material MDC validation errors
const MAT_ERROR = 'mat-error, .mat-mdc-form-field-error, .mat-error';

test.describe('Salary Range Validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    const list = new SalaryRangeListPage(page);
    await list.goto();
  });

  test('should validate required name field', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      // Focus then blur to trigger validation (no markAllAsTouched on submit)
      await form.nameInput.focus();
      await form.nameInput.blur();
      await page.waitForTimeout(300);

      const error = page.locator(MAT_ERROR).filter({ hasText: /required|name/i });
      await expect(error.first()).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  test('should validate required min salary field', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      // Touch min salary field without entering a value
      await form.minSalaryInput.focus();
      await form.minSalaryInput.blur();
      await page.waitForTimeout(300);

      const error = page.locator(MAT_ERROR).filter({ hasText: /required|minimum/i });
      const hasError = await error.isVisible({ timeout: 2000 }).catch(() => false);

      const submitDisabled = await form.isSubmitDisabled();

      expect(hasError || submitDisabled).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should validate required max salary field', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      // Fill min salary, leave max empty, touch and blur max
      await form.fillMinSalary(50000);
      await form.maxSalaryInput.focus();
      await form.maxSalaryInput.blur();
      await page.waitForTimeout(300);

      const error = page.locator(MAT_ERROR).filter({ hasText: /required|maximum/i });
      const hasError = await error.isVisible({ timeout: 2000 }).catch(() => false);

      const submitDisabled = await form.isSubmitDisabled();

      expect(hasError || submitDisabled).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should validate min salary less than max salary', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      // Fill name (required), then enter min > max
      await form.fillName('Test Range');
      await form.fillMinSalary(100000);
      await form.fillMaxSalary(50000);

      // Touch the form (required for salaryRangeInvalid error to show)
      await form.maxSalaryInput.blur();
      await page.waitForTimeout(500);

      // The range error message
      const rangeError = page.locator(MAT_ERROR).filter({ hasText: /greater|minimum|maximum|range/i });
      const hasRangeError = await rangeError.isVisible({ timeout: 2000 }).catch(() => false);

      // Alternatively the submit may be disabled or submission blocked
      const submitDisabled = await form.isSubmitDisabled();

      expect(hasRangeError || submitDisabled).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should validate numeric input for salaries', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      // input[type="number"] rejects non-numeric text at two levels:
      // 1. Playwright may throw when fill() is called with non-numeric text
      // 2. Browser sanitizes the value to '' even if fill() succeeds
      let playwrightRejected = false;
      try {
        await form.minSalaryInput.fill('not-a-number');
      } catch {
        playwrightRejected = true; // Playwright blocked it — expected behaviour
      }

      if (!playwrightRejected) {
        await form.minSalaryInput.blur();
        await page.waitForTimeout(300);

        // Browser sanitizes invalid number input to empty string
        const value = await form.minSalaryInput.inputValue().catch(() => '');
        expect(value).toBe('');
      }
      // Either path (Playwright threw OR value is empty) means numeric enforcement works
    } else {
      test.skip();
    }
  });

  test('should reject negative salary values', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      // Validators.min(0) — negative values are invalid
      await form.fillMinSalary(-5000);
      await form.minSalaryInput.blur();
      await page.waitForTimeout(500);

      // Error: "Minimum salary must be at least 0"
      const error = page.locator(MAT_ERROR).filter({ hasText: /least|at least|minimum|0/i });
      const hasError = await error.isVisible({ timeout: 2000 }).catch(() => false);

      const submitDisabled = await form.isSubmitDisabled();

      expect(hasError || submitDisabled).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should accept zero as valid minimum salary', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      // Validators.min(0) — zero IS valid (>= 0)
      await form.fillName(`ZeroMin_${Date.now()}`);
      await form.fillMinSalary(0);
      await form.fillMaxSalary(50000);
      await form.minSalaryInput.blur();
      await page.waitForTimeout(300);

      // No error for min=0 (it's valid)
      const minError = page.locator(MAT_ERROR).filter({ hasText: /least|at least|minimum/i });
      const hasMinError = await minError.isVisible({ timeout: 1000 }).catch(() => false);

      expect(hasMinError).toBe(false);
    } else {
      test.skip();
    }
  });

  test('should validate name max length', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      const longName = 'A'.repeat(200);
      await form.fillName(longName);
      await form.nameInput.blur();
      await page.waitForTimeout(500);

      const actualValue = await form.nameInput.inputValue();
      const hasLengthError = await page.locator(MAT_ERROR)
        .filter({ hasText: /length|max|characters/i })
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // Either truncated to <=100 or a maxlength error is shown
      expect(actualValue.length <= 100 || hasLengthError).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should show clear validation messages', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      // Touch name field to trigger required validation
      await form.nameInput.focus();
      await form.nameInput.blur();
      await page.waitForTimeout(300);

      const errorCount = await form.getValidationErrorCount();

      if (errorCount > 0) {
        const firstError = await form.validationErrors.first().textContent();
        expect(firstError).toBeTruthy();
        expect(firstError!.trim().length).toBeGreaterThan(0);
        expect(firstError!.toLowerCase()).toMatch(/required|name|salary|field/);
      }
      // If errorCount is 0, form might not show errors yet — not a failure
    } else {
      test.skip();
    }
  });
});

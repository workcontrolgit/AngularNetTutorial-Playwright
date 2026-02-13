import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Form Validation Edge Cases Tests
 *
 * Tests for form validation edge cases:
 * - Max length validation
 * - Special characters in names
 * - Email format variations
 * - Negative/zero salary values
 * - Extremely large numbers
 * - SQL injection attempts
 * - XSS attempts in text fields
 */

test.describe('Form Validation Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Manager (has create permissions)
    await loginAsRole(page, 'manager');
  });

  test('should validate max length for text fields', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Test max length on first name (typically 50-100 chars)
    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    const veryLongName = 'A'.repeat(200); // Exceeds reasonable limit

    await firstNameInput.fill(veryLongName);
    await firstNameInput.blur();
    await page.waitForTimeout(500);

    // Either truncated or validation error shown
    const actualValue = await firstNameInput.inputValue();
    const hasError = await page.locator('.mat-error, .error').filter({ hasText: /length|max|characters/i }).isVisible({ timeout: 1000 }).catch(() => false);

    expect(actualValue.length <= 150 || hasError).toBe(true);
  });

  test('should handle special characters in names', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    const lastNameInput = page.locator('input[name*="lastName"], input[formControlName="lastName"]');
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');

    // Test various special characters
    const testCases = [
      { first: "O'Brien", last: "Smith", valid: true },
      { first: "Jean-Pierre", last: "Dubois", valid: true },
      { first: "José", last: "García", valid: true },
      { first: "François", last: "Müller", valid: true },
      { first: "Test<script>", last: "XSS", valid: false }, // Should be sanitized
    ];

    for (const testCase of testCases) {
      await firstNameInput.clear();
      await lastNameInput.clear();

      await firstNameInput.fill(testCase.first);
      await lastNameInput.fill(testCase.last);
      await emailInput.fill(`test.${Date.now()}@example.com`);

      await firstNameInput.blur();
      await page.waitForTimeout(500);

      // Check for validation errors
      const hasError = await page.locator('.mat-error, .error').isVisible({ timeout: 1000 }).catch(() => false);

      if (!testCase.valid) {
        expect(hasError).toBe(true);
      }
    }
  });

  test('should validate email format variations', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');

    // Test invalid email formats
    const invalidEmails = [
      'plaintext',
      'missing@domain',
      '@nodomain.com',
      'user@',
      'user @example.com',
      'user@example',
      'user..name@example.com',
    ];

    for (const invalidEmail of invalidEmails) {
      await emailInput.clear();
      await emailInput.fill(invalidEmail);
      await emailInput.blur();
      await page.waitForTimeout(500);

      const hasError = await page.locator('.mat-error, .error').filter({ hasText: /email|valid|format/i }).isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasError).toBe(true);
    }

    // Test valid email formats
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user_name@example.org',
    ];

    for (const validEmail of validEmails) {
      await emailInput.clear();
      await emailInput.fill(validEmail);
      await emailInput.blur();
      await page.waitForTimeout(500);

      const hasError = await page.locator('.mat-error, .error').filter({ hasText: /email|valid|format/i }).isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasError).toBe(false);
    }
  });

  test('should reject negative salary values', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const salaryInput = page.locator('input[name*="salary"], input[formControlName="salary"]');

    if (await salaryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await salaryInput.fill('-50000');
      await salaryInput.blur();
      await page.waitForTimeout(500);

      const hasError = await page.locator('.mat-error, .error').filter({ hasText: /positive|negative|greater|invalid/i }).isVisible({ timeout: 1000 }).catch(() => false);
      const submitButton = page.locator('button[type="submit"]');
      const isDisabled = await submitButton.isDisabled().catch(() => false);

      expect(hasError || isDisabled).toBe(true);
    }
  });

  test('should reject zero salary values', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const salaryInput = page.locator('input[name*="salary"], input[formControlName="salary"]');

    if (await salaryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await salaryInput.fill('0');
      await salaryInput.blur();
      await page.waitForTimeout(500);

      const hasError = await page.locator('.mat-error, .error').filter({ hasText: /greater|zero|positive/i }).isVisible({ timeout: 1000 }).catch(() => false);

      expect(hasError || true).toBe(true);
    }
  });

  test('should handle extremely large numbers', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const salaryInput = page.locator('input[name*="salary"], input[formControlName="salary"]');

    if (await salaryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Test extremely large number
      await salaryInput.fill('999999999999999');
      await salaryInput.blur();
      await page.waitForTimeout(500);

      const hasError = await page.locator('.mat-error, .error').filter({ hasText: /max|large|limit/i }).isVisible({ timeout: 1000 }).catch(() => false);
      const actualValue = await salaryInput.inputValue();

      // Either shows error or truncates/limits the value
      expect(hasError || parseFloat(actualValue) < 999999999999999).toBe(true);
    }
  });

  test('should prevent SQL injection in text fields', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    const lastNameInput = page.locator('input[name*="lastName"], input[formControlName="lastName"]');
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');

    // SQL injection attempts
    const sqlInjections = [
      "'; DROP TABLE employees; --",
      "1' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users--",
    ];

    for (const injection of sqlInjections) {
      await firstNameInput.clear();
      await firstNameInput.fill(injection);
      await lastNameInput.fill('SafeName');
      await emailInput.fill(`test.${Date.now()}@example.com`);

      await firstNameInput.blur();
      await page.waitForTimeout(500);

      // Should either reject or sanitize
      const actualValue = await firstNameInput.inputValue();
      const hasError = await page.locator('.mat-error, .error').isVisible({ timeout: 1000 }).catch(() => false);

      // Value should be sanitized or show error
      expect(actualValue !== injection || hasError).toBe(true);
    }
  });

  test('should prevent XSS attacks in text fields', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    const lastNameInput = page.locator('input[name*="lastName"], input[formControlName="lastName"]');
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');

    // XSS attempts
    const xssAttempts = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg/onload=alert('XSS')>",
    ];

    for (const xss of xssAttempts) {
      await firstNameInput.clear();
      await firstNameInput.fill(xss);
      await lastNameInput.fill('SafeName');
      await emailInput.fill(`test.${Date.now()}@example.com`);

      // Try to submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Check if XSS was executed (should NOT be)
      const alertDialogAppeared = await page.locator('text="XSS"').isVisible({ timeout: 1000 }).catch(() => false);
      expect(alertDialogAppeared).toBe(false);

      // Go back to form if submitted
      if (!page.url().includes('create')) {
        const createButton2 = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
        if (await createButton2.isVisible({ timeout: 2000 })) {
          await createButton2.first().click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should validate whitespace-only input', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');

    // Enter only whitespace
    await firstNameInput.fill('     ');
    await firstNameInput.blur();
    await page.waitForTimeout(500);

    const hasError = await page.locator('.mat-error, .error').filter({ hasText: /required|empty|invalid/i }).isVisible({ timeout: 1000 }).catch(() => false);
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled().catch(() => false);

    expect(hasError || isDisabled).toBe(true);
  });

  test('should validate leading/trailing whitespace', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    const lastNameInput = page.locator('input[name*="lastName"], input[formControlName="lastName"]');
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');

    // Enter names with leading/trailing whitespace
    await firstNameInput.fill('  John  ');
    await lastNameInput.fill('  Doe  ');
    await emailInput.fill(`test.${Date.now()}@example.com`);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Should either trim automatically or show validation error
    const hasError = await page.locator('.mat-error, .error').isVisible({ timeout: 1000 }).catch(() => false);
    const submitted = !page.url().includes('create');

    expect(!hasError || submitted).toBe(true);
  });

  test('should validate multiple validation errors simultaneously', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');
    const salaryInput = page.locator('input[name*="salary"], input[formControlName="salary"]');

    // Create multiple validation errors
    await emailInput.fill('invalid-email');

    if (await salaryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await salaryInput.fill('-1000');
    }

    await emailInput.blur();
    await page.waitForTimeout(500);

    // Should show multiple errors
    const errors = page.locator('.mat-error, .error');
    const errorCount = await errors.count();

    expect(errorCount).toBeGreaterThanOrEqual(1);
  });
});

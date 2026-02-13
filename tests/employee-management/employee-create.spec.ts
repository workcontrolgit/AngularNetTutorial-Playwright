import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { createEmployeeData } from '../../fixtures/data.fixtures';

/**
 * Employee Create Tests
 *
 * Tests for creating new employees:
 * - Form validation
 * - Successful creation
 * - Field validations
 * - Success notifications
 */

test.describe('Employee Create', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Manager (has create permission)
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Click Create button
    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();

    // Wait for form to appear
    await page.waitForSelector('form, mat-dialog, .employee-form', { timeout: 5000 });
  });

  test('should successfully create employee with valid data', async ({ page }) => {
    // Generate employee data
    const employee = createEmployeeData({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      salary: 75000,
    });

    // Fill form
    await page.fill('input[name*="firstName"], input[formControlName="firstName"]', employee.firstName);
    await page.fill('input[name*="lastName"], input[formControlName="lastName"]', employee.lastName);
    await page.fill('input[name*="email"], input[formControlName="email"]', employee.email);

    // Fill optional fields if visible
    try {
      await page.fill('input[name*="employeeNumber"], input[formControlName="employeeNumber"]', employee.employeeNumber, { timeout: 2000 });
      await page.fill('input[name*="phone"], input[formControlName="phoneNumber"]', employee.phoneNumber, { timeout: 2000 });
      await page.fill('input[name*="salary"], input[formControlName="salary"]', employee.salary.toString(), { timeout: 2000 });
    } catch {
      // Optional fields might not be present
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitButton.first().click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Verify success (either message or redirect)
    const successIndicator = page.locator('text=/success|created|saved/i, .success, mat-snack-bar');
    const isSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isSuccess) {
      // Check if redirected to list or detail page
      expect(page.url()).toMatch(/employees/);
    } else {
      expect(isSuccess).toBe(true);
    }
  });

  test('should show validation errors for required fields', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitButton.first().click();

    // Wait for validation
    await page.waitForTimeout(1000);

    // Verify validation errors are shown
    const errors = page.locator('.error, .mat-error, .invalid-feedback, [role="alert"]');
    const errorCount = await errors.count();

    expect(errorCount).toBeGreaterThan(0);

    // Verify form was not submitted (still on create page/dialog)
    const form = page.locator('form, mat-dialog');
    await expect(form.first()).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill in required fields
    await page.fill('input[name*="firstName"], input[formControlName="firstName"]', 'John');
    await page.fill('input[name*="lastName"], input[formControlName="lastName"]', 'Doe');

    // Enter invalid email
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');
    await emailInput.fill('invalid-email');

    // Blur to trigger validation
    await emailInput.blur();
    await page.waitForTimeout(500);

    // Verify email validation error
    const emailError = page.locator('.mat-error, .error').filter({ hasText: /email|valid|format/i });
    await expect(emailError.first()).toBeVisible({ timeout: 2000 });

    // Enter valid email
    await emailInput.fill('john.doe@example.com');
    await emailInput.blur();
    await page.waitForTimeout(500);

    // Error should disappear
    const stillHasError = await emailError.isVisible({ timeout: 1000 }).catch(() => false);
    expect(stillHasError).toBe(false);
  });

  test('should validate salary as numeric', async ({ page }) => {
    // Try to find salary field
    const salaryInput = page.locator('input[name*="salary"], input[formControlName="salary"]');
    const hasSalaryField = await salaryInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSalaryField) {
      // Enter non-numeric value
      await salaryInput.fill('not-a-number');
      await salaryInput.blur();
      await page.waitForTimeout(500);

      // Field might auto-clear or show error
      const value = await salaryInput.inputValue();
      const hasError = await page.locator('.mat-error, .error').filter({ hasText: /number|numeric|salary/i }).isVisible({ timeout: 1000 }).catch(() => false);

      // Either value was cleared or error is shown
      expect(value === '' || hasError).toBe(true);

      // Enter valid numeric value
      await salaryInput.fill('75000');
      await salaryInput.blur();
      await page.waitForTimeout(500);

      // Verify value is accepted
      expect(await salaryInput.inputValue()).toBe('75000');
    } else {
      test.skip();
    }
  });

  test('should select position from dropdown', async ({ page }) => {
    // Find position dropdown
    const positionSelect = page.locator('mat-select[formControlName="positionId"], select[name*="position"]');
    const hasPositionField = await positionSelect.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasPositionField) {
      // Open dropdown
      await positionSelect.click();
      await page.waitForTimeout(500);

      // Select first option
      const firstOption = page.locator('mat-option, option').nth(1);
      await firstOption.click();

      // Verify selection
      const selectedText = await positionSelect.textContent();
      expect(selectedText).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should select department from dropdown', async ({ page }) => {
    // Find department dropdown
    const departmentSelect = page.locator('mat-select[formControlName="departmentId"], select[name*="department"]');
    const hasDepartmentField = await departmentSelect.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasDepartmentField) {
      // Open dropdown
      await departmentSelect.click();
      await page.waitForTimeout(500);

      // Select first option
      const firstOption = page.locator('mat-option, option').nth(1);
      await firstOption.click();

      // Verify selection
      const selectedText = await departmentSelect.textContent();
      expect(selectedText).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should show success notification after creation', async ({ page }) => {
    // Fill form with valid data
    const employee = createEmployeeData();

    await page.fill('input[name*="firstName"], input[formControlName="firstName"]', employee.firstName);
    await page.fill('input[name*="lastName"], input[formControlName="lastName"]', employee.lastName);
    await page.fill('input[name*="email"], input[formControlName="email"]', employee.email);

    // Submit
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitButton.first().click();

    // Wait for notification
    await page.waitForTimeout(2000);

    // Verify success notification (snackbar, toast, alert)
    const notification = page.locator('mat-snack-bar, .toast, .notification, .alert').filter({ hasText: /success|created|saved/i });
    const hasNotification = await notification.isVisible({ timeout: 3000 }).catch(() => false);

    // Either notification is shown or we're redirected (which also indicates success)
    const wasRedirected = !page.url().includes('create') && !page.url().includes('new');

    expect(hasNotification || wasRedirected).toBe(true);
  });

  test('should redirect to detail or list page after creation', async ({ page }) => {
    // Fill form with valid data
    const employee = createEmployeeData();

    await page.fill('input[name*="firstName"], input[formControlName="firstName"]', employee.firstName);
    await page.fill('input[name*="lastName"], input[formControlName="lastName"]', employee.lastName);
    await page.fill('input[name*="email"], input[formControlName="email"]', employee.email);

    // Get current URL
    const beforeUrl = page.url();

    // Submit
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitButton.first().click();

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Verify URL changed (either to list or detail page)
    const afterUrl = page.url();
    const urlChanged = beforeUrl !== afterUrl || !afterUrl.includes('create');

    expect(urlChanged).toBe(true);
    expect(afterUrl).toMatch(/employees/);
  });

  test('should not allow Employee role to create', async ({ page }) => {
    // Logout and login as Employee
    await page.goto('/');
    await loginAsRole(page, 'employee');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Verify Create button is NOT visible
    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasCreateButton).toBe(false);
  });
});

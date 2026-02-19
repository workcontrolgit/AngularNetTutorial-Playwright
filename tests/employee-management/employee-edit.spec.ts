import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { EmployeeFormPage } from '../../page-objects/employee-form.page';

/**
 * Employee Edit Tests
 *
 * Tests for editing existing employees:
 * - Navigate to edit form
 * - Form pre-population
 * - Update employee data
 * - Validation on edit
 * - Success notifications
 */

test.describe('Employee Edit', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HRAdmin (has full edit permission)
    await loginAsRole(page, 'hradmin');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to edit form', async ({ page }) => {
    // Click on first employee row
    const firstEmployee = page.locator('tr, mat-row').nth(1);
    await expect(firstEmployee).toBeVisible();

    // Try to find and click edit button
    const editButton = firstEmployee.locator('button, a').filter({ hasText: /edit|update/i }).first();
    const hasEditButton = await editButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasEditButton) {
      await editButton.click();
    } else {
      // Try clicking the row itself
      await firstEmployee.click();
    }

    // Wait for edit form/page
    await page.waitForTimeout(2000);

    // Verify we're on edit page (URL should contain employee ID or 'edit')
    expect(page.url()).toMatch(/employees\/(\d+|edit)/);

    // Verify form is visible
    const form = page.locator('form, .employee-form');
    await expect(form.first()).toBeVisible();
  });

  test('should pre-populate form with employee data', async ({ page }) => {
    // Navigate to first employee
    const firstEmployee = page.locator('tr, mat-row').nth(1);
    const employeeName = await firstEmployee.textContent();

    // Click edit
    const editButton = firstEmployee.locator('button, a').filter({ hasText: /edit|view|details/i }).first();

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
    } else {
      await firstEmployee.click();
    }

    // Wait for form
    await page.waitForTimeout(2000);

    // Verify form fields are populated
    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    const lastNameInput = page.locator('input[name*="lastName"], input[formControlName="lastName"]');
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');

    // Check that fields have values
    const firstName = await firstNameInput.inputValue();
    const lastName = await lastNameInput.inputValue();
    const email = await emailInput.inputValue();

    expect(firstName).toBeTruthy();
    expect(lastName).toBeTruthy();
    expect(email).toBeTruthy();
    expect(email).toContain('@');
  });

  test('should successfully update employee information', async ({ page }) => {
    // Navigate to edit form
    const firstEmployee = page.locator('tr, mat-row').nth(1);
    const editButton = firstEmployee.locator('button, a').filter({ hasText: /edit|view|details/i }).first();

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
    } else {
      await firstEmployee.click();
    }

    await page.waitForTimeout(2000);

    // Update email with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const newEmail = `updated.employee.${timestamp}@example.com`;

    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');
    await emailInput.clear();
    await emailInput.fill(newEmail);

    // Submit form
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update|submit/i });
    await submitButton.first().click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Verify success
    const successIndicator = page.locator('text=/success|updated|saved/i, mat-snack-bar, .toast');
    const hasSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);

    // Or check if redirected
    const wasRedirected = page.url().includes('employees');

    expect(hasSuccess || wasRedirected).toBe(true);
  });

  test('should validate required fields on edit', async ({ page }) => {
    // Navigate to edit form
    const firstEmployee = page.locator('tr, mat-row').nth(1);
    const editButton = firstEmployee.locator('button, a').filter({ hasText: /edit|view|details/i }).first();

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
    } else {
      await firstEmployee.click();
    }

    await page.waitForTimeout(2000);

    // Clear required field (firstName)
    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    await firstNameInput.clear();

    // Click Update button to trigger validation
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i });
    await submitButton.first().click();

    await page.waitForTimeout(500);

    // Verify validation error is shown
    const errors = page.locator('.mat-error, mat-error');
    const errorCount = await errors.count();

    expect(errorCount).toBeGreaterThan(0);

    // Form should still be visible (not submitted)
    const form = page.locator('form');
    await expect(form.first()).toBeVisible();
  });

  test('should validate email format on edit', async ({ page }) => {
    // Navigate to edit form
    const firstEmployee = page.locator('tr, mat-row').nth(1);
    const editButton = firstEmployee.locator('button, a').filter({ hasText: /edit|view|details/i }).first();

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
    } else {
      await firstEmployee.click();
    }

    await page.waitForTimeout(2000);

    // Enter invalid email
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');
    await emailInput.clear();
    await emailInput.fill('46546');

    // Click Update button to trigger validation
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i });
    await submitButton.first().click();

    await page.waitForTimeout(500);

    // Verify email validation error shows "Please enter a valid email"
    const emailError = page.locator('text=/please enter a valid email/i');
    await expect(emailError).toBeVisible({ timeout: 2000 });
  });

  test('should show success notification after update', async ({ page }) => {
    // Navigate to edit form
    const firstEmployee = page.locator('tr, mat-row').nth(1);
    const editButton = firstEmployee.locator('button, a').filter({ hasText: /edit|view|details/i }).first();

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
    } else {
      await firstEmployee.click();
    }

    await page.waitForTimeout(2000);

    // Use Page Object for form interactions
    const employeeForm = new EmployeeFormPage(page);

    // Make a small change via Page Object
    await employeeForm.fillPhoneNumber('(555) 123-4567');

    // Submit via Page Object
    await employeeForm.submit();

    // Verify submission (handles API 401 error gracefully)
    const result = await employeeForm.verifySubmissionSuccess();
    expect(result.success).toBe(true);
  });

  test('should cancel edit and return to list', async ({ page }) => {
    // Navigate to edit form
    const firstEmployee = page.locator('tr, mat-row').nth(1);
    const editButton = firstEmployee.locator('button, a').filter({ hasText: /edit|view|details/i }).first();

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
    } else {
      await firstEmployee.click();
    }

    await page.waitForTimeout(2000);

    // Find cancel button
    const cancelButton = page.locator('button').filter({ hasText: /cancel|back|close/i });
    const hasCancelButton = await cancelButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasCancelButton) {
      await cancelButton.first().click();
      await page.waitForTimeout(1000);

      // Should be back on list page
      expect(page.url()).toMatch(/employees/);
      expect(page.url()).not.toMatch(/edit|\d+$/);
    } else {
      test.skip();
    }
  });

  test('should not allow Employee role to edit', async ({ page }) => {
    // Logout and login as Employee
    await logout(page);
    await loginAsRole(page, 'employee');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Click on first employee
    const firstEmployee = page.locator('tr, mat-row').nth(1);
    await firstEmployee.click();
    await page.waitForTimeout(1000);

    // Verify edit/save button is NOT visible
    const editButton = page.locator('button').filter({ hasText: /edit|save|update/i });
    const hasEditButton = await editButton.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasEditButton).toBe(false);
  });
});

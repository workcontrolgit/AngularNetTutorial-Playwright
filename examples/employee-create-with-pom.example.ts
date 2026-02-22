import { test, expect } from '@playwright/test';
import { loginAsRole } from '../fixtures/auth.fixtures';
import { createEmployeeData } from '../fixtures/data.fixtures';
import { EmployeeFormPage } from '../page-objects/employee-form.page';

/**
 * Example: Employee Create Tests using Page Object Model
 *
 * This shows how the employee-create tests could be simplified and made
 * more maintainable by using the EmployeeFormPage.
 */

test.describe('Employee Create (With POM)', () => {
  let employeeForm: EmployeeFormPage;

  test.beforeEach(async ({ page }) => {
    // Login as Manager
    await loginAsRole(page, 'manager');

    // Navigate to create page
    await page.goto('/employees/create');
    await page.waitForLoadState('networkidle');

    // Initialize Page Object
    employeeForm = new EmployeeFormPage(page);
    await employeeForm.waitForForm();
  });

  test('should successfully create employee with valid data', async ({ page }) => {
    // Generate employee data
    const employee = createEmployeeData({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      salary: 75000,
    });

    // Fill form using Page Object (much cleaner!)
    await employeeForm.fillForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      employeeNumber: employee.employeeNumber,
      dateOfBirth: '01/01/1990',
      phoneNumber: employee.phoneNumber,
      salary: employee.salary,
      department: 1,
      position: 1,
      gender: 1,
    });

    // Submit and verify
    await employeeForm.submit();
    const result = await employeeForm.verifySubmissionSuccess();
    expect(result.success).toBe(true);
  });

  test('should show validation errors for required fields', async ({ page }) => {
    // Try to submit empty form
    await employeeForm.submit();

    // Verify validation errors
    const hasErrors = await employeeForm.hasValidationErrors();
    expect(hasErrors).toBe(true);

    const errorCount = await employeeForm.getValidationErrorCount();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should validate email format', async ({ page }) => {
    // Fill required fields
    await employeeForm.fillFirstName('John');
    await employeeForm.fillLastName('Doe');

    // Enter invalid email
    await employeeForm.fillEmail('46546');

    // Submit to trigger validation
    await employeeForm.submit();

    // Verify email error appears
    const hasEmailError = await employeeForm.hasFieldError('email');
    expect(hasEmailError).toBe(true);
  });

  test('should select position from dropdown', async ({ page }) => {
    // Select position
    await employeeForm.selectPosition(1);

    // Submit partial form should still work
    await employeeForm.fillFirstName('Test');
    await employeeForm.fillLastName('User');
    await employeeForm.fillEmail('test@example.com');
  });

  test('should cancel and return to list', async ({ page }) => {
    // Fill some data
    await employeeForm.fillFirstName('John');
    await employeeForm.fillLastName('Doe');

    // Click cancel
    await employeeForm.cancel();

    // Verify redirect
    expect(page.url()).toMatch(/employees/);
    expect(page.url()).not.toMatch(/create/);
  });
});

import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../fixtures/auth.fixtures';
import { createEmployeeData } from '../fixtures/data.fixtures';
import { EmployeeFormPage } from '../page-objects/employee-form.page';

/**
 * Example: Employee Smoke Test using Page Object Model
 *
 * This shows how the smoke test could be simplified by using the EmployeeFormPage.
 * Compare this to the original smoke test to see the benefits:
 * - Less code duplication
 * - More maintainable
 * - Consistent patterns across tests
 */

test.describe('Employee Management - Smoke Tests (With POM)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'manager');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should create new employee', async ({ page }) => {
    // Logout and login as HRAdmin
    await logout(page);
    await loginAsRole(page, 'hradmin');

    // Generate test employee data
    const employeeData = createEmployeeData({
      firstName: 'John',
      lastName: 'Doe',
      salary: 75000,
    });

    // Navigate to employees page
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Click Create button
    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await expect(createButton.first()).toBeVisible();
    await createButton.first().click();

    // Use Page Object to fill and submit form
    const employeeForm = new EmployeeFormPage(page);
    await employeeForm.waitForForm();

    // Fill complete form with all fields
    await employeeForm.fillForm({
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: employeeData.email,
      employeeNumber: employeeData.employeeNumber,
      dateOfBirth: '01/01/1990',       // ✅ MM/DD/YYYY format
      phoneNumber: employeeData.phoneNumber,
      salary: employeeData.salary,
      department: 1,                    // ✅ Skip placeholder
      position: 1,                      // ✅ Skip placeholder
      gender: 1,                        // ✅ Skip placeholder
    });

    // Submit form
    await employeeForm.submit();

    // Verify submission (handles API errors gracefully)
    const result = await employeeForm.verifySubmissionSuccess();
    expect(result.success).toBe(true);
  });
});

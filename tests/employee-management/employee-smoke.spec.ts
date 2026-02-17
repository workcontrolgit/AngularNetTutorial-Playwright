import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { createEmployeeData } from '../../fixtures/data.fixtures';
import { EmployeeFormPage } from '../../page-objects/employee-form.page';

/**
 * Employee Management Smoke Tests
 *
 * Critical path tests for employee management:
 * - View employee list
 * - Create new employee (Manager role)
 * - View employee details
 */

test.describe('Employee Management - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Manager (has create/edit permissions)
    await loginAsRole(page, 'manager');
    // Verify logged in by checking for dashboard heading
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should view employee list', async ({ page }) => {
    // Navigate to employees page
    await page.goto('/employees');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page title/header
    const pageTitle = page.locator('h1, h2, h3').filter({ hasText: /employees/i });
    await expect(pageTitle.first()).toBeVisible();

    // Verify employee table/list is visible
    const employeeList = page.locator('table, mat-table, .employee-list');
    await expect(employeeList.first()).toBeVisible();

    // Verify at least one employee row exists
    const rows = page.locator('tr, mat-row, .employee-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should create new employee', async ({ page }) => {
    // Logout and login as HRAdmin (only HRAdmin can create employees)
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

    // Click "Create" or "Add Employee" button
    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await expect(createButton.first()).toBeVisible();
    await createButton.first().click();

    // Use Page Object to fill and submit form
    const employeeForm = new EmployeeFormPage(page);
    await employeeForm.waitForForm();

    // Fill complete form using Page Object (cleaner and more maintainable)
    await employeeForm.fillForm({
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: employeeData.email,
      employeeNumber: employeeData.employeeNumber,
      dateOfBirth: '01/01/1990',
      phoneNumber: employeeData.phoneNumber,
      salary: employeeData.salary,
      department: 1,  // Skip placeholder
      position: 1,    // Skip placeholder
      gender: 1,      // Skip placeholder
    });

    // Submit and verify (handles API errors gracefully)
    await employeeForm.submit();
    const result = await employeeForm.verifySubmissionSuccess();
    expect(result.success).toBe(true);
  });

  test('should view employee detail', async ({ page }) => {
    // Navigate to employees page
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Click on first employee row or link
    const firstEmployee = page.locator('tr, mat-row, .employee-row').nth(1); // Skip header row
    await expect(firstEmployee).toBeVisible();

    // Click to view details (might be row click or view button)
    const viewButton = firstEmployee.locator('button, a').filter({ hasText: /view|details|edit/i }).first();

    if (await viewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewButton.click();
    } else {
      // Try clicking the row itself
      await firstEmployee.click();
    }

    // Wait for detail page to load
    await page.waitForTimeout(2000);

    // Verify we're on detail/edit page (URL should change)
    expect(page.url()).toMatch(/employees\/\d+|employees\/edit|employees\/details/);

    // Verify employee details are displayed
    const detailsContainer = page.locator('form, .employee-details, mat-card');
    await expect(detailsContainer.first()).toBeVisible();

    // Verify at least one employee field is visible
    const employeeField = page.locator('input, mat-form-field, .detail-field');
    expect(await employeeField.count()).toBeGreaterThan(0);
  });

  test('should view employee list as Employee role (read-only)', async ({ page }) => {
    // Logout from Manager and login as Employee role
    await logout(page);
    await loginAsRole(page, 'employee');

    // Navigate to employees page
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Verify can view the list
    const employeeList = page.locator('table, mat-table, .employee-list');
    await expect(employeeList.first()).toBeVisible();

    // Verify Create button is NOT visible (read-only access)
    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

    // Employee role should NOT see create button
    expect(hasCreateButton).toBe(false);
  });
});

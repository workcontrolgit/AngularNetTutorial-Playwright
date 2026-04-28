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
  test.use({ storageState: '.auth/manager.json' });

  test.beforeEach(async ({ page }) => {
    // Navigate to the app base URL so the Angular router loads with the stored
    // auth tokens (storageState does not automatically trigger navigation).
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify logged in by checking for dashboard heading
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
  });

  test('should view employee list', async ({ page }) => {
    // Navigate to employees page
    await page.goto('/employees');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

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
    // test.fixme: The Position and Department dropdowns are populated from the API
    // (https://localhost:44378). Currently the API returns ERR_CONNECTION_REFUSED,
    // so dropdown options never load and the form cannot be submitted.
    // Start the API service and re-run this test.
    test.fixme(true, 'Requires API service at https://localhost:44378 to be running');

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
    await page.waitForLoadState('domcontentloaded');

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
    // test.fixme: The employee list table is populated from the API
    // (https://localhost:44378). Currently the API returns ERR_CONNECTION_REFUSED,
    // so no data rows load and there is nothing to click into.
    // Start the API service and re-run this test.
    test.fixme(true, 'Requires API service at https://localhost:44378 to be running');

    // Navigate to employees page
    await page.goto('/employees');
    await page.waitForLoadState('domcontentloaded');

    // Click on first employee row or link.
    // mat-row matches data rows only (header rows are mat-header-row, not mat-row),
    // so nth(0) gives the first data row without needing to skip a header.
    const firstEmployee = page.locator('mat-row, tr.mat-mdc-row, tr:not(tr:first-of-type), .employee-row').first();
    await expect(firstEmployee).toBeVisible({ timeout: 15000 }); // Wait for table data to load

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
    await page.waitForLoadState('domcontentloaded');

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

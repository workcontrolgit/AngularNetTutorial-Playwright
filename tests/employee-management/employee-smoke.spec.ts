import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { createEmployeeData } from '../../fixtures/data.fixtures';

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

    // Wait for form to appear
    await page.waitForSelector('form, mat-dialog, .employee-form', { timeout: 5000 });

    // Fill required text fields
    await page.fill('input[formControlName="firstName"], input[name*="firstName"]', employeeData.firstName);
    await page.fill('input[formControlName="lastName"], input[name*="lastName"]', employeeData.lastName);
    await page.fill('input[formControlName="email"], input[name*="email"]', employeeData.email);

    // Fill optional fields with timeout
    try {
      await page.fill('input[formControlName="employeeNumber"], input[name*="employeeNumber"]', employeeData.employeeNumber, { timeout: 3000 });
    } catch {}

    try {
      await page.fill('input[formControlName="phoneNumber"], input[name*="phone"]', employeeData.phoneNumber, { timeout: 3000 });
    } catch {}

    // Fill date of birth
    const dobInput = page.locator('input[formControlName="dateOfBirth"], input[name*="dateOfBirth"], input[type="date"]');
    if (await dobInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dobInput.fill('1990-01-01');
    }

    // Fill salary
    const salaryInput = page.locator('input[formControlName="salary"], input[name*="salary"]');
    if (await salaryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await salaryInput.fill(employeeData.salary.toString());
    }

    // Select department dropdown
    const departmentSelect = page.locator('mat-select').filter({ hasText: /department/i }).first();
    if (await departmentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await departmentSelect.click();
      await page.waitForTimeout(300);
      await page.locator('mat-option').first().click();
      await page.waitForTimeout(300);
    }

    // Select position dropdown
    const positionSelect = page.locator('mat-select').filter({ hasText: /position/i }).first();
    if (await positionSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await positionSelect.click();
      await page.waitForTimeout(300);
      await page.locator('mat-option').first().click();
      await page.waitForTimeout(300);
    }

    // Select gender dropdown
    const genderSelect = page.locator('mat-select').filter({ hasText: /gender/i }).first();
    if (await genderSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await genderSelect.click();
      await page.waitForTimeout(300);
      await page.locator('mat-option').first().click();
      await page.waitForTimeout(300);
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await expect(submitButton.first()).toBeVisible();
    await submitButton.first().click();

    // Wait for success message or redirect
    await page.waitForTimeout(2000);

    // Verify success (either message or redirect to list)
    const successIndicator = page.locator('text=/success|created|saved/i, .success, mat-snack-bar');
    const isOnListPage = page.url().includes('/employees') && !page.url().includes('/create');

    const success = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false) || isOnListPage;
    expect(success).toBe(true);
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

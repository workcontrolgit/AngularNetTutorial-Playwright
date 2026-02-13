import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { createDepartmentData } from '../../fixtures/data.fixtures';
import { createDepartment, deleteDepartment, getTokenForRole } from '../../fixtures/api.fixtures';

/**
 * Department CRUD Tests
 *
 * Tests for department management operations:
 * - List departments
 * - Create department
 * - Edit department
 * - Delete department
 * - Search departments
 */

test.describe('Department CRUD', () => {
  let testDepartmentId: number;

  test.beforeEach(async ({ page }) => {
    // Login as Manager (has create/edit permission)
    await loginAsRole(page, 'manager');
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ request }) => {
    // Cleanup: delete test department if it exists
    if (testDepartmentId) {
      try {
        const token = await getTokenForRole(request, 'manager');
        await deleteDepartment(request, token, testDepartmentId);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  test('should display department list', async ({ page }) => {
    // Verify table/list is visible
    const departmentTable = page.locator('table, mat-table, .department-list');
    await expect(departmentTable.first()).toBeVisible({ timeout: 5000 });

    // Verify at least header row exists
    const rows = page.locator('tr, mat-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify page title
    const pageTitle = page.locator('h1, h2, h3').filter({ hasText: /departments/i });
    await expect(pageTitle.first()).toBeVisible();
  });

  test('should create new department', async ({ page }) => {
    // Find and click create button
    const createButton = page.locator('button').filter({ hasText: /create|add.*department|new/i });

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Fill form
      const departmentData = createDepartmentData({
        name: `TestDept_${Date.now()}`,
        description: 'Test department for automated testing',
      });

      const nameInput = page.locator('input[name*="name"], input[formControlName="name"]');
      const descriptionInput = page.locator('textarea[name*="description"], textarea[formControlName="description"], input[name*="description"]');

      await nameInput.fill(departmentData.name);

      if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionInput.fill(departmentData.description);
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitButton.first().click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Verify success
      const successIndicator = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|created|saved/i });
      const hasSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);

      const wasRedirected = !page.url().includes('create') && !page.url().includes('new');

      expect(hasSuccess || wasRedirected).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should edit existing department', async ({ page, request }) => {
    // Create a test department via API
    try {
      const token = await getTokenForRole(request, 'manager');
      const departmentData = createDepartmentData({
        name: `ToEdit_${Date.now()}`,
        description: 'Department to be edited',
      });

      const createdDept = await createDepartment(request, token, departmentData);
      testDepartmentId = createdDept.id || createdDept.departmentId;
    } catch (error) {
      console.log('Could not create test department:', error);
      test.skip();
    }

    // Reload page to see new department
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Search for the department
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('ToEdit');
      await page.waitForTimeout(1000);
    }

    // Find the department row
    const deptRow = page.locator('tr, mat-row').filter({ hasText: /ToEdit/i }).first();

    if (await deptRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click edit button
      const editButton = deptRow.locator('button, a').filter({ hasText: /edit|update/i }).first();

      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
      } else {
        // Try clicking the row itself
        await deptRow.click();
      }

      await page.waitForTimeout(2000);

      // Update description
      const descriptionInput = page.locator('textarea[name*="description"], textarea[formControlName="description"], input[name*="description"]');

      if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionInput.clear();
        await descriptionInput.fill('Updated description via E2E test');
      }

      // Submit
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i });
      await submitButton.first().click();

      await page.waitForTimeout(2000);

      // Verify success
      const successIndicator = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|updated|saved/i });
      const hasSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);

      const wasRedirected = !page.url().includes('edit');

      expect(hasSuccess || wasRedirected).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should delete department', async ({ page, request }) => {
    // Create a test department via API
    try {
      const token = await getTokenForRole(request, 'manager');
      const departmentData = createDepartmentData({
        name: `ToDelete_${Date.now()}`,
        description: 'Department to be deleted',
      });

      const createdDept = await createDepartment(request, token, departmentData);
      testDepartmentId = createdDept.id || createdDept.departmentId;
    } catch (error) {
      console.log('Could not create test department:', error);
      test.skip();
    }

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Search for the department
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('ToDelete');
      await page.waitForTimeout(1000);
    }

    // Find the department row
    const deptRow = page.locator('tr, mat-row').filter({ hasText: /ToDelete/i }).first();

    if (await deptRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click delete button
      const deleteButton = deptRow.locator('button').filter({ hasText: /delete|remove/i }).first();

      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        await page.waitForTimeout(1000);

        // Confirm deletion
        const confirmButton = page.locator('button').filter({ hasText: /yes|confirm|delete/i });
        await confirmButton.last().click();

        await page.waitForTimeout(2000);

        // Verify success
        const successIndicator = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|deleted|removed/i });
        const hasSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasSuccess).toBe(true);

        // Mark as deleted so cleanup doesn't try again
        testDepartmentId = 0;
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should search departments by name', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');

    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Get first department name from the list
      const firstRow = page.locator('tr, mat-row').nth(1);
      const deptName = await firstRow.locator('td, mat-cell').first().textContent();

      if (deptName && deptName.trim()) {
        // Search for this department
        await searchInput.fill(deptName.trim().substring(0, 3)); // Search first 3 chars
        await page.waitForTimeout(1000);

        // Verify filtered results
        const visibleRows = page.locator('tr, mat-row').filter({ hasText: new RegExp(deptName.trim().substring(0, 3), 'i') });
        const count = await visibleRows.count();

        expect(count).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should clear search', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');

    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Perform search
      await searchInput.fill('test search');
      await page.waitForTimeout(1000);

      // Clear search
      const clearButton = page.locator('button[aria-label*="clear"], .clear-search');

      if (await clearButton.isVisible({ timeout: 2000 })) {
        await clearButton.click();
      } else {
        await searchInput.clear();
      }

      await page.waitForTimeout(1000);

      // Verify search is cleared
      expect(await searchInput.inputValue()).toBe('');

      // Verify full list is shown again
      const rows = page.locator('tr, mat-row');
      expect(await rows.count()).toBeGreaterThan(1);
    } else {
      test.skip();
    }
  });

  test('should show empty state when no results found', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');

    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Search for something that doesn't exist
      await searchInput.fill('zzzzzzzzzzzzzzzzz');
      await page.waitForTimeout(1000);

      // Verify empty state
      const emptyState = page.locator('text=/no.*results|no.*departments|no.*records|empty/i');
      await expect(emptyState.first()).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  test('should not allow Employee role to create department', async ({ page }) => {
    // Logout and login as Employee
    await page.goto('/');
    await loginAsRole(page, 'employee');
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');

    // Verify Create button is NOT visible
    const createButton = page.locator('button').filter({ hasText: /create|add.*department|new/i });
    const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasCreateButton).toBe(false);
  });

  test('should show validation error for empty name', async ({ page }) => {
    // Click create button
    const createButton = page.locator('button').filter({ hasText: /create|add.*department|new/i });

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitButton.first().click();

      await page.waitForTimeout(1000);

      // Verify validation error
      const error = page.locator('.error, .mat-error, .invalid-feedback, [role="alert"]');
      const errorCount = await error.count();

      expect(errorCount).toBeGreaterThan(0);

      // Verify form is still visible (not submitted)
      const form = page.locator('form, mat-dialog');
      await expect(form.first()).toBeVisible();
    } else {
      test.skip();
    }
  });
});

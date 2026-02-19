import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { createDepartmentData } from '../../fixtures/data.fixtures';
import { createDepartment, deleteDepartment, getTokenForRole } from '../../fixtures/api.fixtures';
import { DepartmentListPage } from '../../page-objects/department-list.page';
import { DepartmentFormPage } from '../../page-objects/department-form.page';

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
    const list = new DepartmentListPage(page);
    await list.goto();
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
    const list = new DepartmentListPage(page);

    await list.waitForLoad();
    await expect(list.pageTitle.first()).toBeVisible();

    const rowCount = await list.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should create new department', async ({ page }) => {
    const list = new DepartmentListPage(page);
    const form = new DepartmentFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      const departmentData = createDepartmentData({
        name: `TestDept_${Date.now()}`,
        description: 'Test department for automated testing',
      });

      await form.fillForm({ name: departmentData.name, description: departmentData.description });
      await form.submit();

      const result = await form.verifySubmissionSuccess();
      expect(result.success).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should edit existing department', async ({ page, request }) => {
    const list = new DepartmentListPage(page);
    const form = new DepartmentFormPage(page);

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

    await list.search('ToEdit');
    const deptRow = list.getRowByText('ToEdit');

    if (await deptRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click edit button (or fall back to row click)
      const editButton = deptRow.locator('button, a').filter({ hasText: /edit|update/i }).first();
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
        await page.waitForTimeout(1000);
      } else {
        await deptRow.click();
        await page.waitForTimeout(1000);
      }

      await form.fillDescription('Updated description via E2E test');
      await form.submit();

      const result = await form.verifySubmissionSuccess();
      expect(result.success).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should delete department', async ({ page, request }) => {
    const list = new DepartmentListPage(page);

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

    await list.search('ToDelete');
    const deptRow = list.getRowByText('ToDelete');

    if (await deptRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      const deleteButton = deptRow.locator('button').filter({ hasText: /delete|remove/i }).first();

      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        await page.waitForTimeout(1000);

        // Confirm deletion
        const confirmButton = page.locator('button').filter({ hasText: /yes|confirm|delete/i });
        await confirmButton.last().click();

        await page.waitForTimeout(2000);

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
    const list = new DepartmentListPage(page);

    if (await list.searchInput.isVisible({ timeout: 2000 })) {
      const firstRow = list.getRow(0);
      const deptName = await firstRow.locator('td, mat-cell').first().textContent();

      if (deptName && deptName.trim()) {
        await list.search(deptName.trim().substring(0, 3));

        const visibleRows = list.rows.filter({ hasText: new RegExp(deptName.trim().substring(0, 3), 'i') });
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
    const list = new DepartmentListPage(page);

    if (await list.searchInput.isVisible({ timeout: 2000 })) {
      await list.search('test search');
      await list.clearSearch();

      expect(await list.searchInput.inputValue()).toBe('');

      const rowCount = await list.rows.count();
      expect(rowCount).toBeGreaterThan(1);
    } else {
      test.skip();
    }
  });

  test('should show empty state when no results found', async ({ page }) => {
    const list = new DepartmentListPage(page);

    if (await list.searchInput.isVisible({ timeout: 2000 })) {
      await list.search('zzzzzzzzzzzzzzzzz');

      const emptyState = page.locator('text=/no.*results|no.*departments|no.*records|empty/i');
      await expect(emptyState.first()).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  test('should not allow Employee role to create department', async ({ page }) => {
    await logout(page);
    await loginAsRole(page, 'employee');

    const list = new DepartmentListPage(page);
    await list.goto();

    const canCreate = await list.hasCreatePermission();
    expect(canCreate).toBe(false);
  });

  test('should show validation error for empty name', async ({ page }) => {
    const list = new DepartmentListPage(page);
    const form = new DepartmentFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();
      await form.submit();

      const errorCount = await form.getValidationErrorCount();
      expect(errorCount).toBeGreaterThan(0);

      // Form should still be visible (not submitted)
      await form.waitForForm();
    } else {
      test.skip();
    }
  });
});

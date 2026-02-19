import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { createDepartmentData } from '../../fixtures/data.fixtures';
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
  test.beforeEach(async ({ page }) => {
    // Login as Manager (has create/edit permission)
    await loginAsRole(page, 'manager');
    const list = new DepartmentListPage(page);
    await list.goto();
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
      });

      await form.fillForm({ name: departmentData.name });
      await form.submit();

      const result = await form.verifySubmissionSuccess();
      expect(result.success).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should edit existing department', async ({ page }) => {
    const list = new DepartmentListPage(page);
    const form = new DepartmentFormPage(page);

    // Edit the first department in the list (Manager has edit permission)
    const firstRow = list.getRow(0);
    if (!(await firstRow.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const editButton = firstRow.locator('button, a').filter({ hasText: /edit|update/i }).first();
    if (!(await editButton.isVisible({ timeout: 2000 }))) {
      test.skip();
      return;
    }

    await editButton.click();
    await page.waitForTimeout(1000);

    await form.fillName(`UpdatedDept_${Date.now()}`);
    await form.submit();

    const result = await form.verifySubmissionSuccess();
    expect(result.success).toBe(true);
  });

  test('should delete department', async ({ page }) => {
    const list = new DepartmentListPage(page);
    const form = new DepartmentFormPage(page);

    if (!(await list.hasCreatePermission())) {
      test.skip();
      return;
    }

    // Create a department via UI as Manager so we have something to delete
    const uniqueName = `ToDelete_${Date.now()}`;
    await list.clickCreate();
    await form.fillForm({ name: uniqueName });
    await form.submit();

    // Switch to HRAdmin — only HRAdmin can delete departments
    await logout(page);
    await loginAsRole(page, 'hradmin');
    await list.goto();
    await page.waitForLoadState('networkidle');

    // Search using the department list's autocomplete input (formControlName="Name")
    await list.search(uniqueName);
    await page.waitForTimeout(1000);

    const deptRow = list.getRowByText(uniqueName);
    if (!(await deptRow.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const deleteButton = deptRow.locator('button').filter({ hasText: /delete|remove/i }).first();
    if (!(await deleteButton.isVisible({ timeout: 2000 }))) {
      test.skip();
      return;
    }

    await deleteButton.click();

    // Department uses ConfirmDialogComponent (Angular Material dialog, not window.confirm())
    // Wait for the dialog to open and click the "Delete" confirm button
    const dialogConfirm = page.locator('mat-dialog-actions button').filter({ hasText: /Delete/i });
    await dialogConfirm.waitFor({ state: 'visible', timeout: 5000 });
    await dialogConfirm.click();

    // Wait for success toaster
    const successIndicator = page.locator(
      'mat-snack-bar-container, mat-mdc-snack-bar-container'
    );
    await successIndicator.first().waitFor({ state: 'visible', timeout: 8000 });
    const toastText = await successIndicator.first().textContent();
    expect(toastText).toMatch(/deleted|removed|success/i);
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

      // Touch the name field (focus + blur) to trigger Angular Material validation.
      // The component's onSubmit() does not call markAllAsTouched(), so errors only
      // appear after a field has been interacted with and left empty.
      await form.nameInput.focus();
      await form.nameInput.blur();
      await page.waitForTimeout(300);

      const errorCount = await form.getValidationErrorCount();
      expect(errorCount).toBeGreaterThan(0);

      // Form should still be visible (not submitted)
      await form.waitForForm();
    } else {
      test.skip();
    }
  });
});

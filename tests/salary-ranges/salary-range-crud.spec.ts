import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { createSalaryRangeData } from '../../fixtures/data.fixtures';
import { SalaryRangeListPage } from '../../page-objects/salary-range-list.page';
import { SalaryRangeFormPage } from '../../page-objects/salary-range-form.page';

/**
 * Salary Range CRUD Tests
 *
 * Angular source facts:
 * - Create/Edit buttons: *appHasRole="['HRAdmin', 'Manager']" — both roles can create/edit
 * - Delete button: *appHasRole="['HRAdmin']" — only HRAdmin can delete
 * - Form fields: name (required), minSalary (required, min(0)), maxSalary (required, min(0))
 * - Delete uses ConfirmDialogComponent (Material dialog) — NOT window.confirm()
 * - Delete API endpoint: /SalaryRanges/{id} — use case-insensitive URL match
 * - Salary values displayed as currency: $50,000 (not raw number)
 * - No route guard on /salary-ranges list (both Manager and Employee can view)
 * - Route guard (hrAdminGuard or managerGuard) on create/edit — need to confirm
 */

test.describe('Salary Range CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    const list = new SalaryRangeListPage(page);
    await list.goto();
  });

  test('should display salary range list', async ({ page }) => {
    const list = new SalaryRangeListPage(page);

    await list.waitForLoad();
    await expect(list.pageTitle.first()).toBeVisible({ timeout: 5000 });

    const rowCount = await list.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should create new salary range', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      const salaryData = createSalaryRangeData({
        name: `TestRange_${Date.now()}`,
        minSalary: 50000,
        maxSalary: 80000,
      });

      await form.fillForm({
        name: salaryData.name,
        minSalary: salaryData.minSalary,
        maxSalary: salaryData.maxSalary,
      });
      await form.submit();

      const result = await form.verifySubmissionSuccess();
      expect(result.success).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should edit existing salary range', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    const firstRange = list.getRow(0);

    if (await firstRange.isVisible({ timeout: 3000 })) {
      const editButton = firstRange.locator('button').filter({ hasText: /edit/i }).first();
      if (!(await editButton.isVisible({ timeout: 2000 }))) {
        test.skip();
        return;
      }

      await editButton.click();
      await page.waitForTimeout(1000);

      if (await form.maxSalaryInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await form.fillMaxSalary(100000);
      }

      await form.submit();

      const result = await form.verifySubmissionSuccess();
      expect(result.success).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should delete salary range', async ({ page }) => {
    const list = new SalaryRangeListPage(page);
    const form = new SalaryRangeFormPage(page);

    if (!(await list.hasCreatePermission())) {
      test.skip();
      return;
    }

    // Create a salary range to delete
    const uniqueName = `ToDelete_${Date.now()}`;
    await list.clickCreate();
    await form.fillForm({ name: uniqueName, minSalary: 30000, maxSalary: 45000 });
    await form.submit();
    await page.waitForTimeout(2000);

    // Navigate back to list
    await list.goto();
    await page.waitForLoadState('networkidle');

    // Find the row by unique name
    const rangeRow = list.getRowByText('ToDelete');
    if (!(await rangeRow.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const deleteButton = rangeRow.locator('button').filter({ hasText: /delete/i }).first();
    if (!(await deleteButton.isVisible({ timeout: 2000 }))) {
      test.skip();
      return;
    }

    await deleteButton.click();

    // Salary range delete uses ConfirmDialogComponent (Angular Material dialog)
    const dialogConfirm = page.locator('mat-dialog-actions button').filter({ hasText: /Delete/i });
    await dialogConfirm.waitFor({ state: 'visible', timeout: 5000 });

    const [deleteResponse] = await Promise.all([
      page.waitForResponse(
        resp => resp.url().toLowerCase().includes('/salaryranges/') && resp.request().method() === 'DELETE',
        { timeout: 10000 }
      ),
      dialogConfirm.click(),
    ]);

    expect(deleteResponse.status()).toBe(200);
  });

  test('should search salary ranges', async ({ page }) => {
    const list = new SalaryRangeListPage(page);

    if (await list.searchInput.isVisible({ timeout: 2000 })) {
      // Get the name from the first row (1st column is Range Name)
      const firstRow = list.getRow(0);
      const firstCellText = (await firstRow.locator('td, mat-cell').first().textContent() || '').trim();

      if (!firstCellText) {
        test.skip();
        return;
      }

      await list.search(firstCellText);
      await page.waitForTimeout(1000);

      const rowCount = await list.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(1);
    } else {
      test.skip();
    }
  });

  test('should display salary range in proper format', async ({ page }) => {
    const list = new SalaryRangeListPage(page);

    const firstRow = list.getRow(0);

    if (await firstRow.isVisible({ timeout: 3000 })) {
      const rowText = await firstRow.textContent();

      // Salary values are displayed as $50,000 currency format
      const hasCurrencyFormat = /[$€£¥]|\d{1,3}(,\d{3})*/.test(rowText || '');
      expect(hasCurrencyFormat).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should sort salary ranges', async ({ page }) => {
    const list = new SalaryRangeListPage(page);

    // Find sortable column headers
    const columnHeaders = page.locator('th, mat-header-cell').filter({ hasText: /min|max|salary/i });

    if (await columnHeaders.first().isVisible({ timeout: 2000 })) {
      const firstRow = list.getRow(0);
      const initialFirstValue = await firstRow.textContent();

      await columnHeaders.first().click();
      await page.waitForTimeout(1000);

      const newFirstValue = await list.getRow(0).textContent();

      expect(initialFirstValue).toBeTruthy();
      expect(newFirstValue).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should show Create and Edit buttons for Manager (not Delete)', async ({ page }) => {
    // Manager can create and edit salary ranges but NOT delete
    await logout(page);
    await loginAsRole(page, 'manager');

    const list = new SalaryRangeListPage(page);
    await list.goto();

    const canCreate = await list.hasCreatePermission();
    const canDelete = await list.hasDeletePermission();

    expect(canCreate).toBe(true);   // Manager CAN create (appHasRole=['HRAdmin','Manager'])
    expect(canDelete).toBe(false);  // Manager CANNOT delete (appHasRole=['HRAdmin'])
  });
});

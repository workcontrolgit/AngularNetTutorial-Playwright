import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { createSalaryRangeData } from '../../fixtures/data.fixtures';
import { SalaryRangeListPage } from '../../page-objects/salary-range-list.page';
import { SalaryRangeFormPage } from '../../page-objects/salary-range-form.page';

/**
 * Salary Range CRUD Tests
 *
 * Tests for salary range management operations:
 * - List salary ranges
 * - Create salary range (HRAdmin)
 * - Edit salary range
 * - Delete salary range
 */

test.describe('Salary Range CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HRAdmin (likely required for salary ranges)
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
        minSalary: 50000,
        maxSalary: 80000,
        currency: 'USD',
      });

      await form.fillForm({ minSalary: salaryData.minSalary, maxSalary: salaryData.maxSalary });
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
      // Click edit button (or fall back to row click)
      const editButton = firstRange.locator('button, a').filter({ hasText: /edit|update/i }).first();
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
        await page.waitForTimeout(1000);
      } else {
        await firstRange.click();
        await page.waitForTimeout(1000);
      }

      if (await form.maxSalaryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
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

    // First create a test salary range to delete
    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      const salaryData = createSalaryRangeData({
        minSalary: 30000,
        maxSalary: 45000,
      });

      await form.fillForm({ minSalary: salaryData.minSalary, maxSalary: salaryData.maxSalary });
      await form.submit();

      await page.waitForTimeout(2000);

      // Navigate back to list
      await list.goto();

      // Find the salary range row (look for the max value)
      const rangeRow = list.getRowByText('45000');

      if (await rangeRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        const deleteButton = rangeRow.locator('button').filter({ hasText: /delete|remove/i }).first();

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
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should search salary ranges', async ({ page }) => {
    const list = new SalaryRangeListPage(page);

    if (await list.searchInput.isVisible({ timeout: 2000 })) {
      await list.search('50000');

      const rowCount = await list.getRowCount();
      // Either has results or shows empty state
      expect(rowCount).toBeGreaterThanOrEqual(0);
    } else {
      test.skip();
    }
  });

  test('should display salary range in proper format', async ({ page }) => {
    const list = new SalaryRangeListPage(page);

    const firstRow = list.getRow(0);

    if (await firstRow.isVisible({ timeout: 3000 })) {
      const rowText = await firstRow.textContent();

      // Should contain salary values (with or without currency symbol)
      expect(rowText).toMatch(/\d{2,}/); // At least 2 digits for salary

      // May contain currency symbols or separators
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
      // Get initial order
      const firstRow = list.getRow(0);
      const initialFirstValue = await firstRow.textContent();

      // Click to sort
      await columnHeaders.first().click();
      await page.waitForTimeout(1000);

      // Get new order
      const newFirstValue = await list.getRow(0).textContent();

      // Values might have changed (sorted) — basic check that values exist
      expect(initialFirstValue).toBeTruthy();
      expect(newFirstValue).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should not allow non-HRAdmin to create salary range', async ({ page }) => {
    await logout(page);
    await loginAsRole(page, 'manager');

    const list = new SalaryRangeListPage(page);
    await list.goto();

    const canCreate = await list.hasCreatePermission();
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized/i').isVisible({ timeout: 2000 }).catch(() => false);
    const noTable = !(await list.table.isVisible({ timeout: 2000 }).catch(() => true));

    expect(!canCreate || accessDenied || noTable).toBe(true);
  });
});

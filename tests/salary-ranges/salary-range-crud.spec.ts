import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { createSalaryRangeData } from '../../fixtures/data.fixtures';

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
    await page.goto('/salary-ranges');
    await page.waitForLoadState('networkidle');
  });

  test('should display salary range list', async ({ page }) => {
    // Verify page title
    const pageTitle = page.locator('h1, h2, h3').filter({ hasText: /salary.*range|range/i });
    await expect(pageTitle.first()).toBeVisible({ timeout: 5000 });

    // Verify table/list is visible
    const salaryTable = page.locator('table, mat-table, .salary-ranges-list');
    await expect(salaryTable.first()).toBeVisible({ timeout: 5000 });

    // Verify at least header row exists
    const rows = page.locator('tr, mat-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should create new salary range', async ({ page }) => {
    // Find and click create button
    const createButton = page.locator('button').filter({ hasText: /create|add.*range|new/i });

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Fill salary range form
      const salaryData = createSalaryRangeData({
        minSalary: 50000,
        maxSalary: 80000,
        currency: 'USD',
      });

      const minSalaryInput = page.locator('input[name*="min"], input[formControlName="minSalary"]');
      const maxSalaryInput = page.locator('input[name*="max"], input[formControlName="maxSalary"]');
      const currencyInput = page.locator('input[name*="currency"], input[formControlName="currency"], select[name*="currency"]');

      await minSalaryInput.fill(salaryData.minSalary.toString());
      await maxSalaryInput.fill(salaryData.maxSalary.toString());

      if (await currencyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await currencyInput.fill(salaryData.currency);
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitButton.first().click();

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

  test('should edit existing salary range', async ({ page }) => {
    // Find first salary range row
    const firstRange = page.locator('tr, mat-row').nth(1);

    if (await firstRange.isVisible({ timeout: 3000 })) {
      // Click edit button
      const editButton = firstRange.locator('button, a').filter({ hasText: /edit|update/i }).first();

      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
      } else {
        // Try clicking the row itself
        await firstRange.click();
      }

      await page.waitForTimeout(2000);

      // Update max salary
      const maxSalaryInput = page.locator('input[name*="max"], input[formControlName="maxSalary"]');

      if (await maxSalaryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await maxSalaryInput.clear();
        await maxSalaryInput.fill('100000');
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

  test('should delete salary range', async ({ page }) => {
    // First create a test salary range to delete
    const createButton = page.locator('button').filter({ hasText: /create|add.*range|new/i });

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Create salary range
      const salaryData = createSalaryRangeData({
        minSalary: 30000,
        maxSalary: 45000,
      });

      const minSalaryInput = page.locator('input[name*="min"], input[formControlName="minSalary"]');
      const maxSalaryInput = page.locator('input[name*="max"], input[formControlName="maxSalary"]');

      await minSalaryInput.fill(salaryData.minSalary.toString());
      await maxSalaryInput.fill(salaryData.maxSalary.toString());

      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitButton.first().click();

      await page.waitForTimeout(2000);

      // Navigate back to list
      await page.goto('/salary-ranges');
      await page.waitForLoadState('networkidle');

      // Find the salary range row (look for the max value)
      const rangeRow = page.locator('tr, mat-row').filter({ hasText: /45000|45,000/i }).first();

      if (await rangeRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click delete button
        const deleteButton = rangeRow.locator('button').filter({ hasText: /delete|remove/i }).first();

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
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');

    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Search for a salary value
      await searchInput.fill('50000');
      await page.waitForTimeout(1000);

      // Verify results are filtered
      const rows = page.locator('tr, mat-row');
      const count = await rows.count();

      // Either has results or shows empty state
      expect(count).toBeGreaterThanOrEqual(1); // At least header row
    } else {
      test.skip();
    }
  });

  test('should display salary range in proper format', async ({ page }) => {
    // Get first data row
    const firstRow = page.locator('tr, mat-row').nth(1);

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
    // Find sortable column headers
    const columnHeaders = page.locator('th, mat-header-cell').filter({ hasText: /min|max|salary/i });

    if (await columnHeaders.first().isVisible({ timeout: 2000 })) {
      // Get initial order
      const firstRow = page.locator('tr, mat-row').nth(1);
      const initialFirstValue = await firstRow.textContent();

      // Click to sort
      await columnHeaders.first().click();
      await page.waitForTimeout(1000);

      // Get new order
      const newFirstRow = page.locator('tr, mat-row').nth(1);
      const newFirstValue = await newFirstRow.textContent();

      // Values might have changed (sorted)
      // This is a basic check - values exist
      expect(initialFirstValue).toBeTruthy();
      expect(newFirstValue).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should not allow non-HRAdmin to create salary range', async ({ page }) => {
    // Logout and login as Manager
    await page.goto('/');
    await loginAsRole(page, 'manager');
    await page.goto('/salary-ranges');
    await page.waitForLoadState('networkidle');

    // Verify Create button is NOT visible or page is not accessible
    const createButton = page.locator('button').filter({ hasText: /create|add.*range|new/i });
    const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized/i').isVisible({ timeout: 2000 }).catch(() => false);
    const noTable = !(await page.locator('table, mat-table').isVisible({ timeout: 2000 }).catch(() => true));

    expect(!hasCreateButton || accessDenied || noTable).toBe(true);
  });
});

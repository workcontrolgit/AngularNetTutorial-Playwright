import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

/**
 * Employee List Tests
 *
 * Tests for employee list functionality:
 * - Pagination
 * - Page size changes
 * - Search functionality
 * - Autocomplete
 * - Empty states
 */

test.describe('Employee List', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Manager
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
  });

  test('should display employee list with pagination controls', async ({ page }) => {
    // Verify table/list is visible
    const employeeTable = page.locator('table, mat-table, .employee-list');
    await expect(employeeTable.first()).toBeVisible();

    // Verify pagination controls exist at the bottom
    const paginator = page.locator('mat-paginator, .pagination, nav[aria-label*="pagination"]');
    await expect(paginator.first()).toBeVisible();
  });

  test('should change page size', async ({ page }) => {
    // Find page size selector
    const pageSizeSelector = page.locator('mat-select[aria-label*="Items per page"], select[name*="pageSize"]');

    if (await pageSizeSelector.isVisible({ timeout: 2000 })) {
      // Get initial row count
      const initialRows = await page.locator('tr, mat-row').count();

      // Change page size
      await pageSizeSelector.click();
      await page.locator('mat-option, option').filter({ hasText: /25|50/i }).first().click();

      // Wait for table to update
      await page.waitForTimeout(1000);

      // Verify row count changed (or stayed same if less than new page size)
      const newRows = await page.locator('tr, mat-row').count();
      expect(newRows).toBeGreaterThanOrEqual(initialRows);
    } else {
      test.skip();
    }
  });

  test('should search employees by employee number', async ({ page }) => {
    // Find Employee Number typeahead filter (first input in filter row)
    const employeeNumberInput = page.locator('input').first();
    await expect(employeeNumberInput).toBeVisible();

    // Get first employee number from the list
    const firstRow = page.locator('tbody tr, mat-row').nth(1);
    const employeeNumber = await firstRow.locator('td, mat-cell').first().textContent();

    if (employeeNumber && employeeNumber.trim()) {
      // Type in the employee number filter (typeahead)
      await employeeNumberInput.fill(employeeNumber.trim());
      await page.waitForTimeout(1500); // Wait for typeahead/filter to apply

      // Verify filtered results contain the search term
      const visibleRows = page.locator('tbody tr, mat-row').filter({ hasText: employeeNumber.trim() });
      expect(await visibleRows.count()).toBeGreaterThan(0);
    }
  });

  test('should search employees by first name', async ({ page }) => {
    // Find First Name typeahead filter (second input in filter row)
    const firstNameInput = page.locator('input').nth(1);
    await expect(firstNameInput).toBeVisible();

    // Get a first name from the list
    const firstRow = page.locator('tbody tr, mat-row').nth(1);
    const fullName = await firstRow.locator('td, mat-cell').nth(1).textContent();

    if (fullName && fullName.trim()) {
      // Extract first word (typically title + first name, so take second word)
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[1] || nameParts[0];

      // Type in the first name filter (typeahead)
      await firstNameInput.fill(firstName);
      await page.waitForTimeout(1500);

      // Verify filtered results contain the first name
      const visibleRows = page.locator('tbody tr, mat-row').filter({ hasText: new RegExp(firstName, 'i') });
      expect(await visibleRows.count()).toBeGreaterThan(0);
    }
  });

  test('should search employees by email', async ({ page }) => {
    // Find Email typeahead filter (4th input in filter row)
    const emailInput = page.locator('input').nth(3);
    await expect(emailInput).toBeVisible();

    // Get an email from the list
    const firstRow = page.locator('tbody tr, mat-row').nth(1);
    const email = await firstRow.locator('td, mat-cell').nth(2).textContent();

    if (email && email.trim()) {
      // Type partial email in the filter (typeahead)
      const partialEmail = email.trim().split('@')[0];
      await emailInput.fill(partialEmail);
      await page.waitForTimeout(1500);

      // Verify filtered results contain the email
      const visibleRows = page.locator('tbody tr, mat-row').filter({ hasText: new RegExp(partialEmail, 'i') });
      expect(await visibleRows.count()).toBeGreaterThan(0);
    }
  });

  test('should filter by position title', async ({ page }) => {
    // Find Position Title typeahead filter (5th input in filter row)
    const positionInput = page.locator('input').nth(4);
    await expect(positionInput).toBeVisible();

    // Get a position from the list
    const firstRow = page.locator('tbody tr, mat-row').nth(1);
    const position = await firstRow.locator('td, mat-cell').nth(4).textContent();

    if (position && position.trim()) {
      // Type partial position in the filter
      const partialPosition = position.trim().split(' ')[0];
      await positionInput.fill(partialPosition);
      await page.waitForTimeout(1500);

      // Verify filtered results contain the position
      const visibleRows = page.locator('tbody tr, mat-row').filter({ hasText: new RegExp(partialPosition, 'i') });
      expect(await visibleRows.count()).toBeGreaterThan(0);
    }
  });

  test('should clear filters', async ({ page }) => {
    // Find First Name filter (second input) and enter a search term
    const firstNameInput = page.locator('input').nth(1);
    await expect(firstNameInput).toBeVisible();

    // Perform search
    await firstNameInput.fill('test');
    await page.waitForTimeout(1000);

    // Click Clear Filters button
    const clearButton = page.locator('button').filter({ hasText: /clear.*filters/i });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    await page.waitForTimeout(1000);

    // Verify filter is cleared
    expect(await firstNameInput.inputValue()).toBe('');

    // Verify full list is shown again
    const rows = page.locator('tbody tr, mat-row');
    expect(await rows.count()).toBeGreaterThan(1);
  });

  test('should display empty state when no results found', async ({ page }) => {
    // Find First Name filter (second input)
    const firstNameInput = page.locator('input').nth(1);
    await expect(firstNameInput).toBeVisible();

    // Search for something that definitely won't exist
    await firstNameInput.fill('zzzzzzzzzzzzzzzzzzz');
    await page.waitForTimeout(1500);

    // Verify empty state is shown (no data rows or empty message)
    const dataRows = page.locator('tbody tr, mat-row');
    const rowCount = await dataRows.count();

    // Either shows 0 rows or shows an empty state message
    if (rowCount === 0) {
      expect(rowCount).toBe(0);
    } else {
      const emptyState = page.locator('text=/no.*results|no.*employees|no.*records|empty/i');
      await expect(emptyState.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should navigate to next page', async ({ page }) => {
    // Find next page button
    const nextButton = page.locator('button[aria-label*="Next"], .next-page, button').filter({ hasText: /next|>/i });

    if (await nextButton.isVisible({ timeout: 2000 })) {
      // Check if button is enabled
      const isEnabled = await nextButton.isEnabled();

      if (isEnabled) {
        // Get current page info
        const paginationInfo = await page.locator('text=/\\d+-\\d+ of \\d+/i').first().textContent();

        // Click next
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Verify page changed
        const newPaginationInfo = await page.locator('text=/\\d+-\\d+ of \\d+/i').first().textContent();
        expect(newPaginationInfo).not.toBe(paginationInfo);
      } else {
        // Only one page of data
        test.skip();
      }
    } else {
      // Pagination not available
      test.skip();
    }
  });

  test('should navigate to previous page', async ({ page }) => {
    // First go to page 2
    const nextButton = page.locator('button[aria-label*="Next"], .next-page');

    if (await nextButton.isVisible({ timeout: 2000 }) && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Now try to go back
      const prevButton = page.locator('button[aria-label*="Previous"], .previous-page, button').filter({ hasText: /previous|</i });

      if (await prevButton.isVisible()) {
        // Get current page info
        const paginationInfo = await page.locator('text=/\\d+-\\d+ of \\d+/i').first().textContent();

        // Click previous
        await prevButton.click();
        await page.waitForTimeout(1000);

        // Verify page changed
        const newPaginationInfo = await page.locator('text=/\\d+-\\d+ of \\d+/i').first().textContent();
        expect(newPaginationInfo).not.toBe(paginationInfo);
      }
    } else {
      test.skip();
    }
  });
});

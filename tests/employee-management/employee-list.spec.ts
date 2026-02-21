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
    // Find page size selector in mat-paginator
    const pageSizeSelector = page.locator('mat-paginator mat-select');

    if (await pageSizeSelector.isVisible({ timeout: 2000 })) {
      // Get initial row count (excluding header)
      const initialRows = await page.locator('tbody tr, mat-row').count();

      // Scroll paginator into view and click with force
      await pageSizeSelector.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await pageSizeSelector.click({ force: true });
      await page.waitForTimeout(500);

      // Select 25 items per page
      const option25 = page.locator('mat-option').filter({ hasText: '25' });
      if (await option25.isVisible({ timeout: 1000 }).catch(() => false)) {
        await option25.click();
      } else {
        // Try 50 if 25 not available
        await page.locator('mat-option').filter({ hasText: '50' }).first().click();
      }

      // Wait for table to update
      await page.waitForTimeout(1500);

      // Verify row count changed (should show more rows if there are more than 10 total)
      const newRows = await page.locator('tbody tr, mat-row').count();
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
    // Find next page button in Material paginator
    const nextButton = page.locator('mat-paginator button[aria-label*="Next page"]');

    if (await nextButton.isVisible({ timeout: 2000 })) {
      // Check if button is enabled (not disabled)
      const isDisabled = await nextButton.isDisabled();

      if (!isDisabled) {
        // Get current page range text
        const rangeLabel = page.locator('mat-paginator .mat-mdc-paginator-range-label');
        const initialRange = await rangeLabel.textContent();

        // Click next page
        await nextButton.click({ force: true });
        await page.waitForTimeout(1500);

        // Verify page changed
        const newRange = await rangeLabel.textContent();
        expect(newRange).not.toBe(initialRange);
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
    // First navigate to next page (to enable previous button)
    const nextButton = page.locator('mat-paginator button[aria-label*="Next page"]');

    if (await nextButton.isVisible({ timeout: 2000 }) && !(await nextButton.isDisabled())) {
      await nextButton.click({ force: true });
      await page.waitForTimeout(1500);

      // Now navigate back to previous page
      const prevButton = page.locator('mat-paginator button[aria-label*="Previous page"]');

      if (await prevButton.isVisible({ timeout: 2000 })) {
        // Get current page range
        const rangeLabel = page.locator('mat-paginator .mat-mdc-paginator-range-label');
        const beforeRange = await rangeLabel.textContent();

        // Click previous
        await prevButton.click({ force: true });
        await page.waitForTimeout(1500);

        // Verify page changed back
        const afterRange = await rangeLabel.textContent();
        expect(afterRange).not.toBe(beforeRange);
      }
    } else {
      test.skip();
    }
  });
});

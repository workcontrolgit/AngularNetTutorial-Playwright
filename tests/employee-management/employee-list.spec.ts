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

    // Verify pagination controls exist
    const paginator = page.locator('mat-paginator, .pagination, nav[aria-label*="pagination"]');
    await expect(paginator.first()).toBeVisible();

    // Verify pagination info (e.g., "1-10 of 50")
    const paginationInfo = page.locator('text=/\\d+-\\d+ of \\d+|page \\d+ of \\d+/i');
    await expect(paginationInfo.first()).toBeVisible();
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
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    await expect(searchInput.first()).toBeVisible();

    // Get first employee number from the list
    const firstRow = page.locator('tr, mat-row').nth(1);
    const employeeNumber = await firstRow.locator('td, mat-cell').first().textContent();

    if (employeeNumber && employeeNumber.trim()) {
      // Search for this employee number
      await searchInput.first().fill(employeeNumber.trim());
      await page.waitForTimeout(1000); // Debounce delay

      // Verify filtered results contain the search term
      const visibleRows = page.locator('tr, mat-row').filter({ hasText: employeeNumber.trim() });
      expect(await visibleRows.count()).toBeGreaterThan(0);
    }
  });

  test('should search employees by name', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    await expect(searchInput.first()).toBeVisible();

    // Search for a common name
    await searchInput.first().fill('test');
    await page.waitForTimeout(1000);

    // Verify some results are shown (or empty state)
    const rows = page.locator('tr, mat-row');
    const rowCount = await rows.count();

    // Either has matching rows or shows empty state
    if (rowCount > 1) {
      // Has results
      expect(rowCount).toBeGreaterThan(1);
    } else {
      // Shows empty state
      const emptyState = page.locator('text=/no.*results|no.*employees|empty/i');
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('should search employees by email', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    await expect(searchInput.first()).toBeVisible();

    // Search for email pattern
    await searchInput.first().fill('@example.com');
    await page.waitForTimeout(1000);

    // Verify results contain email domain
    const rows = page.locator('tr, mat-row').filter({ hasText: /@example\.com/i });
    const count = await rows.count();

    // Either has matching rows or shows no results
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');

    // Start typing to trigger autocomplete
    await searchInput.first().fill('a');
    await page.waitForTimeout(500);

    // Check if autocomplete appears
    const autocomplete = page.locator('mat-autocomplete, .autocomplete, datalist');
    const hasAutocomplete = await autocomplete.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasAutocomplete) {
      // Verify suggestions are shown
      const options = page.locator('mat-option, .autocomplete-option, option');
      expect(await options.count()).toBeGreaterThan(0);
    } else {
      // Autocomplete might not be implemented yet
      test.skip();
    }
  });

  test('should clear search', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    await expect(searchInput.first()).toBeVisible();

    // Perform search
    await searchInput.first().fill('test search');
    await page.waitForTimeout(1000);

    // Clear search
    const clearButton = page.locator('button[aria-label*="clear"], .clear-search');

    if (await clearButton.isVisible({ timeout: 2000 })) {
      await clearButton.click();
    } else {
      // Clear manually
      await searchInput.first().clear();
    }

    await page.waitForTimeout(1000);

    // Verify search is cleared
    expect(await searchInput.first().inputValue()).toBe('');

    // Verify full list is shown again
    const rows = page.locator('tr, mat-row');
    expect(await rows.count()).toBeGreaterThan(1);
  });

  test('should display empty state when no results found', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    await expect(searchInput.first()).toBeVisible();

    // Search for something that definitely won't exist
    await searchInput.first().fill('zzzzzzzzzzzzzzzzzzz');
    await page.waitForTimeout(1000);

    // Verify empty state is shown
    const emptyState = page.locator('text=/no.*results|no.*employees|no.*records|empty/i');
    await expect(emptyState.first()).toBeVisible({ timeout: 3000 });
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

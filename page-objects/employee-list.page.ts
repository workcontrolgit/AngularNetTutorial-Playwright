import { Page, Locator } from '@playwright/test';

/**
 * Employee List Page Object Model
 *
 * Encapsulates interactions with the employee list page:
 * - Navigation
 * - Search functionality
 * - Pagination
 * - Employee selection
 * - Action buttons
 */
export class EmployeeListPage {
  readonly page: Page;

  // Locators for page elements
  readonly pageTitle: Locator;
  readonly employeeTable: Locator;
  readonly employeeRows: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly createButton: Locator;
  readonly paginator: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;
  readonly pageSizeSelector: Locator;
  readonly paginationInfo: Locator;
  readonly emptyState: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.pageTitle = page.locator('h1, h2, h3').filter({ hasText: /employees/i });
    this.employeeTable = page.locator('table, mat-table, .employee-list').first();
    this.employeeRows = page.locator('tr, mat-row');
    this.searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]').first();
    this.clearSearchButton = page.locator('button[aria-label*="clear"], .clear-search');
    this.createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i }).first();
    this.paginator = page.locator('mat-paginator, .pagination, nav[aria-label*="pagination"]').first();
    this.nextPageButton = page.locator('button[aria-label*="Next"], .next-page, button').filter({ hasText: /next|>/i });
    this.previousPageButton = page.locator('button[aria-label*="Previous"], .previous-page, button').filter({ hasText: /previous|</i });
    this.pageSizeSelector = page.locator('mat-select[aria-label*="Items per page"], select[name*="pageSize"]');
    this.paginationInfo = page.locator('text=/\\d+-\\d+ of \\d+|page \\d+ of \\d+/i').first();
    this.emptyState = page.locator('text=/no.*results|no.*employees|no.*records|empty/i').first();
    this.loadingIndicator = page.locator('mat-spinner, .spinner, .loading');
  }

  /**
   * Navigate to the employee list page
   */
  async goto() {
    await this.page.goto('/employees');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the page to finish loading
   */
  async waitForLoad() {
    await this.employeeTable.waitFor({ state: 'visible', timeout: 5000 });
    // Wait for loading indicator to disappear
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /**
   * Click the create employee button
   */
  async clickCreate() {
    await this.createButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Search for employees by text
   * @param searchText - Text to search for
   */
  async search(searchText: string) {
    await this.searchInput.fill(searchText);
    await this.page.waitForTimeout(1000); // Debounce delay
  }

  /**
   * Clear the search input
   */
  async clearSearch() {
    const hasClearButton = await this.clearSearchButton.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasClearButton) {
      await this.clearSearchButton.click();
    } else {
      await this.searchInput.clear();
    }

    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the number of visible employee rows (excluding header)
   * @returns Number of employee rows
   */
  async getEmployeeCount(): Promise<number> {
    const count = await this.employeeRows.count();
    // Subtract 1 for header row if present
    return count > 1 ? count - 1 : count;
  }

  /**
   * Get employee row by index
   * @param index - Zero-based index (0 is first data row, excluding header)
   */
  getEmployeeRow(index: number): Locator {
    return this.employeeRows.nth(index + 1); // +1 to skip header row
  }

  /**
   * Get employee row by name
   * @param name - Employee name to search for
   */
  getEmployeeByName(name: string): Locator {
    return this.employeeRows.filter({ hasText: name }).first();
  }

  /**
   * Click on an employee row to view details
   * @param index - Zero-based index of employee row
   */
  async clickEmployee(index: number) {
    const row = this.getEmployeeRow(index);
    await row.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click on an employee by name
   * @param name - Employee name
   */
  async clickEmployeeByName(name: string) {
    const row = this.getEmployeeByName(name);
    await row.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click edit button for a specific employee
   * @param index - Zero-based index of employee row
   */
  async clickEdit(index: number) {
    const row = this.getEmployeeRow(index);
    const editButton = row.locator('button, a').filter({ hasText: /edit|update/i }).first();
    await editButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click delete button for a specific employee
   * @param index - Zero-based index of employee row
   */
  async clickDelete(index: number) {
    const row = this.getEmployeeRow(index);
    const deleteButton = row.locator('button').filter({ hasText: /delete|remove/i }).first();
    await deleteButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.nextPageButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.previousPageButton.first().click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Change page size
   * @param size - New page size (e.g., 10, 25, 50)
   */
  async changePageSize(size: number) {
    await this.pageSizeSelector.click();
    await this.page.waitForTimeout(500);

    const option = this.page.locator('mat-option, option').filter({ hasText: new RegExp(size.toString()) });
    await option.first().click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get pagination information text
   * @returns Pagination info (e.g., "1-10 of 50")
   */
  async getPaginationInfo(): Promise<string> {
    return await this.paginationInfo.textContent() || '';
  }

  /**
   * Check if create button is visible (permission check)
   * @returns True if create button is visible
   */
  async hasCreatePermission(): Promise<boolean> {
    return await this.createButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if edit buttons are visible (permission check)
   * @returns True if edit buttons are visible
   */
  async hasEditPermission(): Promise<boolean> {
    const editButton = this.employeeRows.first().locator('button').filter({ hasText: /edit/i });
    return await editButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if delete buttons are visible (permission check)
   * @returns True if delete buttons are visible
   */
  async hasDeletePermission(): Promise<boolean> {
    const deleteButton = this.employeeRows.first().locator('button').filter({ hasText: /delete/i });
    return await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if empty state is displayed
   * @returns True if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get text content from a specific employee row cell
   * @param rowIndex - Zero-based row index
   * @param cellIndex - Zero-based cell index
   * @returns Cell text content
   */
  async getCellText(rowIndex: number, cellIndex: number): Promise<string> {
    const row = this.getEmployeeRow(rowIndex);
    const cell = row.locator('td, mat-cell').nth(cellIndex);
    return await cell.textContent() || '';
  }

  /**
   * Get all employee data from a specific row
   * @param rowIndex - Zero-based row index
   * @returns Array of cell text contents
   */
  async getEmployeeData(rowIndex: number): Promise<string[]> {
    const row = this.getEmployeeRow(rowIndex);
    const cells = row.locator('td, mat-cell');
    const count = await cells.count();

    const data: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await cells.nth(i).textContent();
      data.push(text || '');
    }

    return data;
  }
}

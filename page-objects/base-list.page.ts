import { Page, Locator } from '@playwright/test';

/**
 * Base List Page Object
 *
 * Contains shared logic for ALL list/table pages in this application:
 * - Navigation
 * - Table row access
 * - Search / clear search
 * - Pagination (next, previous, page size)
 * - CRUD action buttons (Create, Edit, Delete)
 * - Permission checks (visibility of action buttons)
 *
 * Extend this class for each entity's list page:
 *   class DepartmentListPage extends BaseListPage { ... }
 *   class PositionListPage   extends BaseListPage { ... }
 *
 * Minimal subclass example (just set URL + entity name):
 *   export class DepartmentListPage extends BaseListPage {
 *     constructor(page: Page) { super(page, '/departments', 'departments'); }
 *   }
 */
export class BaseListPage {
  protected readonly page: Page;
  protected readonly url: string;
  protected readonly entityName: string;

  // ── Table locators ──────────────────────────────────────────────────────
  readonly pageTitle: Locator;
  readonly table: Locator;
  readonly rows: Locator;

  // ── Search locators ─────────────────────────────────────────────────────
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;

  // ── Action locators ─────────────────────────────────────────────────────
  readonly createButton: Locator;

  // ── Pagination locators ─────────────────────────────────────────────────
  readonly paginator: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;
  readonly pageSizeSelector: Locator;

  // ── State locators ──────────────────────────────────────────────────────
  readonly loadingIndicator: Locator;

  constructor(page: Page, url: string, entityName: string) {
    this.page = page;
    this.url = url;
    this.entityName = entityName;

    this.pageTitle = page.locator('h1, h2, h3').filter({ hasText: new RegExp(entityName, 'i') });
    this.table = page.locator('table, mat-table').first();
    this.rows = page.locator('tr, mat-row');

    this.searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]').first();
    this.clearSearchButton = page.locator('button[aria-label*="clear"], .clear-search');

    this.createButton = page.locator('button').filter({ hasText: /create|add|new/i }).first();

    this.paginator = page.locator('mat-paginator, .pagination').first();
    this.nextPageButton = page.locator('button[aria-label*="Next"]').first();
    this.previousPageButton = page.locator('button[aria-label*="Previous"]').first();
    this.pageSizeSelector = page.locator('mat-select[aria-label*="Items per page"]');

    this.loadingIndicator = page.locator('mat-spinner, .spinner, .loading');
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad() {
    await this.table.waitFor({ state: 'visible', timeout: 5000 });
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  // ── Row access ──────────────────────────────────────────────────────────

  /**
   * Get a data row by zero-based index (automatically skips the header row).
   */
  getRow(index: number): Locator {
    return this.rows.nth(index + 1); // +1 to skip <thead> / header mat-row
  }

  /**
   * Get the first row whose text matches the given string.
   */
  getRowByText(text: string): Locator {
    return this.rows.filter({ hasText: text }).first();
  }

  async getRowCount(): Promise<number> {
    const count = await this.rows.count();
    return count > 1 ? count - 1 : count; // subtract header row
  }

  async getCellText(rowIndex: number, cellIndex: number): Promise<string> {
    const cell = this.getRow(rowIndex).locator('td, mat-cell').nth(cellIndex);
    return await cell.textContent() || '';
  }

  async getRowData(rowIndex: number): Promise<string[]> {
    const cells = this.getRow(rowIndex).locator('td, mat-cell');
    const count = await cells.count();
    const data: string[] = [];
    for (let i = 0; i < count; i++) {
      data.push(await cells.nth(i).textContent() || '');
    }
    return data;
  }

  // ── CRUD actions ────────────────────────────────────────────────────────

  async clickCreate() {
    await this.createButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickRow(index: number) {
    await this.getRow(index).click();
    await this.page.waitForTimeout(1000);
  }

  async clickEdit(index: number) {
    const editButton = this.getRow(index).locator('button, a').filter({ hasText: /edit|update/i }).first();
    await editButton.click();
    await this.page.waitForTimeout(1000);
  }

  async clickDelete(index: number) {
    const deleteButton = this.getRow(index).locator('button').filter({ hasText: /delete|remove/i }).first();
    await deleteButton.click();
    await this.page.waitForTimeout(1000);
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async search(searchText: string) {
    const isVisible = await this.searchInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isVisible) return; // No search input on this page — skip silently
    await this.searchInput.fill(searchText);
    await this.page.waitForTimeout(1000); // debounce delay
  }

  async clearSearch() {
    const hasClearButton = await this.clearSearchButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (hasClearButton) {
      await this.clearSearchButton.click();
    } else {
      await this.searchInput.clear();
    }
    await this.page.waitForTimeout(1000);
  }

  // ── Pagination ──────────────────────────────────────────────────────────

  async goToNextPage() {
    await this.nextPageButton.click();
    await this.page.waitForTimeout(1000);
  }

  async goToPreviousPage() {
    await this.previousPageButton.click();
    await this.page.waitForTimeout(1000);
  }

  async changePageSize(size: number) {
    await this.pageSizeSelector.click();
    await this.page.waitForTimeout(500);
    await this.page.locator('mat-option, option')
      .filter({ hasText: new RegExp(`^${size}$`) })
      .first()
      .click();
    await this.page.waitForTimeout(1000);
  }

  async getPaginationInfo(): Promise<string> {
    const info = this.page.locator('text=/\\d+-\\d+ of \\d+|page \\d+ of \\d+/i').first();
    return await info.textContent() || '';
  }

  // ── Permission checks ───────────────────────────────────────────────────

  async hasCreatePermission(): Promise<boolean> {
    return await this.createButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async hasEditPermission(): Promise<boolean> {
    const editButton = this.rows.nth(1).locator('button').filter({ hasText: /edit/i });
    return await editButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async hasDeletePermission(): Promise<boolean> {
    const deleteButton = this.rows.nth(1).locator('button').filter({ hasText: /delete/i });
    return await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  // ── State ───────────────────────────────────────────────────────────────

  async isEmptyStateVisible(): Promise<boolean> {
    const emptyState = this.page.locator('text=/no.*results|no.*records|empty/i').first();
    return await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  }
}

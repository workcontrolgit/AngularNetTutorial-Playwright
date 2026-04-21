import { Page, Locator } from '@playwright/test';

/**
 * AI NL Search Page Object
 *
 * Encapsulates locators and interactions for the NL Search page at /ai/nl-search.
 * Handles both enabled state (search UI with results table) and disabled state (info banner).
 */
export class AiNlSearchPage {
  readonly page: Page;
  readonly url = '/ai/nl-search';

  // ── Disabled state ────────────────────────────────────────────────────────
  readonly disabledBanner: Locator;

  // ── Enabled state — search UI ─────────────────────────────────────────────
  readonly searchInput: Locator;
  readonly clearButton: Locator;
  readonly parsedExpression: Locator;
  readonly resultsTable: Locator;
  readonly resultRows: Locator;
  readonly resultCount: Locator;
  readonly loadingRow: Locator;
  readonly errorRow: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    this.disabledBanner = page.locator('.ai-disabled-banner, .disabled-card').first();

    this.searchInput = page.locator('input[placeholder*="employee"], input[placeholder*="natural"]').first();
    this.clearButton = page.locator('button').filter({ hasText: /clear/i }).first();
    this.parsedExpression = page.locator('.parsed-expression');
    this.resultsTable = page.locator('table.results-table, mat-table').first();
    this.resultRows = page.locator('table.results-table tr:not(thead tr), mat-row');
    this.resultCount = page.locator('.result-count');
    this.loadingRow = page.locator('.loading-row');
    this.errorRow = page.locator('.error-row');
    this.emptyState = page.locator('.empty-state');
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async isDisabled(): Promise<boolean> {
    return await this.disabledBanner.isVisible({ timeout: 3000 }).catch(() => false);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounce (600ms) + network
    await this.page.waitForTimeout(1500);
  }

  async clear() {
    await this.clearButton.click();
    await this.page.waitForTimeout(500);
  }

  async getResultCount(): Promise<number> {
    return await this.resultRows.count();
  }

  async hasParsedExpression(): Promise<boolean> {
    return await this.parsedExpression.isVisible({ timeout: 2000 }).catch(() => false);
  }
}

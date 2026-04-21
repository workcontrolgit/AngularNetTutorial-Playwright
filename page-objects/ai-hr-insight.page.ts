import { Page, Locator } from '@playwright/test';

/**
 * AI HR Insight Page Object
 *
 * Encapsulates locators and interactions for the HR Insight page at /ai/hr-insight.
 * Handles both enabled state (chat UI with suggestion chips) and disabled state (info banner).
 */
export class AiHrInsightPage {
  readonly page: Page;
  readonly url = '/ai/hr-insight';

  // ── Disabled state ────────────────────────────────────────────────────────
  readonly disabledBanner: Locator;

  // ── Enabled state — HR chat UI ────────────────────────────────────────────
  readonly chatCard: Locator;
  readonly questionInput: Locator;
  readonly askButton: Locator;
  readonly clearButton: Locator;
  readonly suggestionButtons: Locator;
  readonly messages: Locator;
  readonly loadingRow: Locator;
  readonly errorRow: Locator;

  constructor(page: Page) {
    this.page = page;

    this.disabledBanner = page.locator('.ai-disabled-banner, .disabled-card').first();

    this.chatCard = page.locator('mat-card').first();
    this.questionInput = page.locator('input[placeholder*="workforce"], input[placeholder*="question"]').first();
    this.askButton = page.locator('button').filter({ hasText: /^ask$/i }).first();
    this.clearButton = page.locator('button[mat-icon-button]').filter({ hasText: /delete_sweep/i }).first();
    this.suggestionButtons = page.locator('.suggestion-list button, .suggestions button');
    this.messages = page.locator('.message');
    this.loadingRow = page.locator('.loading-row');
    this.errorRow = page.locator('.error-row');
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async isDisabled(): Promise<boolean> {
    return await this.disabledBanner.isVisible({ timeout: 3000 }).catch(() => false);
  }

  async getSuggestionCount(): Promise<number> {
    return await this.suggestionButtons.count();
  }

  async clickSuggestion(index: number) {
    await this.suggestionButtons.nth(index).click();
    await this.page.waitForTimeout(500);
  }

  async sendQuestion(question: string) {
    await this.questionInput.fill(question);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }
}

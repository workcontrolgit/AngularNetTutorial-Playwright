import { Page, Locator } from '@playwright/test';

/**
 * AI Assistant Page Object
 *
 * Encapsulates locators and interactions for the AI Assistant page at /ai/assistant.
 * Handles both enabled state (chat UI) and disabled state (info banner).
 */
export class AiAssistantPage {
  readonly page: Page;
  readonly url = '/ai/assistant';

  // ── Disabled state ────────────────────────────────────────────────────────
  readonly disabledBanner: Locator;

  // ── Enabled state — chat UI ───────────────────────────────────────────────
  readonly chatCard: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly clearButton: Locator;
  readonly messages: Locator;
  readonly loadingRow: Locator;
  readonly errorRow: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    this.disabledBanner = page.locator('.ai-disabled-banner, .disabled-card').first();

    this.chatCard = page.locator('mat-card').first();
    this.messageInput = page.locator('input[placeholder*="AI assistant"], input[placeholder*="anything"]').first();
    this.sendButton = page.locator('button').filter({ hasText: /^send$/i }).first();
    this.clearButton = page.locator('button[mat-icon-button]').filter({ hasText: /delete_sweep/i }).first();
    this.messages = page.locator('.message');
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

  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async getMessageCount(): Promise<number> {
    return await this.messages.count();
  }
}

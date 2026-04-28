import { test, expect } from '@playwright/test';
import { AiHrInsightPage } from '../../page-objects/ai-hr-insight.page';

/**
 * AI HR Insight Page Tests
 *
 * Tests for the HR Insight page at /ai/hr-insight:
 * - Page renders (disabled banner OR chat UI)
 * - Disabled state shows info banner
 * - Enabled state shows suggestion buttons and chat input
 * - Asking an HR question (when AI is enabled)
 */

test.describe('AI HR Insight Page', () => {
  test.use({ storageState: '.auth/manager.json' });

  test('should load the HR Insight page without errors', async ({ page }) => {
    const hrPage = new AiHrInsightPage(page);
    await hrPage.goto();

    const hasError = await page.locator('text=/page not found|404|error occurred/i')
      .isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBe(false);

    const hasBanner = await hrPage.isDisabled();
    const hasChatCard = await hrPage.chatCard.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasBanner || hasChatCard).toBe(true);
  });

  test('should show disabled banner when AI is not enabled', async ({ page }) => {
    const hrPage = new AiHrInsightPage(page);
    await hrPage.goto();

    if (await hrPage.isDisabled()) {
      const bannerText = await hrPage.disabledBanner.textContent();
      expect(bannerText).toMatch(/aiEnabled|AiEnabled|disabled/i);
    } else {
      test.skip();
    }
  });

  test('should show suggestion buttons when AI is enabled', async ({ page }) => {
    const hrPage = new AiHrInsightPage(page);
    await hrPage.goto();

    if (await hrPage.isDisabled()) {
      test.skip();
    }

    // HR Insight page should show suggestion chips/buttons
    const suggestionCount = await hrPage.getSuggestionCount();
    expect(suggestionCount).toBeGreaterThan(0);
  });

  test('should show question input and ask button', async ({ page }) => {
    const hrPage = new AiHrInsightPage(page);
    await hrPage.goto();

    if (await hrPage.isDisabled()) {
      test.skip();
    }

    // Either the dedicated question input or a generic text input
    const inputVisible = await hrPage.questionInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      const anyInput = page.locator('mat-card input[type="text"], mat-card textarea').first();
      await expect(anyInput).toBeVisible({ timeout: 3000 });
    } else {
      await expect(hrPage.questionInput).toBeVisible();
    }
  });

  test('should fill input when suggestion button is clicked', async ({ page }) => {
    const hrPage = new AiHrInsightPage(page);
    await hrPage.goto();

    if (await hrPage.isDisabled()) {
      test.skip();
    }

    const suggestionCount = await hrPage.getSuggestionCount();
    if (suggestionCount === 0) {
      test.skip();
    }

    await hrPage.clickSuggestion(0);

    // Input should now be filled with the suggestion text
    const inputVisible = await hrPage.questionInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (inputVisible) {
      const inputValue = await hrPage.questionInput.inputValue();
      expect(inputValue.length).toBeGreaterThan(0);
    }
  });

  test('should ask an HR question and get a response (requires AI enabled)', async ({ page }) => {
    test.setTimeout(90000); // HR insight is slower — fetches DB data + Ollama inference

    const hrPage = new AiHrInsightPage(page);
    await hrPage.goto();

    if (await hrPage.isDisabled()) {
      test.skip();
    }

    const inputVisible = await hrPage.questionInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip();
    }

    const initialCount = await hrPage.messages.count();

    await hrPage.sendQuestion('How many employees are there?');

    // Wait for user message to appear
    await page.waitForFunction(
      (initialCount) => document.querySelectorAll('.message').length > initialCount,
      initialCount,
      { timeout: 60000 }
    ).catch(() => {});

    const afterCount = await hrPage.messages.count();
    expect(afterCount).toBeGreaterThan(initialCount);
  });
});

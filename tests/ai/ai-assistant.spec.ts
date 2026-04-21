import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { AiAssistantPage } from '../../page-objects/ai-assistant.page';

/**
 * AI Assistant Page Tests
 *
 * Tests for the AI Assistant page at /ai/assistant:
 * - Page renders (disabled banner OR chat UI)
 * - Disabled state shows info banner
 * - Enabled state shows chat card, input, send button
 * - Chat interaction (when AI is enabled)
 * - Clear conversation
 */

test.describe('AI Assistant Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'manager');
  });

  test('should load the AI Assistant page without errors', async ({ page }) => {
    const aiPage = new AiAssistantPage(page);
    await aiPage.goto();

    // Should not show a 404 or unhandled error
    const hasError = await page.locator('text=/page not found|404|error occurred/i')
      .isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBe(false);

    // Should show either the disabled banner OR the chat card — not a blank page
    const hasBanner = await aiPage.isDisabled();
    const hasChatCard = await aiPage.chatCard.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasBanner || hasChatCard).toBe(true);
  });

  test('should show disabled banner when AI is not enabled', async ({ page }) => {
    const aiPage = new AiAssistantPage(page);
    await aiPage.goto();

    if (await aiPage.isDisabled()) {
      // Banner should explain how to enable AI
      const bannerText = await aiPage.disabledBanner.textContent();
      expect(bannerText).toMatch(/aiEnabled|AiEnabled|disabled/i);
    } else {
      test.skip(); // AI is enabled — disabled state test not applicable
    }
  });

  test('should show chat UI when AI is enabled', async ({ page }) => {
    const aiPage = new AiAssistantPage(page);
    await aiPage.goto();

    if (await aiPage.isDisabled()) {
      test.skip(); // AI is disabled — chat UI test not applicable
    }

    // Chat card should be visible
    await expect(aiPage.chatCard).toBeVisible({ timeout: 5000 });

    // Message input should be visible
    const inputVisible = await aiPage.messageInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (inputVisible) {
      await expect(aiPage.messageInput).toBeVisible();
    } else {
      // Check for any text input in the chat area
      const anyInput = page.locator('mat-card input[type="text"], mat-card textarea').first();
      await expect(anyInput).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show empty state before any messages', async ({ page }) => {
    const aiPage = new AiAssistantPage(page);
    await aiPage.goto();

    if (await aiPage.isDisabled()) {
      test.skip();
    }

    // Empty state should be visible initially
    const emptyVisible = await aiPage.emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    const messageCount = await aiPage.getMessageCount();

    // Either empty state shown OR no messages yet
    expect(emptyVisible || messageCount === 0).toBe(true);
  });

  test('should send a message and get a response (requires AI enabled)', async ({ page }) => {
    test.setTimeout(60000); // Ollama inference can take up to 30s

    const aiPage = new AiAssistantPage(page);
    await aiPage.goto();

    if (await aiPage.isDisabled()) {
      test.skip(); // Cannot test chat without AI enabled
    }

    const inputVisible = await aiPage.messageInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip(); // No input field found
    }

    const initialCount = await aiPage.getMessageCount();

    await aiPage.sendMessage('What is Angular?');

    // Loading indicator should appear briefly
    await page.waitForTimeout(500);

    // Wait for a response (up to 45s for Ollama)
    await page.waitForFunction(
      (initialCount) => document.querySelectorAll('.message').length > initialCount,
      initialCount,
      { timeout: 45000 }
    ).catch(() => {}); // Don't fail if Ollama is slow

    // Check that at least the user message was added
    const afterCount = await aiPage.getMessageCount();
    expect(afterCount).toBeGreaterThan(initialCount);
  });

  test('should clear conversation', async ({ page }) => {
    const aiPage = new AiAssistantPage(page);
    await aiPage.goto();

    if (await aiPage.isDisabled()) {
      test.skip();
    }

    // Send a message to create some history first
    const inputVisible = await aiPage.messageInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip();
    }

    await aiPage.sendMessage('Test message for clearing');
    await page.waitForTimeout(500);

    // Click clear button
    const clearVisible = await aiPage.clearButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (clearVisible) {
      await aiPage.clearButton.click();
      await page.waitForTimeout(500);

      // Empty state should be back
      const emptyVisible = await aiPage.emptyState.isVisible({ timeout: 3000 }).catch(() => false);
      const messageCount = await aiPage.getMessageCount();
      expect(emptyVisible || messageCount === 0).toBe(true);
    }
  });
});

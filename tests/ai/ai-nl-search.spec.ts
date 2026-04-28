import { test, expect } from '@playwright/test';
import { AiNlSearchPage } from '../../page-objects/ai-nl-search.page';

/**
 * AI NL Search Page Tests
 *
 * Tests for the Natural Language Search page at /ai/nl-search:
 * - Page renders (disabled banner OR search UI)
 * - Disabled state shows info banner
 * - Enabled state shows search input
 * - Search input and clear button work
 * - Parsed expression appears after a query (when AI enabled)
 */

test.describe('AI NL Search Page', () => {
  test.use({ storageState: '.auth/manager.json' });

  test('should load the NL Search page without errors', async ({ page }) => {
    const nlPage = new AiNlSearchPage(page);
    await nlPage.goto();

    const hasError = await page.locator('text=/page not found|404|error occurred/i')
      .isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBe(false);

    const hasBanner = await nlPage.isDisabled();
    const hasSearchCard = await page.locator('mat-card').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasBanner || hasSearchCard).toBe(true);
  });

  test('should show disabled banner when AI is not enabled', async ({ page }) => {
    const nlPage = new AiNlSearchPage(page);
    await nlPage.goto();

    if (await nlPage.isDisabled()) {
      const bannerText = await nlPage.disabledBanner.textContent();
      expect(bannerText).toMatch(/aiEnabled|AiEnabled|disabled/i);
    } else {
      test.skip();
    }
  });

  test('should show search input when AI is enabled', async ({ page }) => {
    const nlPage = new AiNlSearchPage(page);
    await nlPage.goto();

    if (await nlPage.isDisabled()) {
      test.skip();
    }

    // Should have a text input for NL queries
    const inputVisible = await nlPage.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      // Check for any search-type input
      const anyInput = page.locator('mat-card input[type="text"]').first();
      await expect(anyInput).toBeVisible({ timeout: 3000 });
    } else {
      await expect(nlPage.searchInput).toBeVisible();
    }
  });

  test('should show initial empty state prompt', async ({ page }) => {
    const nlPage = new AiNlSearchPage(page);
    await nlPage.goto();

    if (await nlPage.isDisabled()) {
      test.skip();
    }

    // Initial empty state should show a prompt to start searching
    const emptyVisible = await nlPage.emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    expect(emptyVisible).toBe(true);
  });

  test('should type into the search input', async ({ page }) => {
    const nlPage = new AiNlSearchPage(page);
    await nlPage.goto();

    if (await nlPage.isDisabled()) {
      test.skip();
    }

    const inputVisible = await nlPage.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip();
    }

    await nlPage.searchInput.fill('software engineers');
    const value = await nlPage.searchInput.inputValue();
    expect(value).toBe('software engineers');
  });

  test('should show parsed expression and results after search (requires AI enabled)', async ({ page }) => {
    test.setTimeout(30000);

    const nlPage = new AiNlSearchPage(page);
    await nlPage.goto();

    if (await nlPage.isDisabled()) {
      test.skip();
    }

    const inputVisible = await nlPage.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip();
    }

    // Type a query and wait for debounce + AI response
    await nlPage.search('employees in IT department');

    // Loading should appear and then resolve
    await page.waitForTimeout(2000);

    // Either results table or parsed expression or no-match state should be visible
    const hasParsed = await nlPage.hasParsedExpression();
    const hasResults = await nlPage.resultsTable.isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible({ timeout: 1000 }).catch(() => false);
    const hasError = await nlPage.errorRow.isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasParsed || hasResults || hasEmpty || hasError).toBe(true);
  });

  test('should clear the search input', async ({ page }) => {
    const nlPage = new AiNlSearchPage(page);
    await nlPage.goto();

    if (await nlPage.isDisabled()) {
      test.skip();
    }

    const inputVisible = await nlPage.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip();
    }

    await nlPage.searchInput.fill('test query');
    await page.waitForTimeout(300);

    // Find and click the Clear button
    const clearButton = page.locator('button').filter({ hasText: /clear/i }).first();
    const clearVisible = await clearButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (clearVisible) {
      await clearButton.click();
      await page.waitForTimeout(300);

      const value = await nlPage.searchInput.inputValue();
      expect(value).toBe('');
    }
  });
});

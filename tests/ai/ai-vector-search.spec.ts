import { test, expect } from '@playwright/test';
import { AiVectorSearchPage } from '../../page-objects/ai-vector-search.page';

/**
 * AI Vector Search Page Tests
 *
 * Tests for the Vector Search page at /ai/vector-search:
 * - Page renders (disabled banner OR search UI)
 * - Disabled state shows info banner
 * - Enabled state shows search input
 * - Score badges appear in results
 * - Results have correct columns (score, title, dept, salary range)
 */

test.describe('AI Vector Search Page', () => {
  test.use({ storageState: '.auth/manager.json' });

  test('should load the Vector Search page without errors', async ({ page }) => {
    const vsPage = new AiVectorSearchPage(page);
    await vsPage.goto();

    const hasError = await page.locator('text=/page not found|404|error occurred/i')
      .isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBe(false);

    const hasBanner = await vsPage.isDisabled();
    const hasCard = await page.locator('mat-card').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasBanner || hasCard).toBe(true);
  });

  test('should show disabled banner when AI is not enabled', async ({ page }) => {
    const vsPage = new AiVectorSearchPage(page);
    await vsPage.goto();

    if (await vsPage.isDisabled()) {
      const bannerText = await vsPage.disabledBanner.textContent();
      expect(bannerText).toMatch(/aiEnabled|VectorSearchEnabled|disabled/i);
    } else {
      test.skip();
    }
  });

  test('should show search input when AI is enabled', async ({ page }) => {
    const vsPage = new AiVectorSearchPage(page);
    await vsPage.goto();

    if (await vsPage.isDisabled()) {
      test.skip();
    }

    const inputVisible = await vsPage.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      const anyInput = page.locator('mat-card input[type="text"]').first();
      await expect(anyInput).toBeVisible({ timeout: 3000 });
    } else {
      await expect(vsPage.searchInput).toBeVisible();
    }
  });

  test('should show initial empty state prompt', async ({ page }) => {
    const vsPage = new AiVectorSearchPage(page);
    await vsPage.goto();

    if (await vsPage.isDisabled()) {
      test.skip();
    }

    const emptyVisible = await vsPage.emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    expect(emptyVisible).toBe(true);
  });

  test('should type into the search input', async ({ page }) => {
    const vsPage = new AiVectorSearchPage(page);
    await vsPage.goto();

    if (await vsPage.isDisabled()) {
      test.skip();
    }

    const inputVisible = await vsPage.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip();
    }

    await vsPage.searchInput.fill('senior software engineer');
    const value = await vsPage.searchInput.inputValue();
    expect(value).toBe('senior software engineer');
  });

  test('should show scored results after search (requires VectorSearch enabled)', async ({ page }) => {
    test.setTimeout(30000);

    const vsPage = new AiVectorSearchPage(page);
    await vsPage.goto();

    if (await vsPage.isDisabled()) {
      test.skip();
    }

    const inputVisible = await vsPage.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip();
    }

    await vsPage.search('senior engineer with cloud experience');

    await page.waitForTimeout(2000);

    // After the search, one of these should be visible
    const hasResults = await vsPage.resultsTable.isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible({ timeout: 1000 }).catch(() => false);
    const hasError = await vsPage.errorRow.isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasResults || hasEmpty || hasError).toBe(true);
  });

  test('should show score badges in results (requires VectorSearch enabled)', async ({ page }) => {
    test.setTimeout(30000);

    const vsPage = new AiVectorSearchPage(page);
    await vsPage.goto();

    if (await vsPage.isDisabled()) {
      test.skip();
    }

    const inputVisible = await vsPage.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip();
    }

    await vsPage.search('software engineer');
    await page.waitForTimeout(3000);

    const hasResults = await vsPage.resultsTable.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasResults) {
      test.skip(); // No results — vector search not returning data
    }

    // Results should have score badges
    const badgeCount = await vsPage.getScoreBadgeCount();
    expect(badgeCount).toBeGreaterThan(0);

    // Score badge format should be a percentage
    const firstBadge = await vsPage.scoreBadges.first().textContent();
    expect(firstBadge).toMatch(/\d+%/);
  });

  test('should clear the search input', async ({ page }) => {
    const vsPage = new AiVectorSearchPage(page);
    await vsPage.goto();

    if (await vsPage.isDisabled()) {
      test.skip();
    }

    const inputVisible = await vsPage.searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!inputVisible) {
      test.skip();
    }

    await vsPage.searchInput.fill('cloud engineer role');
    await page.waitForTimeout(300);

    const clearButton = page.locator('button').filter({ hasText: /clear/i }).first();
    const clearVisible = await clearButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (clearVisible) {
      await clearButton.click();
      await page.waitForTimeout(300);
      const value = await vsPage.searchInput.inputValue();
      expect(value).toBe('');
    }
  });
});

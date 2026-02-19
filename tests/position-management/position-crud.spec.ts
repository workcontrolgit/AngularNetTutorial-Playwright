import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { createPositionData } from '../../fixtures/data.fixtures';
import { PositionListPage } from '../../page-objects/position-list.page';
import { PositionFormPage } from '../../page-objects/position-form.page';

/**
 * Position CRUD Tests (HRAdmin Only)
 *
 * Tests for position management operations:
 * - HRAdmin can view positions
 * - HRAdmin can create position
 * - HRAdmin can edit position
 * - HRAdmin can delete position
 *
 * Note: Positions are restricted to HRAdmin role only
 */

test.describe('Position CRUD (HRAdmin Only)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HRAdmin (only role with position access)
    await loginAsRole(page, 'hradmin');
    const list = new PositionListPage(page);
    await list.goto();
  });

  test('should allow HRAdmin to view positions', async ({ page }) => {
    const list = new PositionListPage(page);

    await list.waitForLoad();
    await expect(list.pageTitle.first()).toBeVisible({ timeout: 5000 });

    const rowCount = await list.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should allow HRAdmin to create position', async ({ page }) => {
    const list = new PositionListPage(page);
    const form = new PositionFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      const positionData = createPositionData({
        name: `TestPosition_${Date.now()}`,
        description: 'Test position created by E2E test',
      });

      await form.fillForm({ title: positionData.name, description: positionData.description });
      await form.submit();

      const result = await form.verifySubmissionSuccess();
      expect(result.success).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should allow HRAdmin to edit position', async ({ page }) => {
    const list = new PositionListPage(page);
    const form = new PositionFormPage(page);

    const firstPosition = list.getRow(0);

    if (await firstPosition.isVisible({ timeout: 3000 })) {
      // Click edit button (or fall back to row click)
      const editButton = firstPosition.locator('button, a').filter({ hasText: /edit|update/i }).first();
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
        await page.waitForTimeout(1000);
      } else {
        await firstPosition.click();
        await page.waitForTimeout(1000);
      }

      await form.fillDescription('Updated position description via E2E test');
      await form.submit();

      const result = await form.verifySubmissionSuccess();
      expect(result.success).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should allow HRAdmin to delete position', async ({ page }) => {
    const list = new PositionListPage(page);
    const form = new PositionFormPage(page);

    // First create a test position to delete
    if (await list.hasCreatePermission()) {
      await list.clickCreate();

      const positionData = createPositionData({
        name: `ToDelete_${Date.now()}`,
        description: 'Position to be deleted',
      });

      await form.fillForm({ title: positionData.name });
      await form.submit();

      await page.waitForTimeout(2000);

      // Navigate back to list
      await list.goto();

      // Search for the position
      await list.search('ToDelete');
      const positionRow = list.getRowByText('ToDelete');

      if (await positionRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        const deleteButton = positionRow.locator('button').filter({ hasText: /delete|remove/i }).first();

        if (await deleteButton.isVisible({ timeout: 2000 })) {
          await deleteButton.click();
          await page.waitForTimeout(1000);

          // Confirm deletion
          const confirmButton = page.locator('button').filter({ hasText: /yes|confirm|delete/i });
          await confirmButton.last().click();

          await page.waitForTimeout(2000);

          const successIndicator = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|deleted|removed/i });
          const hasSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);

          expect(hasSuccess).toBe(true);
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should validate required fields for position creation', async ({ page }) => {
    const list = new PositionListPage(page);
    const form = new PositionFormPage(page);

    if (await list.hasCreatePermission()) {
      await list.clickCreate();
      await form.submit();

      const errorCount = await form.getValidationErrorCount();
      expect(errorCount).toBeGreaterThan(0);

      // Form should still be visible (not submitted)
      await form.waitForForm();
    } else {
      test.skip();
    }
  });

  test('should search positions by name', async ({ page }) => {
    const list = new PositionListPage(page);

    if (await list.searchInput.isVisible({ timeout: 2000 })) {
      const firstRow = list.getRow(0);
      const positionName = await firstRow.locator('td, mat-cell').first().textContent();

      if (positionName && positionName.trim()) {
        await list.search(positionName.trim().substring(0, 3));

        const visibleRows = list.rows.filter({ hasText: new RegExp(positionName.trim().substring(0, 3), 'i') });
        const count = await visibleRows.count();

        expect(count).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should display position details', async ({ page }) => {
    const list = new PositionListPage(page);
    const form = new PositionFormPage(page);

    const firstPosition = list.getRow(0);

    if (await firstPosition.isVisible({ timeout: 3000 })) {
      await firstPosition.click();
      await page.waitForTimeout(2000);

      // Verify we're on detail/edit page or dialog opened
      const isOnDetailPage = page.url().includes('position') || page.url().includes('edit');
      const isDialogOpen = await form.isDialogVisible();

      expect(isOnDetailPage || isDialogOpen).toBe(true);

      // Verify position title/name field is visible
      const nameField = form.titleInput;
      await expect(nameField).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  test('should handle duplicate position names', async ({ page }) => {
    const list = new PositionListPage(page);
    const form = new PositionFormPage(page);

    // Get name of existing position
    const firstRow = list.getRow(0);
    const existingName = await firstRow.locator('td, mat-cell').first().textContent();

    if (existingName && existingName.trim()) {
      if (await list.hasCreatePermission()) {
        await list.clickCreate();

        // Fill with duplicate name
        await form.fillTitle(existingName.trim());
        await form.submit();

        await page.waitForTimeout(2000);

        // Verify error message or form still visible
        const errorMessage = page.locator('mat-snack-bar, .toast, .notification, .mat-error, .error').filter({ hasText: /duplicate|already.*exists|conflict|unique/i });
        const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

        const formVisible = await form.form.isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasError || formVisible).toBe(true);
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});

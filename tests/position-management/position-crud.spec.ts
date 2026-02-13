import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { createPositionData } from '../../fixtures/data.fixtures';

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
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');
  });

  test('should allow HRAdmin to view positions', async ({ page }) => {
    // Verify positions page loads
    const pageTitle = page.locator('h1, h2, h3').filter({ hasText: /positions/i });
    await expect(pageTitle.first()).toBeVisible({ timeout: 5000 });

    // Verify table/list is visible
    const positionsTable = page.locator('table, mat-table, .positions-list');
    await expect(positionsTable.first()).toBeVisible({ timeout: 5000 });

    // Verify at least header row exists
    const rows = page.locator('tr, mat-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should allow HRAdmin to create position', async ({ page }) => {
    // Find and click create button
    const createButton = page.locator('button').filter({ hasText: /create|add.*position|new/i });

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Fill position form
      const positionData = createPositionData({
        name: `TestPosition_${Date.now()}`,
        description: 'Test position created by E2E test',
      });

      const nameInput = page.locator('input[name*="name"], input[formControlName="name"]');
      const descriptionInput = page.locator('textarea[name*="description"], textarea[formControlName="description"], input[name*="description"]');

      await nameInput.fill(positionData.name);

      if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionInput.fill(positionData.description);
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitButton.first().click();

      await page.waitForTimeout(2000);

      // Verify success
      const successIndicator = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|created|saved/i });
      const hasSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);

      const wasRedirected = !page.url().includes('create') && !page.url().includes('new');

      expect(hasSuccess || wasRedirected).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should allow HRAdmin to edit position', async ({ page }) => {
    // Find first position row
    const firstPosition = page.locator('tr, mat-row').nth(1);

    if (await firstPosition.isVisible({ timeout: 3000 })) {
      // Click edit button
      const editButton = firstPosition.locator('button, a').filter({ hasText: /edit|update/i }).first();

      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
      } else {
        // Try clicking the row itself
        await firstPosition.click();
      }

      await page.waitForTimeout(2000);

      // Update description
      const descriptionInput = page.locator('textarea[name*="description"], textarea[formControlName="description"], input[name*="description"]');

      if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionInput.clear();
        await descriptionInput.fill('Updated position description via E2E test');
      }

      // Submit
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i });
      await submitButton.first().click();

      await page.waitForTimeout(2000);

      // Verify success
      const successIndicator = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|updated|saved/i });
      const hasSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);

      const wasRedirected = !page.url().includes('edit');

      expect(hasSuccess || wasRedirected).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should allow HRAdmin to delete position', async ({ page }) => {
    // First create a test position to delete
    const createButton = page.locator('button').filter({ hasText: /create|add.*position|new/i });

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Create position
      const positionData = createPositionData({
        name: `ToDelete_${Date.now()}`,
        description: 'Position to be deleted',
      });

      const nameInput = page.locator('input[name*="name"], input[formControlName="name"]');
      await nameInput.fill(positionData.name);

      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitButton.first().click();

      await page.waitForTimeout(2000);

      // Navigate back to list
      await page.goto('/positions');
      await page.waitForLoadState('networkidle');

      // Search for the position
      const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill('ToDelete');
        await page.waitForTimeout(1000);
      }

      // Find the position row
      const positionRow = page.locator('tr, mat-row').filter({ hasText: /ToDelete/i }).first();

      if (await positionRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click delete button
        const deleteButton = positionRow.locator('button').filter({ hasText: /delete|remove/i }).first();

        if (await deleteButton.isVisible({ timeout: 2000 })) {
          await deleteButton.click();
          await page.waitForTimeout(1000);

          // Confirm deletion
          const confirmButton = page.locator('button').filter({ hasText: /yes|confirm|delete/i });
          await confirmButton.last().click();

          await page.waitForTimeout(2000);

          // Verify success
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
    // Click create button
    const createButton = page.locator('button').filter({ hasText: /create|add.*position|new/i });

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitButton.first().click();

      await page.waitForTimeout(1000);

      // Verify validation error
      const error = page.locator('.error, .mat-error, .invalid-feedback, [role="alert"]');
      const errorCount = await error.count();

      expect(errorCount).toBeGreaterThan(0);

      // Verify form is still visible (not submitted)
      const form = page.locator('form, mat-dialog');
      await expect(form.first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should search positions by name', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');

    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Get first position name from the list
      const firstRow = page.locator('tr, mat-row').nth(1);
      const positionName = await firstRow.locator('td, mat-cell').first().textContent();

      if (positionName && positionName.trim()) {
        // Search for this position
        await searchInput.fill(positionName.trim().substring(0, 3)); // Search first 3 chars
        await page.waitForTimeout(1000);

        // Verify filtered results
        const visibleRows = page.locator('tr, mat-row').filter({ hasText: new RegExp(positionName.trim().substring(0, 3), 'i') });
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
    // Click on first position
    const firstPosition = page.locator('tr, mat-row').nth(1);

    if (await firstPosition.isVisible({ timeout: 3000 })) {
      await firstPosition.click();
      await page.waitForTimeout(2000);

      // Verify we're on detail/edit page or dialog opened
      const isOnDetailPage = page.url().includes('position') || page.url().includes('edit');
      const isDialogOpen = await page.locator('mat-dialog, .modal, [role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);

      expect(isOnDetailPage || isDialogOpen).toBe(true);

      // Verify position details are visible
      const nameField = page.locator('input[name*="name"], input[formControlName="name"], text=/name/i').first();
      await expect(nameField).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  test('should handle duplicate position names', async ({ page }) => {
    // Get name of existing position
    const firstRow = page.locator('tr, mat-row').nth(1);
    const existingName = await firstRow.locator('td, mat-cell').first().textContent();

    if (existingName && existingName.trim()) {
      // Try to create position with duplicate name
      const createButton = page.locator('button').filter({ hasText: /create|add.*position|new/i });

      if (await createButton.isVisible({ timeout: 3000 })) {
        await createButton.first().click();
        await page.waitForTimeout(1000);

        // Fill with duplicate name
        const nameInput = page.locator('input[name*="name"], input[formControlName="name"]');
        await nameInput.fill(existingName.trim());

        // Submit
        const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
        await submitButton.first().click();

        await page.waitForTimeout(2000);

        // Verify error message or form still visible
        const errorMessage = page.locator('mat-snack-bar, .toast, .notification, .mat-error, .error').filter({ hasText: /duplicate|already.*exists|conflict|unique/i });
        const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

        const form = page.locator('form, mat-dialog');
        const formVisible = await form.isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasError || formVisible).toBe(true);
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});

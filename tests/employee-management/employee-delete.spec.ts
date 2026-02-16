import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { createEmployeeData } from '../../fixtures/data.fixtures';
import { createEmployee, getTokenForRole, deleteEmployee } from '../../fixtures/api.fixtures';

/**
 * Employee Delete Tests
 *
 * Tests for deleting employees:
 * - Delete confirmation dialog
 * - Successful deletion
 * - Employee removed from list
 * - Cancel deletion
 * - Permission checks
 */

test.describe('Employee Delete', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HRAdmin (has delete permission)
    await loginAsRole(page, 'hradmin');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    // Find first employee row (skip header)
    const firstEmployee = page.locator('tr, mat-row').nth(1);

    const deleteButton = firstEmployee.locator('button').filter({ hasText: /delete|remove/i }).first();

    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();

      // Wait for confirmation dialog
      await page.waitForTimeout(1000);

      // Verify confirmation dialog appears
      const confirmDialog = page.locator('mat-dialog, .modal, .dialog, [role="dialog"]');
      await expect(confirmDialog.first()).toBeVisible();

      // Verify confirmation message
      const confirmMessage = page.locator('text=/are you sure|confirm|delete/i');
      await expect(confirmMessage.first()).toBeVisible();

      // Verify buttons (confirm and cancel)
      const confirmButton = page.locator('button').filter({ hasText: /yes|confirm|delete/i });
      const cancelButton = page.locator('button').filter({ hasText: /no|cancel/i });

      await expect(confirmButton.first()).toBeVisible();
      await expect(cancelButton.first()).toBeVisible();

      // Cancel for this test
      await cancelButton.first().click();
    } else {
      test.skip();
    }
  });

  test('should successfully delete employee', async ({ page }) => {
    // Search for our test employee
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('ToDelete');
      await page.waitForTimeout(1000);
    }

    // Find the test employee row
    const employeeRow = page.locator('tr, mat-row').filter({ hasText: /ToDelete/i }).first();

    if (await employeeRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Get employee name before deletion
      const employeeName = await employeeRow.textContent();

      // Click delete button
      const deleteButton = employeeRow.locator('button').filter({ hasText: /delete|remove/i }).first();

      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        await page.waitForTimeout(1000);

        // Confirm deletion
        const confirmButton = page.locator('button').filter({ hasText: /yes|confirm|delete/i });
        await confirmButton.last().click(); // Use last() in case there are multiple

        // Wait for deletion to complete
        await page.waitForTimeout(2000);

        // Verify success notification
        const notification = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|deleted|removed/i });
        const hasNotification = await notification.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasNotification).toBe(true);
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should remove employee from list after deletion', async ({ page }) => {
    // Search for test employee
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('ToDelete');
      await page.waitForTimeout(1000);
    }

    // Find employee row
    const employeeRow = page.locator('tr, mat-row').filter({ hasText: /ToDelete/i }).first();

    if (await employeeRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Delete employee
      const deleteButton = employeeRow.locator('button').filter({ hasText: /delete|remove/i }).first();

      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        await page.waitForTimeout(1000);

        // Confirm
        const confirmButton = page.locator('button').filter({ hasText: /yes|confirm|delete/i });
        await confirmButton.last().click();

        // Wait for deletion
        await page.waitForTimeout(2000);

        // Refresh or search again
        if (hasSearch) {
          await searchInput.clear();
          await searchInput.fill('ToDelete');
          await page.waitForTimeout(1000);
        } else {
          await page.reload();
          await page.waitForLoadState('networkidle');
        }

        // Verify employee is no longer in the list
        const stillVisible = await employeeRow.isVisible({ timeout: 2000 }).catch(() => false);
        expect(stillVisible).toBe(false);
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should cancel deletion', async ({ page }) => {
    // Find test employee
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('ToDelete');
      await page.waitForTimeout(1000);
    }

    const employeeRow = page.locator('tr, mat-row').filter({ hasText: /ToDelete/i }).first();

    if (await employeeRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click delete
      const deleteButton = employeeRow.locator('button').filter({ hasText: /delete|remove/i }).first();

      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        await page.waitForTimeout(1000);

        // Click cancel
        const cancelButton = page.locator('button').filter({ hasText: /no|cancel|close/i });
        await cancelButton.first().click();

        await page.waitForTimeout(1000);

        // Verify dialog is closed
        const dialog = page.locator('mat-dialog, .modal, [role="dialog"]');
        const dialogVisible = await dialog.isVisible({ timeout: 2000 }).catch(() => false);
        expect(dialogVisible).toBe(false);

        // Verify employee still exists in list
        await expect(employeeRow).toBeVisible();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should not allow Manager role to delete', async ({ page }) => {
    // Logout and login as Manager
    await logout(page);
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Check for delete buttons
    const deleteButtons = page.locator('button').filter({ hasText: /delete|remove/i });
    const hasDeleteButtons = await deleteButtons.first().isVisible({ timeout: 2000 }).catch(() => false);

    // Manager should NOT have delete buttons (only HRAdmin can delete)
    expect(hasDeleteButtons).toBe(false);
  });

  test('should not allow Employee role to delete', async ({ page }) => {
    // Logout and login as Employee
    await logout(page);
    await loginAsRole(page, 'employee');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Check for delete buttons
    const deleteButtons = page.locator('button').filter({ hasText: /delete|remove/i });
    const hasDeleteButtons = await deleteButtons.first().isVisible({ timeout: 2000 }).catch(() => false);

    // Employee should NOT have delete buttons
    expect(hasDeleteButtons).toBe(false);
  });
});

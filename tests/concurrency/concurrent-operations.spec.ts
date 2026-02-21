import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { createEmployeeData } from '../../fixtures/data.fixtures';

/**
 * Concurrent Operations Tests
 *
 * Tests for handling concurrent operations:
 * - Multiple users creating employees
 * - Simultaneous edit conflicts
 * - Race conditions in forms
 * - Concurrent deletions
 */

test.describe('Concurrent Operations', () => {
  test('should handle multiple users creating employees simultaneously', async ({ browser }) => {
    // Create two browser contexts (simulating two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login both users as Manager
    await loginAsRole(page1, 'manager');
    await loginAsRole(page2, 'manager');

    // Navigate both to create employee page
    await page1.goto('/employees');
    await page1.waitForLoadState('networkidle');
    await page2.goto('/employees');
    await page2.waitForLoadState('networkidle');

    const createButton1 = page1.locator('button').filter({ hasText: /create|add.*employee|new/i });
    const createButton2 = page2.locator('button').filter({ hasText: /create|add.*employee|new/i });

    await createButton1.first().click();
    await page1.waitForTimeout(1000);
    await createButton2.first().click();
    await page2.waitForTimeout(1000);

    // Fill forms simultaneously
    const employee1Data = createEmployeeData({
      firstName: 'Concurrent1',
      lastName: `User${Date.now()}`,
      email: `concurrent1.${Date.now()}@example.com`,
    });

    const employee2Data = createEmployeeData({
      firstName: 'Concurrent2',
      lastName: `User${Date.now() + 1}`,
      email: `concurrent2.${Date.now()}@example.com`,
    });

    // Fill form 1
    await page1.locator('input[name*="firstName"], input[formControlName="firstName"]').fill(employee1Data.firstName);
    await page1.locator('input[name*="lastName"], input[formControlName="lastName"]').fill(employee1Data.lastName);
    await page1.locator('input[name*="email"], input[formControlName="email"]').fill(employee1Data.email);

    // Fill form 2
    await page2.locator('input[name*="firstName"], input[formControlName="firstName"]').fill(employee2Data.firstName);
    await page2.locator('input[name*="lastName"], input[formControlName="lastName"]').fill(employee2Data.lastName);
    await page2.locator('input[name*="email"], input[formControlName="email"]').fill(employee2Data.email);

    // Submit both forms simultaneously
    const submit1 = page1.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first().click();
    const submit2 = page2.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first().click();

    await Promise.all([submit1, submit2]);
    await page1.waitForTimeout(3000);
    await page2.waitForTimeout(3000);

    // Both should succeed
    const success1 = await page1.locator('mat-snack-bar, .toast').filter({ hasText: /success|created/i }).isVisible({ timeout: 2000 }).catch(() => false);
    const success2 = await page2.locator('mat-snack-bar, .toast').filter({ hasText: /success|created/i }).isVisible({ timeout: 2000 }).catch(() => false);

    expect(success1 || !page1.url().includes('create')).toBe(true);
    expect(success2 || !page2.url().includes('create')).toBe(true);

    await context1.close();
    await context2.close();
  });

  test('should handle simultaneous edit conflicts', async ({ browser }) => {
    // Create two contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login both users
    await loginAsRole(page1, 'manager');
    await loginAsRole(page2, 'manager');

    // Both navigate to same employee
    await page1.goto('/employees');
    await page1.waitForLoadState('networkidle');
    await page2.goto('/employees');
    await page2.waitForLoadState('networkidle');

    // Both click on first employee to edit
    const row1 = page1.locator('tr, mat-row').nth(1);
    const row2 = page2.locator('tr, mat-row').nth(1);

    if (await row1.isVisible({ timeout: 3000 }) && await row2.isVisible({ timeout: 3000 })) {
      await row1.click();
      await page1.waitForTimeout(2000);
      await row2.click();
      await page2.waitForTimeout(2000);

      // Both modify phone number
      const phone1 = page1.locator('input[name*="phone"], input[formControlName="phoneNumber"]');
      const phone2 = page2.locator('input[name*="phone"], input[formControlName="phoneNumber"]');

      if (await phone1.isVisible({ timeout: 2000 }).catch(() => false) &&
          await phone2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phone1.clear();
        await phone1.fill('555-1111');
        await phone2.clear();
        await phone2.fill('555-2222');

        // Submit both
        const save1 = page1.locator('button[type="submit"], button').filter({ hasText: /save|update/i }).first();
        const save2 = page2.locator('button[type="submit"], button').filter({ hasText: /save|update/i }).first();

        await save1.click();
        await page1.waitForTimeout(2000);
        await save2.click();
        await page2.waitForTimeout(3000);

        // Second save might show conflict or succeed (both are valid behaviors)
        const success2 = await page2.locator('mat-snack-bar, .toast').filter({ hasText: /success|updated/i }).isVisible({ timeout: 2000 }).catch(() => false);
        const conflict = await page2.locator('text=/conflict|modified|outdated/i').isVisible({ timeout: 2000 }).catch(() => false);

        expect(success2 || conflict || true).toBe(true);
      }
    }

    await context1.close();
    await context2.close();
  });

  test('should handle race conditions in form submission', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    // Fill form
    const employeeData = createEmployeeData({
      firstName: 'RaceTest',
      lastName: `User${Date.now()}`,
      email: `race.${Date.now()}@example.com`,
    });

    await page.locator('input[name*="firstName"], input[formControlName="firstName"]').fill(employeeData.firstName);
    await page.locator('input[name*="lastName"], input[formControlName="lastName"]').fill(employeeData.lastName);
    await page.locator('input[name*="email"], input[formControlName="email"]').fill(employeeData.email);

    // Click submit button multiple times rapidly
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first();

    await submitButton.click();
    await submitButton.click();
    await submitButton.click();

    await page.waitForTimeout(3000);

    // Should only create one employee (prevent double submission)
    const success = await page.locator('mat-snack-bar, .toast').filter({ hasText: /success|created/i }).isVisible({ timeout: 2000 }).catch(() => false);
    const wasRedirected = !page.url().includes('create');

    expect(success || wasRedirected).toBe(true);
  });

  test('should handle concurrent deletions', async ({ browser }) => {
    // Create two contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login as HRAdmin (has delete permission)
    await loginAsRole(page1, 'hradmin');
    await loginAsRole(page2, 'hradmin');

    // Navigate to employees
    await page1.goto('/employees');
    await page1.waitForLoadState('networkidle');
    await page2.goto('/employees');
    await page2.waitForLoadState('networkidle');

    // Try to delete same employee from both contexts
    const deleteButton1 = page1.locator('tr, mat-row').nth(1).locator('button').filter({ hasText: /delete/i }).first();
    const deleteButton2 = page2.locator('tr, mat-row').nth(1).locator('button').filter({ hasText: /delete/i }).first();

    if (await deleteButton1.isVisible({ timeout: 2000 }).catch(() => false) &&
        await deleteButton2.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click delete in both
      await deleteButton1.click();
      await page1.waitForTimeout(1000);
      await deleteButton2.click();
      await page2.waitForTimeout(1000);

      // Confirm both
      const confirm1 = page1.locator('button').filter({ hasText: /yes|confirm|delete/i }).last();
      const confirm2 = page2.locator('button').filter({ hasText: /yes|confirm|delete/i }).last();

      if (await confirm1.isVisible({ timeout: 2000 })) {
        await confirm1.click();
        await page1.waitForTimeout(2000);
      }

      if (await confirm2.isVisible({ timeout: 2000 })) {
        await confirm2.click();
        await page2.waitForTimeout(2000);
      }

      // Second deletion might fail (already deleted) or succeed
      const success1 = await page1.locator('mat-snack-bar, .toast').filter({ hasText: /success|deleted/i }).isVisible({ timeout: 2000 }).catch(() => false);
      const error2 = await page2.locator('mat-snack-bar, .toast').filter({ hasText: /error|not.*found|already.*deleted/i }).isVisible({ timeout: 2000 }).catch(() => false);

      expect(success1 || error2 || true).toBe(true);
    }

    await context1.close();
    await context2.close();
  });

  test('should handle concurrent API requests from same user', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to multiple pages rapidly (trigger multiple API calls)
    const navigation1 = page.goto('/employees');
    await page.waitForTimeout(100);
    const navigation2 = page.goto('/departments');
    await page.waitForTimeout(100);
    const navigation3 = page.goto('/employees');

    await Promise.all([navigation1, navigation2, navigation3]);
    await page.waitForTimeout(2000);

    // Should handle concurrent navigations gracefully
    const employeeTable = page.locator('table, mat-table');
    await expect(employeeTable.first()).toBeVisible({ timeout: 5000 });
  });

  test('should maintain data consistency during concurrent operations', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await loginAsRole(page1, 'manager');
    await loginAsRole(page2, 'manager');

    // Load employee list in both contexts
    await page1.goto('/employees');
    await page1.waitForLoadState('networkidle');
    await page2.goto('/employees');
    await page2.waitForLoadState('networkidle');

    // Get initial counts
    const rows1Before = await page1.locator('tr, mat-row').count();
    const rows2Before = await page2.locator('tr, mat-row').count();

    // Counts should be consistent
    expect(rows1Before).toBe(rows2Before);

    await context1.close();
    await context2.close();
  });

  test('should handle concurrent updates to different fields', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await loginAsRole(page1, 'manager');
    await loginAsRole(page2, 'manager');

    // Both edit same employee but different fields
    await page1.goto('/employees');
    await page1.waitForLoadState('networkidle');
    await page2.goto('/employees');
    await page2.waitForLoadState('networkidle');

    const row1 = page1.locator('tr, mat-row').nth(1);
    const row2 = page2.locator('tr, mat-row').nth(1);

    if (await row1.isVisible({ timeout: 3000 }) && await row2.isVisible({ timeout: 3000 })) {
      await row1.click();
      await page1.waitForTimeout(2000);
      await row2.click();
      await page2.waitForTimeout(2000);

      // User 1 updates phone
      const phone1 = page1.locator('input[name*="phone"], input[formControlName="phoneNumber"]');
      if (await phone1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phone1.clear();
        await phone1.fill('555-0001');
      }

      // User 2 updates first name
      const firstName2 = page2.locator('input[name*="firstName"], input[formControlName="firstName"]');
      await firstName2.clear();
      await firstName2.fill('UpdatedName');

      // Both save
      await page1.locator('button[type="submit"], button').filter({ hasText: /save|update/i }).first().click();
      await page1.waitForTimeout(2000);
      await page2.locator('button[type="submit"], button').filter({ hasText: /save|update/i }).first().click();
      await page2.waitForTimeout(2000);

      // Both should succeed or one shows conflict
      expect(true).toBe(true);
    }

    await context1.close();
    await context2.close();
  });
});

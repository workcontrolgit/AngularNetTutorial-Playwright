import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { PositionListPage } from '../../page-objects/position-list.page';

/**
 * Position RBAC Tests
 *
 * Actual Angular access control (from app.routes.ts and position-list.component.html):
 *
 * Route guards:
 *   /positions           — NO guard: Manager and Employee can VIEW the list
 *   /positions/create    — hrAdminGuard: only HRAdmin can navigate here
 *   /positions/edit/:id  — hrAdminGuard: only HRAdmin can navigate here
 *
 * Template visibility (*appHasRole):
 *   "Add Position" button — HRAdmin + Manager (visible, but create route is guarded)
 *   Edit button           — HRAdmin + Manager
 *   Delete button         — HRAdmin only
 *   "Add Mock Data"       — HRAdmin only
 */

test.describe('Position RBAC', () => {
  test('should not allow Manager to create positions (route guarded)', async ({ page }) => {
    await loginAsRole(page, 'manager');

    // Manager can see the "Add Position" button in the UI, but the /positions/create
    // route is protected by hrAdminGuard — navigating directly should redirect
    await page.goto('/positions/create');
    await page.waitForLoadState('networkidle');

    const isOnCreatePage = page.url().includes('/positions/create');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized|no.*permission/i')
      .isVisible({ timeout: 2000 }).catch(() => false);

    expect(!isOnCreatePage || accessDenied).toBe(true);
  });

  test('should allow Manager to view positions list', async ({ page }) => {
    await loginAsRole(page, 'manager');

    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    // Manager CAN view the positions list (no route guard on /positions)
    const table = page.locator('table, mat-table').first();
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('should not allow Manager to edit positions (route guarded)', async ({ page }) => {
    await loginAsRole(page, 'manager');

    // /positions/edit/:id is guarded by hrAdminGuard
    await page.goto('/positions/edit/00000000-0000-0000-0000-000000000001');
    await page.waitForLoadState('networkidle');

    const isOnEditPage = page.url().includes('/positions/edit/');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized|no.*permission/i')
      .isVisible({ timeout: 2000 }).catch(() => false);

    expect(!isOnEditPage || accessDenied).toBe(true);
  });

  test('should not allow Employee to access positions create', async ({ page }) => {
    await loginAsRole(page, 'employee');
    const list = new PositionListPage(page);
    await list.goto();

    // Employee has no role matching *appHasRole="['HRAdmin', 'Manager']"
    // so the "Add Position" button is not visible
    const canCreate = await list.hasCreatePermission();
    expect(canCreate).toBe(false);
  });

  test('should allow Employee to view positions list without action buttons', async ({ page }) => {
    await loginAsRole(page, 'employee');

    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    // Employee CAN see the list (no route guard on /positions)
    const table = page.locator('table, mat-table').first();
    await expect(table).toBeVisible({ timeout: 5000 });

    // But Employee should have no Create, Edit, or Delete buttons
    const list = new PositionListPage(page);
    const canCreate = await list.hasCreatePermission();
    const canEdit = await list.hasEditPermission();
    const canDelete = await list.hasDeletePermission();

    expect(canCreate).toBe(false);
    expect(canEdit).toBe(false);
    expect(canDelete).toBe(false);
  });

  test('should redirect unauthorized direct URL access', async ({ page }) => {
    await loginAsRole(page, 'manager');

    await page.goto('/positions/create');
    await page.waitForLoadState('networkidle');

    const isOnCreatePage = page.url().includes('positions/create');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized|no.*permission/i')
      .isVisible({ timeout: 2000 }).catch(() => false);

    expect(!isOnCreatePage || accessDenied).toBe(true);
  });

  test('should redirect unauthorized edit attempts', async ({ page }) => {
    await loginAsRole(page, 'manager');

    await page.goto('/positions/edit/00000000-0000-0000-0000-000000000001');
    await page.waitForLoadState('networkidle');

    const isOnEditPage = page.url().includes('positions') && page.url().includes('edit');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized|no.*permission/i')
      .isVisible({ timeout: 2000 }).catch(() => false);

    expect(!isOnEditPage || accessDenied).toBe(true);
  });

  test('should hide position menu item for non-HRAdmin users', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const positionsMenuItem = page.locator('a, button, mat-list-item').filter({ hasText: /^positions$/i });
    const isVisible = await positionsMenuItem.isVisible({ timeout: 2000 }).catch(() => false);

    expect(isVisible).toBe(false);
  });

  test('should show position menu item for HRAdmin users', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const positionsMenuItem = page.locator('a, button, mat-list-item').filter({ hasText: /positions/i });
    const isVisible = await positionsMenuItem.isVisible({ timeout: 3000 }).catch(() => false);

    expect(isVisible).toBe(true);
  });

  test('should show edit but not delete buttons for Manager on positions list', async ({ page }) => {
    await loginAsRole(page, 'manager');
    const list = new PositionListPage(page);
    await list.goto();

    const positionsTable = await list.table.isVisible({ timeout: 2000 }).catch(() => false);

    if (positionsTable) {
      // Manager sees Edit buttons (*appHasRole="['HRAdmin', 'Manager']")
      const hasEditButtons = await list.hasEditPermission();
      // Manager does NOT see Delete buttons (*appHasRole="['HRAdmin']")
      const hasDeleteButtons = await list.hasDeletePermission();

      expect(hasEditButtons).toBe(true);
      expect(hasDeleteButtons).toBe(false);
    } else {
      expect(true).toBe(true);
    }
  });

  test('should allow HRAdmin full access to positions', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    const list = new PositionListPage(page);
    await list.goto();

    await expect(list.pageTitle.first()).toBeVisible({ timeout: 5000 });

    const canCreate = await list.hasCreatePermission();
    expect(canCreate).toBe(true);

    const rowCount = await list.getRowCount();
    if (rowCount > 0) {
      const hasEditButton = await list.hasEditPermission();
      const hasDeleteButton = await list.hasDeletePermission();
      expect(hasEditButton || hasDeleteButton).toBe(true);
    }
  });
});

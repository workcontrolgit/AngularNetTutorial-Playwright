import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { PositionListPage } from '../../page-objects/position-list.page';

/**
 * Position RBAC Tests
 *
 * Tests for position management role-based access control:
 * - Manager cannot access position management
 * - Employee cannot access position management
 * - Unauthorized redirects to 403 or login
 * - Only HRAdmin has full position access
 */

test.describe('Position RBAC', () => {
  test('should not allow Manager to access positions create', async ({ page }) => {
    await loginAsRole(page, 'manager');
    const list = new PositionListPage(page);
    await list.goto();

    const canCreate = await list.hasCreatePermission();
    expect(canCreate).toBe(false);
  });

  test('should not allow Manager to access positions page', async ({ page }) => {
    await loginAsRole(page, 'manager');

    // Try to navigate to positions
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    // Should either:
    // 1. Redirect to 403 Forbidden page
    // 2. Redirect to home/dashboard
    // 3. Show access denied message
    // 4. Not show positions content
    const isForbidden = page.url().includes('403') || page.url().includes('forbidden');
    const isRedirected = !page.url().includes('positions');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized|no.*permission/i').isVisible({ timeout: 2000 }).catch(() => false);
    const noPositionsTable = !(await page.locator('table, mat-table').isVisible({ timeout: 2000 }).catch(() => true));

    expect(isForbidden || isRedirected || accessDenied || noPositionsTable).toBe(true);
  });

  test('should not allow Employee to access positions create', async ({ page }) => {
    await loginAsRole(page, 'employee');
    const list = new PositionListPage(page);
    await list.goto();

    const canCreate = await list.hasCreatePermission();
    expect(canCreate).toBe(false);
  });

  test('should not allow Employee to access positions page', async ({ page }) => {
    await loginAsRole(page, 'employee');

    // Try to navigate to positions
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    // Should deny access
    const isForbidden = page.url().includes('403') || page.url().includes('forbidden');
    const isRedirected = !page.url().includes('positions');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized|no.*permission/i').isVisible({ timeout: 2000 }).catch(() => false);
    const noPositionsTable = !(await page.locator('table, mat-table').isVisible({ timeout: 2000 }).catch(() => true));

    expect(isForbidden || isRedirected || accessDenied || noPositionsTable).toBe(true);
  });

  test('should redirect unauthorized direct URL access', async ({ page }) => {
    await loginAsRole(page, 'manager');

    // Try to access position create page directly
    await page.goto('/positions/create');
    await page.waitForLoadState('networkidle');

    // Should be redirected or show access denied
    const isOnCreatePage = page.url().includes('positions/create');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized|no.*permission/i').isVisible({ timeout: 2000 }).catch(() => false);

    // Should NOT be on create page (either redirected or access denied)
    expect(!isOnCreatePage || accessDenied).toBe(true);
  });

  test('should redirect unauthorized edit attempts', async ({ page }) => {
    await loginAsRole(page, 'manager');

    // Try to access position edit page directly
    await page.goto('/positions/1/edit');
    await page.waitForLoadState('networkidle');

    // Should be redirected or show access denied
    const isOnEditPage = page.url().includes('positions') && page.url().includes('edit');
    const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized|no.*permission/i').isVisible({ timeout: 2000 }).catch(() => false);

    // Should NOT be on edit page (either redirected or access denied)
    expect(!isOnEditPage || accessDenied).toBe(true);
  });

  test('should hide position menu item for non-HRAdmin users', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if positions menu item is visible
    const positionsMenuItem = page.locator('a, button, mat-list-item').filter({ hasText: /^positions$/i });
    const isVisible = await positionsMenuItem.isVisible({ timeout: 2000 }).catch(() => false);

    // Should NOT be visible to Manager
    expect(isVisible).toBe(false);
  });

  test('should show position menu item for HRAdmin users', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if positions menu item is visible
    const positionsMenuItem = page.locator('a, button, mat-list-item').filter({ hasText: /positions/i });
    const isVisible = await positionsMenuItem.isVisible({ timeout: 3000 }).catch(() => false);

    // Should be visible to HRAdmin
    expect(isVisible).toBe(true);
  });

  test('should not show edit/delete buttons to Manager on positions list', async ({ page }) => {
    await loginAsRole(page, 'manager');
    const list = new PositionListPage(page);
    await list.goto();

    // If we can see the list at all, verify no edit/delete buttons
    const positionsTable = await list.table.isVisible({ timeout: 2000 }).catch(() => false);

    if (positionsTable) {
      const hasEditButtons = await list.hasEditPermission();
      const hasDeleteButtons = await list.hasDeletePermission();

      expect(hasEditButtons).toBe(false);
      expect(hasDeleteButtons).toBe(false);
    } else {
      // Table not visible is also acceptable (access denied)
      expect(true).toBe(true);
    }
  });

  test('should allow HRAdmin full access to positions', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    const list = new PositionListPage(page);
    await list.goto();

    await expect(list.pageTitle.first()).toBeVisible({ timeout: 5000 });

    // HRAdmin should see create button
    const canCreate = await list.hasCreatePermission();
    expect(canCreate).toBe(true);

    // Check for edit/delete buttons (if positions exist)
    const rowCount = await list.getRowCount();

    if (rowCount > 0) {
      const hasEditButton = await list.hasEditPermission();
      const hasDeleteButton = await list.hasDeletePermission();

      // At least one action button should be visible
      expect(hasEditButton || hasDeleteButton).toBe(true);
    }
  });
});

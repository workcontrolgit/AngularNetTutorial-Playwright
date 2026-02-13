import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';

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
    // Login as Manager
    await loginAsRole(page, 'manager');
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    // Verify Create button is NOT visible
    const createButton = page.locator('button').filter({ hasText: /create|add.*position|new/i });
    const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasCreateButton).toBe(false);
  });

  test('should not allow Manager to access positions page', async ({ page }) => {
    // Login as Manager
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
    // Login as Employee
    await loginAsRole(page, 'employee');
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    // Verify Create button is NOT visible
    const createButton = page.locator('button').filter({ hasText: /create|add.*position|new/i });
    const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasCreateButton).toBe(false);
  });

  test('should not allow Employee to access positions page', async ({ page }) => {
    // Login as Employee
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
    // Login as Manager
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
    // Login as Manager
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
    // Login as Manager
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
    // Login as HRAdmin
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
    // Login as Manager
    await loginAsRole(page, 'manager');

    // Try to navigate to positions (might be blocked)
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    // If we can see the list at all, verify no edit/delete buttons
    const positionsTable = await page.locator('table, mat-table').isVisible({ timeout: 2000 }).catch(() => false);

    if (positionsTable) {
      const editButtons = page.locator('button, a').filter({ hasText: /edit/i });
      const deleteButtons = page.locator('button').filter({ hasText: /delete/i });

      const hasEditButtons = await editButtons.first().isVisible({ timeout: 1000 }).catch(() => false);
      const hasDeleteButtons = await deleteButtons.first().isVisible({ timeout: 1000 }).catch(() => false);

      expect(hasEditButtons).toBe(false);
      expect(hasDeleteButtons).toBe(false);
    } else {
      // Table not visible is also acceptable (access denied)
      expect(true).toBe(true);
    }
  });

  test('should allow HRAdmin full access to positions', async ({ page }) => {
    // Login as HRAdmin
    await loginAsRole(page, 'hradmin');
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    // Verify full access
    const pageTitle = page.locator('h1, h2, h3').filter({ hasText: /positions/i });
    await expect(pageTitle.first()).toBeVisible({ timeout: 5000 });

    // Verify CRUD buttons are available
    const createButton = page.locator('button').filter({ hasText: /create|add.*position|new/i });
    const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

    // HRAdmin should see create button
    expect(hasCreateButton).toBe(true);

    // Check for edit/delete buttons (if positions exist)
    const rows = page.locator('tr, mat-row');
    const rowCount = await rows.count();

    if (rowCount > 1) {
      const firstRow = rows.nth(1);
      const editButton = firstRow.locator('button, a').filter({ hasText: /edit/i });
      const deleteButton = firstRow.locator('button').filter({ hasText: /delete/i });

      const hasEditButton = await editButton.isVisible({ timeout: 2000 }).catch(() => false);
      const hasDeleteButton = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);

      // At least one action button should be visible
      expect(hasEditButton || hasDeleteButton).toBe(true);
    }
  });
});

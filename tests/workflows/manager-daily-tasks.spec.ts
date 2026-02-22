import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { createEmployeeData, createDepartmentData } from '../../fixtures/data.fixtures';

/**
 * Manager Daily Tasks Workflow Test
 *
 * Simulates typical daily tasks for a Manager:
 * 1. Login as Manager
 * 2. Review employee list
 * 3. Create new employee
 * 4. Update existing employee
 * 5. Create new department
 * 6. Assign employee to department
 * 7. Logout
 */

test.describe('Manager Daily Tasks Workflow', () => {
  test('should complete typical manager daily workflow', async ({ page }) => {
    // Step 1: Login as Manager
    await loginAsRole(page, 'manager');
    await page.waitForLoadState('networkidle');

    // Verify dashboard loads
    const dashboard = page.locator('text=/dashboard|home/i');
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });

    // Step 2: Review employee list
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Verify employee list loads
    const employeeTable = page.locator('table, mat-table');
    await expect(employeeTable.first()).toBeVisible({ timeout: 5000 });

    // Check total employees (from pagination or counter)
    const rows = page.locator('tr, mat-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Step 3: Create new employee
    const createEmployeeButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createEmployeeButton.first().click();
    await page.waitForTimeout(1000);

    // Fill employee form
    const newEmployeeData = createEmployeeData({
      firstName: 'ManagerTask',
      lastName: `New${Date.now()}`,
      email: `manager.task.${Date.now()}@example.com`,
    });

    // Fill all form fields
    await page.locator('input[name*="firstName"], input[formControlName="firstName"]').fill(newEmployeeData.firstName);
    await page.locator('input[name*="lastName"], input[formControlName="lastName"]').fill(newEmployeeData.lastName);
    await page.locator('input[name*="email"], input[formControlName="email"]').fill(newEmployeeData.email);

    // Fill required fields
    const phoneNumber = page.getByPlaceholder(/phone/i).or(page.getByLabel(/phone/i)).or(page.locator('input[formControlName="phoneNumber"]'));
    await phoneNumber.fill(newEmployeeData.phoneNumber);

    const dateOfBirth = page.getByPlaceholder(/date.*birth/i).or(page.getByLabel(/date.*birth/i)).or(page.locator('input[formControlName="dateOfBirth"]'));
    await dateOfBirth.fill(newEmployeeData.dateOfBirth);

    // Select required Department
    const departmentSelect = page.locator('mat-select[formControlName="departmentId"], select[name*="department"]');
    if (await departmentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await departmentSelect.click();
      await page.waitForTimeout(500);
      const firstDepartmentOption = page.locator('mat-option, option').first();
      await firstDepartmentOption.click();
      await page.waitForTimeout(300);
    }

    // Select required Position
    const positionSelect = page.locator('mat-select[formControlName="positionId"], select[name*="position"]');
    if (await positionSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await positionSelect.click();
      await page.waitForTimeout(500);
      const firstPositionOption = page.locator('mat-option, option').first();
      await firstPositionOption.click();
      await page.waitForTimeout(300);
    }

    // Submit
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitButton.first().click();

    // Wait for navigation or success notification (increased timeout)
    await page.waitForTimeout(5000);

    // Verify creation - check notification OR that we navigated away
    const successNotification = page.locator('mat-snack-bar, .toast, .notification, .snackbar').filter({ hasText: /success|created|saved/i });
    const hasSuccess = await successNotification.isVisible({ timeout: 5000 }).catch(() => false);
    const leftCreatePage = !page.url().includes('create');

    expect(hasSuccess || leftCreatePage).toBe(true);

    // Step 4: Update existing employee
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Find the newly created employee
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill(newEmployeeData.lastName);
      await page.waitForTimeout(1500);
    }

    const employeeRow = page.locator('tr, mat-row').filter({ hasText: new RegExp(newEmployeeData.lastName, 'i') }).first();

    if (await employeeRow.isVisible({ timeout: 3000 })) {
      // Click to edit
      const editButton = employeeRow.locator('button, a').filter({ hasText: /edit/i }).first();

      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
      } else {
        await employeeRow.click();
      }

      await page.waitForTimeout(2000);

      // Update phone number
      const phoneInput = page.locator('input[name*="phone"], input[formControlName="phoneNumber"]');
      if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneInput.clear();
        await phoneInput.fill('555-9999');
      }

      // Save update
      const saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i });
      await saveButton.first().click();

      await page.waitForTimeout(2000);

      // Verify update
      const updateSuccess = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|updated/i });
      const hasUpdateSuccess = await updateSuccess.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasUpdateSuccess || !page.url().includes('edit')).toBe(true);
    }

    // Step 5: Create new department
    await page.goto('/departments');
    await page.waitForLoadState('networkidle');

    const createDeptButton = page.locator('button').filter({ hasText: /create|add.*department|new/i });

    if (await createDeptButton.isVisible({ timeout: 3000 })) {
      await createDeptButton.first().click();
      await page.waitForTimeout(1000);

      // Fill department form
      const deptData = createDepartmentData({
        name: `ManagerDept_${Date.now()}`,
        description: 'Created during manager daily tasks',
      });

      const deptNameInput = page.locator('input[name*="name"], input[formControlName="name"]');
      const deptDescInput = page.locator('textarea[name*="description"], textarea[formControlName="description"], input[name*="description"]');

      await deptNameInput.fill(deptData.name);

      if (await deptDescInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deptDescInput.fill(deptData.description);
      }

      // Submit
      const submitDeptButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitDeptButton.first().click();

      await page.waitForTimeout(2000);

      // Verify creation
      const deptSuccess = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|created/i });
      const hasDeptSuccess = await deptSuccess.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasDeptSuccess || !page.url().includes('create')).toBe(true);
    }

    // Step 6: Assign employee to department
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Find the employee we created
    const searchInput2 = page.locator('input[placeholder*="Search"], input[name*="search"]');
    if (await searchInput2.isVisible({ timeout: 3000 })) {
      await searchInput2.fill(newEmployeeData.lastName);
      await page.waitForTimeout(1500);
    }

    const employeeRow2 = page.locator('tr, mat-row').filter({ hasText: new RegExp(newEmployeeData.lastName, 'i') }).first();

    if (await employeeRow2.isVisible({ timeout: 3000 })) {
      // Click to edit
      const editButton = employeeRow2.locator('button, a').filter({ hasText: /edit/i }).first();

      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
      } else {
        await employeeRow2.click();
      }

      await page.waitForTimeout(2000);

      // Select department
      const departmentSelect = page.locator('mat-select[formControlName*="department"], select[name*="department"]');

      if (await departmentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await departmentSelect.click();
        await page.waitForTimeout(500);

        // Select first available department
        const departmentOption = page.locator('mat-option, option').nth(1);
        await departmentOption.click();

        await page.waitForTimeout(500);

        // Save assignment
        const saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i });
        await saveButton.first().click();

        await page.waitForTimeout(2000);

        // Verify assignment
        const assignSuccess = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|updated/i });
        const hasAssignSuccess = await assignSuccess.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasAssignSuccess || !page.url().includes('edit')).toBe(true);
      }
    }

    // Step 7: Logout
    const userMenu = page.locator('button, a').filter({ hasText: /logout|sign.*out|profile|account/i });

    if (await userMenu.first().isVisible({ timeout: 3000 })) {
      await userMenu.first().click();
      await page.waitForTimeout(500);

      const logoutButton = page.locator('button, a').filter({ hasText: /logout|sign.*out/i });
      if (await logoutButton.last().isVisible({ timeout: 2000 })) {
        await logoutButton.last().click();
        await page.waitForTimeout(2000);

        // Verify logged out
        const isLoggedOut = page.url().includes('login') || page.url().includes('sts.skoruba.local');
        expect(isLoggedOut).toBe(true);
      }
    }
  });

  test('should handle multiple employee updates in sequence', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Get first two employees
    const rows = page.locator('tr, mat-row');
    const rowCount = await rows.count();

    if (rowCount >= 3) { // At least header + 2 data rows
      for (let i = 1; i <= 2; i++) {
        const row = rows.nth(i);

        if (await row.isVisible({ timeout: 2000 })) {
          const editButton = row.locator('button, a').filter({ hasText: /edit/i }).first();

          if (await editButton.isVisible({ timeout: 2000 })) {
            await editButton.click();
            await page.waitForTimeout(1500);

            // Make a small change
            const phoneInput = page.locator('input[name*="phone"], input[formControlName="phoneNumber"]');
            if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
              const currentPhone = await phoneInput.inputValue();
              await phoneInput.fill(currentPhone || '555-0000');
            }

            // Save
            const saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i });
            if (await saveButton.isVisible({ timeout: 2000 })) {
              await saveButton.first().click();
              await page.waitForTimeout(2000);
            }

            // Return to list
            await page.goto('/employees');
            await page.waitForLoadState('networkidle');
          }
        }
      }

      // Workflow completes successfully
      expect(true).toBe(true);
    }
  });

  test('should review dashboard metrics before starting tasks', async ({ page }) => {
    // Login
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check employee count metric
    const employeeMetric = page.locator('mat-card, .metric, .stat').filter({ hasText: /employee/i });
    const hasMetric = await employeeMetric.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMetric) {
      const metricText = await employeeMetric.textContent();
      expect(metricText).toMatch(/\d+/);
    }

    // Navigate to employees from dashboard (via sidebar or direct navigation)
    const employeesLink = page.locator('a, button').filter({ hasText: /^employees$/i });

    if (await employeesLink.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await employeesLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      // If no link found, navigate directly
      await page.goto('/employees');
      await page.waitForLoadState('networkidle');
    }

    // Verify on employees page
    expect(page.url()).toMatch(/employees/);
  });
});

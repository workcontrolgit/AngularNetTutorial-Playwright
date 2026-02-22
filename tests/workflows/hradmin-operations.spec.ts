import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { createSalaryRangeData, createPositionData, createEmployeeData } from '../../fixtures/data.fixtures';

/**
 * HRAdmin Operations Workflow Test
 *
 * Simulates HRAdmin administrative tasks:
 * 1. Login as HRAdmin
 * 2. Create new salary range
 * 3. Create new position
 * 4. Link position to salary range
 * 5. Create employee in new position
 * 6. Verify all relationships
 * 7. Logout
 */

test.describe('HRAdmin Operations Workflow', () => {
  let salaryRangeId: number;
  let positionId: number;
  let employeeId: number;

  test('should complete full HRAdmin workflow with relationships', async ({ page }) => {
    // Step 1: Login as HRAdmin
    await loginAsRole(page, 'hradmin');
    await page.waitForLoadState('networkidle');

    // Verify dashboard loads
    const dashboard = page.locator('text=/dashboard|home/i');
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });

    // Step 2: Create new salary range
    await page.goto('/salary-ranges');
    await page.waitForLoadState('networkidle');

    const createRangeButton = page.locator('button').filter({ hasText: /create|add.*range|new/i });

    if (await createRangeButton.isVisible({ timeout: 3000 })) {
      await createRangeButton.first().click();
      await page.waitForTimeout(1000);

      // Fill salary range form
      const salaryData = createSalaryRangeData({
        name: `HRAdmin_Range_${Date.now()}`,
        minSalary: 60000,
        maxSalary: 90000,
      });

      const nameInput = page.locator('input[name*="name"], input[formControlName="name"]').first();
      const minSalaryInput = page.locator('input[name*="min"], input[formControlName="minSalary"]');
      const maxSalaryInput = page.locator('input[name*="max"], input[formControlName="maxSalary"]');

      await nameInput.fill(salaryData.name);
      await minSalaryInput.fill(salaryData.minSalary.toString());
      await maxSalaryInput.fill(salaryData.maxSalary.toString());

      // Submit
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitButton.first().click();

      // Wait for navigation or success notification (increased timeout)
      await page.waitForTimeout(5000);

      // Verify creation
      const successNotification = page.locator('mat-snack-bar, .toast, .notification, .snackbar').filter({ hasText: /success|created|saved/i });
      const hasSuccess = await successNotification.isVisible({ timeout: 5000 }).catch(() => false);
      const leftCreatePage = !page.url().includes('create');

      expect(hasSuccess || leftCreatePage).toBe(true);
    }

    // Step 3: Create new position
    await page.goto('/positions');
    await page.waitForLoadState('networkidle');

    const createPositionButton = page.locator('button').filter({ hasText: /create|add.*position|new/i });

    if (await createPositionButton.isVisible({ timeout: 3000 })) {
      await createPositionButton.first().click();
      await page.waitForTimeout(1000);

      // Fill position form
      const positionData = createPositionData({
        title: `HRAdminPosition_${Date.now()}`,
        description: 'Position created in HRAdmin workflow',
      });

      const nameInput = page.locator('input[name*="name"], input[name*="title"], input[formControlName="name"], input[formControlName="title"]');
      const descriptionInput = page.locator('textarea[name*="description"], textarea[formControlName="description"], input[name*="description"]');

      await nameInput.fill(positionData.title);

      if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionInput.fill(positionData.description);
      }

      // Step 4: Link position to salary range (if available during creation)
      const salaryRangeSelect = page.locator('mat-select[formControlName*="salary"], mat-select[formControlName*="range"], select[name*="salary"]');

      if (await salaryRangeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await salaryRangeSelect.click();
        await page.waitForTimeout(500);

        // Select the salary range we created (should be recent)
        const rangeOptions = page.locator('mat-option, option');
        const optionCount = await rangeOptions.count();

        if (optionCount > 0) {
          // Select last option (most recent)
          await rangeOptions.last().click();
          await page.waitForTimeout(500);
        }
      }

      // Submit position
      const submitPositionButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
      await submitPositionButton.first().click();

      // Wait for navigation or success notification (increased timeout)
      await page.waitForTimeout(5000);

      // Verify creation
      const positionSuccess = page.locator('mat-snack-bar, .toast, .notification, .snackbar').filter({ hasText: /success|created|saved/i });
      const hasPositionSuccess = await positionSuccess.isVisible({ timeout: 5000 }).catch(() => false);
      const leftCreatePage = !page.url().includes('create');

      expect(hasPositionSuccess || leftCreatePage).toBe(true);
    }

    // Step 5: Create employee in new position
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createEmployeeButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createEmployeeButton.first().click();
    await page.waitForTimeout(1000);

    // Fill employee form
    const employeeData = createEmployeeData({
      firstName: 'HRAdmin',
      lastName: `Workflow${Date.now()}`,
      email: `hradmin.workflow.${Date.now()}@example.com`,
    });

    // Fill all form fields
    await page.locator('input[name*="firstName"], input[formControlName="firstName"]').fill(employeeData.firstName);
    await page.locator('input[name*="lastName"], input[formControlName="lastName"]').fill(employeeData.lastName);
    await page.locator('input[name*="email"], input[formControlName="email"]').fill(employeeData.email);

    // Fill required fields
    const phoneNumber = page.getByPlaceholder(/phone/i).or(page.getByLabel(/phone/i)).or(page.locator('input[formControlName="phoneNumber"]'));
    await phoneNumber.fill(employeeData.phoneNumber);

    const dateOfBirth = page.getByPlaceholder(/date.*birth/i).or(page.getByLabel(/date.*birth/i)).or(page.locator('input[formControlName="dateOfBirth"]'));
    await dateOfBirth.fill(employeeData.dateOfBirth);

    // Select required Department
    const departmentSelect = page.locator('mat-select[formControlName="departmentId"], select[name*="department"]');
    if (await departmentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await departmentSelect.click();
      await page.waitForTimeout(500);
      const firstDepartmentOption = page.locator('mat-option, option').first();
      await firstDepartmentOption.click();
      await page.waitForTimeout(300);
    }

    // Assign to the position we created
    const positionSelect = page.locator('mat-select[formControlName*="position"], select[name*="position"]');

    if (await positionSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await positionSelect.click();
      await page.waitForTimeout(500);

      // Look for our created position
      const positionOptions = page.locator('mat-option, option');
      const optionCount = await positionOptions.count();

      if (optionCount > 0) {
        // Select last option (most recent position)
        await positionOptions.last().click();
        await page.waitForTimeout(500);
      }
    }

    // Submit employee
    const submitEmployeeButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitEmployeeButton.first().click();

    // Wait for navigation or success notification (increased timeout)
    await page.waitForTimeout(5000);

    // Verify creation
    const employeeSuccess = page.locator('mat-snack-bar, .toast, .notification, .snackbar').filter({ hasText: /success|created|saved/i });
    const hasEmployeeSuccess = await employeeSuccess.isVisible({ timeout: 5000 }).catch(() => false);
    const leftCreatePage = !page.url().includes('create');

    expect(hasEmployeeSuccess || leftCreatePage).toBe(true);

    // Step 6: Verify all relationships
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Search for the employee we created
    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill(employeeData.lastName);
      await page.waitForTimeout(1500);
    }

    const employeeRow = page.locator('tr, mat-row').filter({ hasText: new RegExp(employeeData.lastName, 'i') }).first();

    if (await employeeRow.isVisible({ timeout: 3000 })) {
      // Click to view details
      await employeeRow.click();
      await page.waitForTimeout(2000);

      // Verify employee details are correct
      const nameField = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
      const currentName = await nameField.inputValue();
      expect(currentName).toBe(employeeData.firstName);

      // Verify position is assigned (if visible)
      const positionField = page.locator('mat-select[formControlName*="position"], select[name*="position"]');
      if (await positionField.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Position should be selected
        const positionValue = await positionField.textContent();
        expect(positionValue).toBeTruthy();
      }
    }

    // Step 7: Logout
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

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

  test('should delete records as HRAdmin', async ({ page }) => {
    // Login as HRAdmin
    await loginAsRole(page, 'hradmin');

    // Navigate to employees
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Create test employee to delete
    const createButton = page.locator('button').filter({ hasText: /create|add.*employee|new/i });
    await createButton.first().click();
    await page.waitForTimeout(1000);

    const employeeData = createEmployeeData({
      firstName: 'ToDelete',
      lastName: `Admin${Date.now()}`,
      email: `todelete.${Date.now()}@example.com`,
    });

    const firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    const lastNameInput = page.locator('input[name*="lastName"], input[formControlName="lastName"]');
    const emailInput = page.locator('input[name*="email"], input[formControlName="email"]');

    await firstNameInput.fill(employeeData.firstName);
    await lastNameInput.fill(employeeData.lastName);
    await emailInput.fill(employeeData.email);

    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i });
    await submitButton.first().click();

    await page.waitForTimeout(2000);

    // Navigate back to list and delete
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"], input[name*="search"]');
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill(employeeData.lastName);
      await page.waitForTimeout(1500);
    }

    const employeeRow = page.locator('tr, mat-row').filter({ hasText: new RegExp(employeeData.lastName, 'i') }).first();

    if (await employeeRow.isVisible({ timeout: 3000 })) {
      const deleteButton = employeeRow.locator('button').filter({ hasText: /delete/i }).first();

      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        await page.waitForTimeout(1000);

        // Confirm deletion
        const confirmButton = page.locator('button').filter({ hasText: /yes|confirm|delete/i });
        await confirmButton.last().click();

        await page.waitForTimeout(2000);

        // Verify deletion success
        const deleteSuccess = page.locator('mat-snack-bar, .toast, .notification').filter({ hasText: /success|deleted/i });
        const hasDeleteSuccess = await deleteSuccess.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasDeleteSuccess).toBe(true);
      }
    }
  });

  test('should manage all modules as HRAdmin', async ({ page }) => {
    // Login as HRAdmin
    await loginAsRole(page, 'hradmin');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify access to all modules
    const modules = [
      { name: 'employees', path: '/employees' },
      { name: 'departments', path: '/departments' },
      { name: 'positions', path: '/positions' },
      { name: 'salary-ranges', path: '/salary-ranges' },
    ];

    for (const module of modules) {
      await page.goto(module.path);
      await page.waitForLoadState('networkidle');

      // Verify page loads without access denied
      const accessDenied = await page.locator('text=/access.*denied|forbidden|unauthorized/i').isVisible({ timeout: 2000 }).catch(() => false);
      const hasTable = await page.locator('table, mat-table').isVisible({ timeout: 3000 }).catch(() => false);

      // Should either have table or be on valid page (not access denied)
      expect(!accessDenied || hasTable).toBe(true);
    }
  });
});

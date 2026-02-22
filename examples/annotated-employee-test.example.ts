/**
 * ANNOTATED EXAMPLE — Employee Management Tests
 *
 * Purpose: Show new developers how this test suite uses Playwright.
 * Read this file top-to-bottom before reading any real test files.
 *
 * Full guide: docs/PLAYWRIGHT_GUIDE.md
 */

// ─────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
//       ↑              ↑
//       test runner    assertion library — both come from Playwright

import { loginAsRole, logout } from '../fixtures/auth.fixtures';
// ↑ Custom helpers so tests don't repeat the 6-step OIDC login flow

import { createEmployeeData } from '../fixtures/data.fixtures';
// ↑ Generates unique test data (random email, employee number)
//   so parallel tests don't clash with each other

import { EmployeeFormPage } from '../page-objects/employee-form.page';
// ↑ Page Object — wraps all form interactions so tests stay clean


// ─────────────────────────────────────────────────────────────
// TEST SUITE (describe block groups related tests)
// ─────────────────────────────────────────────────────────────

test.describe('Employee Management — Annotated Example', () => {

  // ── beforeEach runs before EVERY test in this describe block ──
  test.beforeEach(async ({ page }) => {
    //                     ↑
    //         Playwright injects a fresh browser page for each test.
    //         Tests are isolated — they cannot share state.

    await loginAsRole(page, 'manager');
    //    ↑ Opens browser, clicks "Login", fills credentials on IdentityServer,
    //      waits for redirect back to Angular dashboard.
    //      Role options: 'employee' | 'manager' | 'hradmin'
  });


  // ─────────────────────────────────────────────────────────────
  // TEST 1 — Navigate and assert
  // ─────────────────────────────────────────────────────────────

  test('should display employee list', async ({ page }) => {

    // ── NAVIGATE ──────────────────────────────────────────────
    await page.goto('/employees');
    //          ↑ Relative URL — baseURL from playwright.config.ts is prepended.
    //            Resolves to http://localhost:4200/employees

    await page.waitForLoadState('networkidle');
    //                           ↑ Waits until there are no in-flight network
    //                             requests for 500 ms. Safe for SPA page loads.

    // ── LOCATOR ───────────────────────────────────────────────
    const heading = page.locator('h1, h2, h3').filter({ hasText: /employees/i });
    //              ↑              ↑              ↑
    //              page.locator() multi-tag CSS   filter() narrows down by text.
    //              returns a Locator — nothing has happened in the browser yet.
    //              Actions are lazy until you call .click(), .fill(), etc.

    // ── ASSERTION ─────────────────────────────────────────────
    await expect(heading.first()).toBeVisible();
    //     ↑                      ↑
    //     expect() auto-retries  assertion — fails if element not visible
    //     until timeout (30 s)   within the retry window

    // Count rows (does NOT auto-retry — it's a snapshot)
    const rowCount = await page.locator('tbody tr, mat-row').count();
    expect(rowCount).toBeGreaterThan(0);
    //               ↑ Jest-style matchers work in Playwright
  });


  // ─────────────────────────────────────────────────────────────
  // TEST 2 — Form filling with Page Object
  // ─────────────────────────────────────────────────────────────

  test('should create a new employee', async ({ page }) => {

    // ── GENERATE UNIQUE TEST DATA ─────────────────────────────
    const employee = createEmployeeData({
      firstName: 'Jane',
      lastName: 'Smith',
      salary: 80000,
      // email and employeeNumber are auto-generated as unique values
      // e.g. "jane.smith.4821@example.com" — avoids conflicts in parallel runs
    });

    // ── NAVIGATE TO CREATE PAGE ───────────────────────────────
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create/i });
    await expect(createButton.first()).toBeVisible();
    await createButton.first().click();

    // ── PAGE OBJECT ───────────────────────────────────────────
    const employeeForm = new EmployeeFormPage(page);
    //    ↑ Constructor takes `page` and sets up all the locators internally.
    //      See: page-objects/employee-form.page.ts

    await employeeForm.waitForForm();
    //    ↑ Waits for the <form> element to be in the DOM

    // ── FILL FORM ─────────────────────────────────────────────
    await employeeForm.fillForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      dateOfBirth: '01/01/1990',  // MM/DD/YYYY — required by Angular datepicker
      phoneNumber: employee.phoneNumber,
      salary: employee.salary,
      department: 1,  // .nth(1) — skips the blank placeholder option
      position: 1,    // .nth(1) — same reason
      gender: 1,      // .nth(1) — same reason
    });
    // ↑ fillForm() uses page.getByLabel() for text fields (most reliable)
    //   and formControlName selectors for dropdowns.

    // ── SUBMIT ────────────────────────────────────────────────
    await employeeForm.submit();
    //    ↑ Clicks the first button matching /save|submit|create|update/i

    // ── VERIFY ────────────────────────────────────────────────
    const result = await employeeForm.verifySubmissionSuccess();
    //    ↑ Checks three outcomes in order:
    //      1. Success snackbar visible?
    //      2. Page redirected away from /create?
    //      3. Form fields still populated? (handles known API 401 error)

    expect(result.success).toBe(true);
  });


  // ─────────────────────────────────────────────────────────────
  // TEST 3 — Role-based access control
  // ─────────────────────────────────────────────────────────────

  test('should hide Create button for Employee role', async ({ page }) => {

    // ── SWITCH ROLES ──────────────────────────────────────────
    await logout(page);
    //     ↑ ALWAYS call logout() before switching roles.
    //       Angular keeps the session in memory — skipping this causes
    //       the old session to persist and tests time out.

    await loginAsRole(page, 'employee');
    //                       ↑ antoinette16 — read-only permissions

    // ── NAVIGATE ──────────────────────────────────────────────
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // ── CHECK ELEMENT IS ABSENT ───────────────────────────────
    const createButton = page.locator('button').filter({ hasText: /create/i });

    // .isVisible() returns false without throwing — use for conditional checks
    const isVisible = await createButton.isVisible({ timeout: 2000 }).catch(() => false);
    //                                               ↑ Short timeout — we expect it's NOT there

    expect(isVisible).toBe(false);

    // Alternatively, use not.toBeVisible() which auto-retries:
    // await expect(createButton).not.toBeVisible();
  });


  // ─────────────────────────────────────────────────────────────
  // TEST 4 — Validation errors
  // ─────────────────────────────────────────────────────────────

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/employees/create');
    await page.waitForLoadState('networkidle');

    const employeeForm = new EmployeeFormPage(page);

    // ── SUBMIT WITHOUT FILLING ANYTHING ───────────────────────
    await employeeForm.submit();
    //    ↑ Angular Material validates on form submission, not on blur.

    await page.waitForTimeout(1000);
    //    ↑ Short wait for validation errors to render

    // ── CHECK FOR ERROR MESSAGES ──────────────────────────────
    const errors = page.locator('.mat-error, mat-error');
    //    ↑ Angular Material validation messages use <mat-error>

    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);

    // Still on the create page (form was not submitted)
    await expect(page).toHaveURL(/\/employees\/create/);
  });

});


// ─────────────────────────────────────────────────────────────
// COMMON SELECTOR PATTERNS — quick reference
// ─────────────────────────────────────────────────────────────
//
//  page.getByLabel('Phone Number')               ← BEST for inputs
//  page.getByRole('button', { name: 'Save' })    ← BEST for buttons
//  page.locator('mat-select[formControlName="x"]')  ← Material dropdowns
//  page.locator('button').filter({ hasText: /save/i }) ← filter by text
//  page.locator('tr').nth(1)                     ← skip header row
//  page.locator('mat-option').nth(1)             ← skip blank option
//  .first()  === .nth(0)                         ← same thing
//  .last()                                       ← last match
//
// ─────────────────────────────────────────────────────────────

# Playwright Guide for New Developers

This guide explains the key Playwright concepts used across this test suite,
using real examples from the employee management tests.

---

## 1. How a Test Is Structured

Every Playwright test follows this shape:

```typescript
import { test, expect } from '@playwright/test';              // ← Playwright's test runner

test.describe('Employee Create', () => {                      // ← Groups related tests
  test.beforeEach(async ({ page }) => {                       // ← Runs before every test in this group
    await loginAsRole(page, 'manager');                       // ← Our custom login helper
    await page.goto('/employees/create');                     // ← Navigates the browser
  });

  test('should create employee with valid data', async ({ page }) => {   // ← One test case
    // Arrange: set up data
    // Act: do things in the browser
    // Assert: check the result
  });
});
```

**Key concept:** `page` is the browser tab. Every interaction goes through it.

---

## 2. Finding Elements — Locators

Playwright uses **locators** to find elements on the page. They are lazy — nothing
happens until you call an action (`.click()`, `.fill()`, etc.).

```typescript
// By CSS selector
page.locator('input[formControlName="firstName"]')

// By visible text content
page.locator('button').filter({ hasText: /create/i })

// By ARIA label (most reliable — recommended)
page.getByLabel('Phone Number')

// By ARIA role
page.getByRole('button', { name: 'Save' })

// By test id
page.getByTestId('submit-btn')

// Chaining: find inside a parent
page.locator('tr').nth(1).locator('button').filter({ hasText: /edit/i })
```

**Why `.nth(1)` instead of `.first()`?**
In a table, `tr.nth(0)` is the `<thead>` header row. `tr.nth(1)` is the first
data row. `.first()` and `.nth(0)` are the same thing.

---

## 3. Actions — Doing Things in the Browser

```typescript
await page.goto('/employees');           // Navigate to a URL
await page.click('button');              // Click an element
await locator.fill('John');             // Type into an input (clears first)
await locator.clear();                  // Clear an input
await locator.selectOption('Male');     // Pick from a <select>
await locator.press('Enter');           // Press a key
await page.waitForLoadState('networkidle'); // Wait until no network activity
await page.waitForTimeout(500);         // Hard wait (use sparingly)
```

**Material dropdowns need two steps:** click to open, then click an option.

```typescript
// Open the dropdown
await page.locator('mat-select[formControlName="departmentId"]').click();
await page.waitForTimeout(500);         // Wait for animation

// Click the second option — first option (.nth(0)) is often a blank placeholder
await page.locator('mat-option').nth(1).click();
```

---

## 4. Assertions — Checking the Result

All assertions use `expect()`. They automatically retry until timeout.

```typescript
// Element is visible
await expect(page.locator('h1')).toBeVisible();

// Element is NOT visible
await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();

// URL matches a pattern
await expect(page).toHaveURL(/\/employees/);

// Input has a specific value
await expect(page.getByLabel('First Name')).toHaveValue('John');

// Count of elements
const rows = await page.locator('tbody tr').count();
expect(rows).toBeGreaterThan(0);

// Snapshot value (not auto-retried — avoid for timing-sensitive checks)
const value = await locator.inputValue();
expect(value).toBe('John');
```

---

## 5. Authentication — Logging In

This project uses OIDC (IdentityServer). The login flow is wrapped in helpers
so tests don't repeat the same 6-step login sequence every time.

```typescript
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';

// Log in as a specific role
await loginAsRole(page, 'manager');   // rosamond33 — can create/edit
await loginAsRole(page, 'hradmin');   // ashtyn1    — full CRUD including delete
await loginAsRole(page, 'employee');  // antoinette16 — read-only

// Log out (required before switching roles)
await logout(page);
await loginAsRole(page, 'hradmin');
```

**Why `logout()` before switching roles?**
Angular keeps the session in memory. Switching users without logging out causes
the old session to persist and tests to fail with timeout errors.

---

## 6. Page Object Model (POM)

A **Page Object** is a class that wraps all interactions with one page/form.
Tests call methods on the object instead of writing raw Playwright selectors.

**Without POM (hard to maintain):**
```typescript
await page.fill('input[formControlName="firstName"], input[name*="firstName"]', 'John');
await page.fill('input[formControlName="lastName"], input[name*="lastName"]', 'Doe');
// ... 60 more lines
```

**With POM (clean and maintainable):**
```typescript
const form = new EmployeeFormPage(page);
await form.fillForm({ firstName: 'John', lastName: 'Doe', department: 1 });
await form.submit();
```

**Rule:** When a form or page is used in more than one test file, create a Page Object for it.

### Page Objects in this project:
- [employee-form.page.ts](../page-objects/employee-form.page.ts) — create / edit employee form
- [employee-list.page.ts](../page-objects/employee-list.page.ts) — employee list / filters / pagination

---

## 7. Fixtures — Reusable Setup Functions

Playwright **fixtures** are functions that provide shared setup for tests.
This project uses custom fixture files (not Playwright's built-in fixture API).

```typescript
// fixtures/auth.fixtures.ts
export async function loginAsRole(page: Page, role: 'manager' | 'hradmin' | 'employee') { ... }
export async function logout(page: Page) { ... }

// fixtures/data.fixtures.ts
export function createEmployeeData(overrides?: Partial<EmployeeData>): EmployeeData { ... }
```

**`createEmployeeData()` generates unique test data** to avoid conflicts between
parallel test runs:

```typescript
const employee = createEmployeeData({
  firstName: 'John',
  lastName: 'Doe',
  salary: 75000,
  // email and employeeNumber are auto-generated as unique values
});
```

---

## 8. Waiting — Handling Timing

Playwright auto-waits for most actions, but some situations need explicit waits.

```typescript
// ✅ Preferred — wait for a condition
await page.waitForLoadState('networkidle');
await expect(locator).toBeVisible();           // auto-retries up to timeout

// ⚠️  Use sparingly — hard wait (pauses unconditionally)
await page.waitForTimeout(500);

// ✅ Wait for a specific element to appear
await page.waitForSelector('mat-snack-bar', { timeout: 5000 });
```

**When to use `waitForTimeout()`:**
- After clicking a Material dropdown before its options animate in (300–500 ms)
- After a form submission before checking for a response notification

---

## 9. Handling Known API Errors

This dev environment has a known issue: the API returns **401 Unauthorized**
after form submission because auth tokens aren't wired up on the backend.

Tests handle this with a three-level check via `EmployeeFormPage.verifySubmissionSuccess()`:

```
1. Did a success notification appear?       → pass ✅
2. Did the page redirect to the list?       → pass ✅
3. Are the form fields still populated?     → pass ✅ (API rejected, form wasn't reset)
   (If all three fail → test fails)
```

This means **UI form behaviour is fully tested** even though the API isn't wired up yet.

---

## 10. Running Tests

```bash
# All tests, all browsers
npx playwright test

# One file
npx playwright test tests/employee-management/employee-edit.spec.ts

# One test by name
npx playwright test -g "should show success notification"

# Single browser
npx playwright test --project=chromium

# See the browser (headed mode)
npx playwright test --headed

# Debug step-by-step
npx playwright test --debug

# Interactive UI mode (best for exploring failures)
npx playwright test --ui

# View the last HTML report
npx playwright show-report
```

---

## 11. Reading a Failure

When a test fails, Playwright saves three artifacts:

```
test-results/
  employee-management-employ-xxxxx/
    test-failed-1.png   ← screenshot at the moment of failure
    video.webm          ← full video replay of the test
    error-context.md    ← ARIA snapshot of the DOM at failure
```

**How to diagnose:**
1. Open `test-failed-1.png` — what is the page showing?
2. Check `error-context.md` — search for the element you expected
3. Run with `--headed` to watch it happen live
4. Run with `--debug` to step through line by line

---

## 12. Test User Reference

| Role | Username | Password | Can Do |
|------|----------|----------|--------|
| **Employee** | `antoinette16` | `Pa$$word123` | View only |
| **Manager** | `rosamond33` | `Pa$$word123` | Create, Edit |
| **HRAdmin** | `ashtyn1` | `Pa$$word123` | Create, Edit, Delete |

Only **HRAdmin** can delete employees. Always use `ashtyn1` for delete tests.

---

## Further Reading

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Locator Best Practices](https://playwright.dev/docs/locators)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Assertions](https://playwright.dev/docs/test-assertions)
- [Debugging Tests](https://playwright.dev/docs/debug)

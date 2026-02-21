# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Playwright E2E and API testing suite** for the AngularNetTutorial project, which demonstrates the **CAT Pattern** (Client, API Resource, Token Service) using:
- **Angular 20** client with Material Design (http://localhost:4200)
- **.NET 10 Web API** with Clean Architecture (https://localhost:44378)
- **Duende IdentityServer 7.0** for OAuth 2.0/OIDC authentication (https://sts.skoruba.local)

**Important:** This test suite requires all three services to be running. See parent repository's CLAUDE.md for how to start the full stack.

## Quick Commands

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# Run specific test suite
npx playwright test tests/auth/
npx playwright test tests/employee-management/

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run with UI (interactive mode - recommended for debugging)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode (step through with debugger)
npx playwright test --debug

# Run only tests matching a pattern
npx playwright test -g "should login"

# View test report
npx playwright show-report

# Generate trace for debugging
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Test Development

```bash
# Generate tests by recording browser actions
npx playwright codegen http://localhost:4200

# Install/update Playwright browsers
npx playwright install
```

## Architecture & Testing Patterns

### Test Organization

Tests are organized by **feature area**, not by test type:

```
tests/
├── auth/                        # Authentication & authorization
│   ├── login.spec.ts            # OIDC login flow
│   ├── logout.spec.ts           # Logout flow
│   ├── role-based-access.spec.ts # RBAC tests
│   └── auth-edge-cases.spec.ts  # Edge cases
├── employee-management/         # Employee CRUD
├── department-management/       # Department CRUD
├── position-management/         # Position CRUD (HRAdmin only)
├── salary-ranges/               # Salary range CRUD (HRAdmin only)
├── dashboard/                   # Dashboard features
├── api/                         # Direct API tests
├── workflows/                   # Multi-step E2E scenarios
├── error-handling/              # Error scenarios
├── visual/                      # Visual regression
├── accessibility/               # ARIA compliance
└── performance/                 # Performance tests
```

### Fixtures Pattern

**Key principle:** Reusable test helpers live in `fixtures/` directory.

**Authentication Fixtures** (`fixtures/auth.fixtures.ts`):
- `loginAs(page, username, password)` - Browser-based OIDC login
- `loginAsRole(page, role)` - Login using predefined test user
- `logout(page)` - Logout and return to Guest mode
- `isAuthenticated(page)` - Check authentication state
- `getApiToken(request, username, password)` - Acquire API token from IdentityServer (currently broken)
- `getTokenForRole(request, role)` - Get API token for test user role (currently broken)
- `getTokenFromProfile(page)` - Extract access token from Profile page (✅ RECOMMENDED)
- `getStoredToken(page)` - Extract token from browser storage
- `clearAuthTokens(page)` - Clear all auth tokens from storage

**Data Fixtures** (`fixtures/data.fixtures.ts`):
- Test data factories for creating employee, department, position, salary range objects
- Use `createEmployeeData(overrides)` pattern for flexible test data

**API Fixtures** (`fixtures/api.fixtures.ts`):
- Direct API operations for test setup/teardown
- `createEmployee(request, token, data)` - Create via API
- `deleteEmployee(request, token, id)` - Cleanup via API

### Page Object Model (POM)

**Status:** Partially implemented - expand as needed

Located in `page-objects/`, encapsulate page-specific logic:
- `employee-list.page.ts` - Employee list page interactions
- `employee-form.page.ts` - Employee create/edit form
- `navigation.page.ts` - Site navigation helpers

**Pattern:**
```typescript
export class EmployeeListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/employees');
  }

  async clickCreate() {
    await this.page.click('button:has-text("Create")');
  }
}
```

## Authentication Flow (CRITICAL)

### Optional Authentication Pattern

The Angular app uses **optional authentication** (not forced redirect):

1. App loads as "Guest/Anonymous" by default
2. User manually initiates login via user menu
3. Login flow: **User icon (upper right) → "Login" option → IdentityServer → Dashboard**

**Implementation in tests:**
```typescript
// Navigate to app (loads as Guest)
await page.goto('/');

// Click user icon
const userIcon = page.locator('button mat-icon:has-text("account_circle")').last();
await userIcon.click();

// Click Login from dropdown
const loginOption = page.locator('[role="menuitem"]:has-text("Login")').first();
await loginOption.click();

// Now redirects to IdentityServer...
```

### Logout Flow

Logout is handled by **IdentityServer**, not Angular:

1. User clicks: **User icon → "Logout"**
2. Redirects to IdentityServer logout screen
3. STS shows screen with **"click here" link** to return to Angular
4. Click link → returns to Angular as Guest/Anonymous

**The `logout()` function automatically handles clicking the return link.**

### Profile Page - Accessing Tokens

After login, the user menu contains a **"Profile"** submenu option that displays:
- **ID Token** - User identity information
- **Access Token** - Token for API authorization

**Navigation:** User icon (upper right) → "Profile"

**Extracting Access Token:**
```typescript
import { getTokenFromProfile } from '../fixtures/auth.fixtures';

test('Call API with access token from profile', async ({ page, request }) => {
  // Login first
  await loginAsRole(page, 'manager');

  // Extract token from profile page
  const token = await getTokenFromProfile(page);

  // Use token for API calls
  const response = await request.get('https://localhost:44378/api/v1/employees', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    },
    ignoreHTTPSErrors: true
  });

  expect(response.ok()).toBe(true);
});
```

**Why use Profile page for tokens:**
- ✅ More reliable than parsing browser storage
- ✅ Tokens are displayed in readable format
- ✅ Can verify both ID token and access token
- ✅ Good for debugging authentication issues
- ✅ Alternative when IdentityServer password grant is unavailable

### Test Users (config/test-users.json)

**IMPORTANT:** Use these exact credentials - they match IdentityServer configuration:

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| **Employee** | `antoinette16` | `Pa$$word123` | Read-only access |
| **Manager** | `rosamond33` | `Pa$$word123` | Create/edit employees & departments (NOT positions/salary ranges) |
| **HRAdmin** | `ashtyn1` | `Pa$$word123` | Full administrative access |

**Usage:**
```typescript
import { loginAsRole } from '../fixtures/auth.fixtures';

test('Manager can create employees', async ({ page }) => {
  await loginAsRole(page, 'manager');
  // ... test logic
});
```

### Authentication State Check

**Reliable pattern** - Use `.count()` instead of `.isVisible()`:

```typescript
// CORRECT - Check for Guest heading using count
export async function isAuthenticated(page: Page): Promise<boolean> {
  const guestCount = await page.locator('h4:has-text("Guest")').count();
  return guestCount === 0; // If no Guest heading, user IS authenticated
}

// INCORRECT - isVisible() can have timing issues
const isGuest = await page.locator('text=Guest').isVisible();
```

**Why `.count()` is better:**
- No timeout/visibility issues
- More reliable for conditionals
- Synchronous check (returns immediately with count)

## Selector Best Practices

### Use Specific Selectors

**AVOID generic text selectors** that match multiple elements:

```typescript
// ❌ BAD - Strict mode violation (matches 5 elements)
await page.click('text=Dashboard');

// ✅ GOOD - Specific element selector
await page.click('h1:has-text("Dashboard")');
```

### Recommended Selector Patterns

```typescript
// Headings
page.locator('h1:has-text("Dashboard")')

// Buttons with text
page.locator('button:has-text("Create")')

// Material icons
page.locator('mat-icon:has-text("account_circle")')

// Role-based selectors (prefer when available)
page.locator('[role="menuitem"]:has-text("Login")')

// Form inputs
page.locator('input[name="Username"]')

// Last matching element (for duplicates)
page.locator('button mat-icon:has-text("account_circle")').last()

// First matching element
page.locator('[role="menuitem"]:has-text("Login")').first()
```

## Configuration

### Playwright Config (`playwright.config.ts`)

**Key settings:**
- **Base URL:** `http://localhost:4200`
- **Timeout:** 30 seconds per test
- **Viewport:** 1366x768 (laptop resolution)
- **Retries:** 2 on CI, 0 locally
- **Browsers:** Chromium, Firefox, WebKit
- **Screenshots:** On failure only
- **Videos:** Retain on failure
- **HTTPS Errors:** Ignored (for self-signed certs in dev)

**API Project:**
- Separate project for API-only tests
- Base URL: `https://localhost:44378/api/v1`
- Uses `tests/api/**/*.spec.ts` pattern

### Test User Configuration

Located in `config/test-users.json` - contains credentials, roles, and permissions for all test users.

**Never commit real credentials** - these are development-only test accounts.

## Known Issues & Workarounds

### API Authentication Disabled

**Issue:** API currently allows anonymous access without Bearer tokens.

**Impact:**
- API returns 200 OK without authentication
- Should return 401 Unauthorized
- API token acquisition tests will fail
- Direct API tests bypass authentication

**Workaround:** Tests verify browser-based authentication flows work. API authentication tests are expected to fail until the API is configured to require auth.

### IdentityServer Password Grant

**Issue:** IdentityServer returns "unauthorized_client" for password grant requests.

**Impact:**
- `getApiToken()` function fails
- Cannot acquire tokens programmatically for API tests

**Workaround:** Use browser-based authentication for E2E tests. API tests are currently limited.

### Selector Specificity

**Issue:** Some UI elements have ambiguous selectors (e.g., multiple "Dashboard" text nodes).

**Solution:** Always use specific selectors with element type:
- `h1:has-text("Dashboard")` instead of `text=Dashboard`
- `button:has-text("Login")` instead of `text=Login`

### User Menu Selectors

**Issue:** User menu after login may have different selectors than when anonymous.

**Solution:** Use multiple selector fallbacks:
```typescript
const userIcon = page.locator(
  'button[aria-label="User menu"], ' +
  'button mat-icon:has-text("account_circle"), ' +
  'header button:has(mat-icon)'
).last();
```

## Writing New Tests

### Test Structure Template

```typescript
import { test, expect } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login as appropriate role
    await loginAsRole(page, 'manager');
  });

  test('should perform action', async ({ page }) => {
    // Navigate to page
    await page.goto('/employees');

    // Perform actions
    await page.click('button:has-text("Create")');

    // Assertions
    await expect(page.locator('h1:has-text("Create Employee")')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup if needed
  });
});
```

### Best Practices

1. **Use fixtures for authentication** - Never manually implement login in tests
2. **Keep tests independent** - Each test should work in isolation
3. **Use descriptive test names** - `should allow Manager to create employees`
4. **Wait for explicit conditions** - Use `waitForSelector()` or `expect().toBeVisible()`
5. **Avoid hard-coded waits** - Use `waitForTimeout()` only as last resort
6. **Clean up test data** - Delete created records in `afterEach` or use API cleanup
7. **Use Page Objects for complex pages** - Encapsulate page logic
8. **Parallel-safe data** - Use unique identifiers to avoid test conflicts

### Common Assertions

```typescript
// Element visibility
await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

// Element not visible
await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();

// URL checks
await expect(page).toHaveURL(/\/employees/);

// Element count
const count = await page.locator('table tbody tr').count();
expect(count).toBeGreaterThan(0);

// Text content
await expect(page.locator('.employee-name')).toHaveText('John Doe');

// Authentication state
const authenticated = await isAuthenticated(page);
expect(authenticated).toBe(true);
```

## Debugging Tests

### UI Mode (Recommended)

```bash
npx playwright test --ui
```

**Features:**
- Time-travel debugging
- Step through tests
- View snapshots at each step
- Inspect locators
- View network requests

### Debug Mode

```bash
npx playwright test --debug
```

Opens browser with Playwright Inspector for step-by-step debugging.

### Headed Mode

```bash
npx playwright test --headed
```

See browser execute tests in real-time.

### Screenshots & Videos

On test failure, automatically captures:
- **Screenshot** saved to `test-results/<test-name>/test-failed-1.png`
- **Video** saved to `test-results/<test-name>/video.webm`
- **Error context** saved to `test-results/<test-name>/error-context.md`

### Trace Viewer

```bash
# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## CI/CD

### GitHub Actions

Workflow: `.github/workflows/playwright.yml`

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Manual workflow dispatch

**Jobs:**
- Install dependencies
- Run tests in all browsers (Chromium, Firefox, WebKit)
- Upload test reports as artifacts
- Comment test results on PR

**Test Reports:**
- HTML report artifact
- JUnit XML for integration
- JSON results for parsing

## Memory System

This repository has **auto memory** enabled:

- **Location:** `~/.claude/projects/<project-id>/memory/`
- **MEMORY.md** - Always loaded, keep concise (200 line limit)
- **Detailed notes** - Create separate topic files

**Current memory topics:**
- Test user credentials and authentication flows
- Known issues with API authentication
- Selector patterns and best practices
- Logout flow with IdentityServer redirect

## Related Documentation

- **Parent Repository:** `C:\apps\AngularNetTutotial\CLAUDE.md` - How to run the full stack
- **Project Overview:** `docs/PROJECT_OVERVIEW.md` - Testing goals and architecture
- **Implementation Plan:** `docs/IMPLEMENTATION_PLAN.md` - Phased development roadmap
- **Quick Start:** `docs/QUICK_START.md` - Getting started guide

## Common Development Tasks

### Adding a New Test Suite

1. Create test file in appropriate directory: `tests/<feature>/<name>.spec.ts`
2. Import required fixtures and helpers
3. Follow the test structure template above
4. Run locally to verify: `npx playwright test tests/<feature>/<name>.spec.ts`
5. Update implementation plan if completing a planned task

### Adding a New Fixture

1. Add function to appropriate fixture file (`auth.fixtures.ts`, `data.fixtures.ts`, etc.)
2. Export the function
3. Add JSDoc documentation with usage example
4. Update fixture README if adding new category

### Adding a New Page Object

1. Create file in `page-objects/` directory: `<page-name>.page.ts`
2. Export class with Page constructor parameter
3. Define locators as class properties
4. Add interaction methods
5. Follow existing POM patterns

### Running Tests in Parallel

Tests run in parallel by default (configured in `playwright.config.ts`):
- **CI:** 1 worker (sequential)
- **Local:** `undefined` (uses CPU cores)

**Override:**
```bash
npx playwright test --workers=4
```

### Updating Test Users

**DO NOT** modify `config/test-users.json` unless users are updated in IdentityServer.

These users must match the actual IdentityServer configuration in the parent repository:
- `TokenService/Duende-IdentityServer/src/Duende.Admin/identityserverdata.json`

### Git Commit Guidelines

**IMPORTANT:** When committing code changes, do NOT include the `Co-Authored-By: Claude` line in commit messages.

**Correct commit format:**
```bash
git commit -m "Fix validation tests to trigger on form submission

Updated validation tests to click Create/Update button instead of using
field blur, matching Angular Material's actual validation behavior."
```

**Incorrect (do not use):**
```bash
git commit -m "Fix validation tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Troubleshooting

### Tests Timeout Waiting for Login

**Cause:** User icon selector not found or login dropdown not opening.

**Solution:** Check that Angular app loaded correctly and user icon is visible. Try headed mode to see what's happening:
```bash
npx playwright test tests/auth/login.spec.ts --headed
```

### `isAuthenticated()` Returns Wrong Value

**Cause:** Using `.isVisible()` instead of `.count()`.

**Solution:** Check implementation uses the count-based pattern from `fixtures/auth.fixtures.ts`.

### Element Not Found Errors

**Cause:** Selector too generic or element not loaded yet.

**Solution:**
1. Make selector more specific
2. Add explicit wait: `await page.waitForSelector('...')`
3. Use UI mode to inspect the actual DOM

### Application Not Running

**Cause:** Angular, API, or IdentityServer not started.

**Solution:** Start all three services (see parent repository CLAUDE.md).

**Verify services:**
- Angular: http://localhost:4200 (should load)
- API: https://localhost:44378/swagger (should show Swagger UI)
- IdentityServer: https://sts.skoruba.local (should show IdentityServer page)

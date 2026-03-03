# Playwright E2E Testing Suite
## AngularNetTutorial - End-to-End & API Testing

Automated testing suite for the AngularNetTutorial CAT Pattern application using [Playwright](https://playwright.dev).

---

## 📖 What is This?

This repository contains **end-to-end (E2E) tests** that verify the entire AngularNetTutorial application works correctly from a user's perspective. Tests simulate real user interactions in a browser—clicking buttons, filling forms, navigating pages—to ensure features work as expected.

### What is Playwright?

[Playwright](https://playwright.dev) is a modern browser automation tool by Microsoft that allows you to:
- Automate web browsers (Chromium, Firefox, WebKit)
- Test web applications like a real user would interact with them
- Run tests in parallel across multiple browsers
- Debug tests with time-travel and visual tools
- Integrate with CI/CD pipelines

### What We Test

- ✅ **Authentication Flows** - Login/logout with IdentityServer (OAuth 2.0/OIDC)
- ✅ **Role-Based Access Control** - Different permissions for Employee, Manager, HRAdmin
- ✅ **CRUD Operations** - Create, read, update, delete employees, departments, positions
- ✅ **Dashboard Features** - Charts, metrics, and data visualization
- ✅ **API Integration** - Direct API endpoint testing
- ✅ **Visual Regression** - Screenshot comparison to detect UI changes
- ✅ **Accessibility** - ARIA compliance and keyboard navigation
- ✅ **Cross-Browser** - Tests run on Chromium, Firefox, and Safari (WebKit)

---

## ⚠️ Important: Prerequisites

### 1. Install Required Tools

Before running tests, you need:

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm 10+** - Included with Node.js
- **Git** - [Download](https://git-scm.com/)

### 2. **CRITICAL: Start All Services FIRST**

**Tests will fail if the application is not running!**

You must start these three services **before** running any tests:

#### Terminal 1: IdentityServer (Authentication)
```bash
cd C:\apps\AngularNetTutotial\TokenService\Duende-IdentityServer\src\Duende.STS.Identity
dotnet run
```
**Wait for:** `Now listening on: https://sts.skoruba.local`

#### Terminal 2: .NET Web API (Backend)
```bash
cd C:\apps\AngularNetTutotial\ApiResources\TalentManagement-API
dotnet run
```
**Wait for:** `Now listening on: https://localhost:44378`

#### Terminal 3: Angular Client (Frontend)
```bash
cd C:\apps\AngularNetTutotial\Clients\TalentManagement-Angular-Material\talent-management
npm start
```
**Wait for:** `Angular Live Development Server is listening on localhost:4200`

**Verify all services are running:**
- Angular: http://localhost:4200 (should show login page)
- API: https://localhost:44378/swagger (should show Swagger UI)
- IdentityServer: https://sts.skoruba.local (should show IdentityServer page)

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd C:\apps\AngularNetTutotial\Tests\AngularNetTutorial-Playwright
npm install
```

### Step 2: Install Playwright Browsers

First-time setup only:

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers for testing.

### Step 3: Run Tests

**Make sure all services are running first!** (See Prerequisites above)

```bash
# Run all tests (headless mode)
npx playwright test

# Run tests and see the browser (headed mode)
npx playwright test --headed

# Run tests with interactive UI (recommended for beginners)
npx playwright test --ui
```

### Step 4: View Test Report

After tests complete:

```bash
npx playwright show-report
```

This opens an HTML report showing which tests passed/failed with screenshots and videos.

---

## 🧪 Running Tests

### Basic Commands

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see browser actions)
npx playwright test --headed

# Run tests in UI mode (interactive debugging - RECOMMENDED)
npx playwright test --ui

# Run tests in debug mode (step-by-step debugger)
npx playwright test --debug
```

### Run Specific Tests

```bash
# Run a specific test file
npx playwright test tests/auth/login.spec.ts

# Run all tests in a folder
npx playwright test tests/employee-management/

# Run tests matching a name pattern
npx playwright test -g "should login successfully"

# Run only failed tests from last run
npx playwright test --last-failed
```

### Run in Different Browsers

```bash
# Run in Chromium (default)
npx playwright test --project=chromium

# Run in Firefox
npx playwright test --project=firefox

# Run in Safari (WebKit)
npx playwright test --project=webkit

# Run in all browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

---

## 🐛 Debugging Tests

Playwright offers several powerful debugging tools:

### 1. UI Mode (Recommended for Beginners)

The **best way** to debug tests interactively:

```bash
npx playwright test --ui
```

**Features:**
- Watch tests run in real-time
- Time-travel debugging (go back to any step)
- Inspect DOM at each step
- View network requests
- Pick specific tests to run
- See screenshots and videos

### 2. Debug Mode (Step-by-Step)

Run tests with the Playwright Inspector:

```bash
npx playwright test --debug
```

**Features:**
- Pause execution at each step
- Step through test line-by-line
- Inspect page elements with selector highlighter
- View console logs
- Execute Playwright commands manually

### 3. Headed Mode (Watch Browser)

See the browser as tests run:

```bash
npx playwright test --headed
```

Good for quickly seeing what's happening without the full debugger.

### 4. Screenshots & Videos

Tests automatically capture screenshots and videos on failure:

```bash
# Screenshots and videos saved to:
test-results/<test-name>/
```

View them in the HTML report:

```bash
npx playwright show-report
```

### 5. Trace Viewer (Advanced)

Record and replay test execution:

```bash
# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

**Features:**
- Complete timeline of test execution
- Network activity
- Console logs
- DOM snapshots at each step
- Screenshots

---

## 📂 Test Organization

Tests are organized by feature area:

```
tests/
├── auth/                       # Login, logout, authentication
├── employee-management/        # Employee CRUD operations
├── department-management/      # Department CRUD
├── position-management/        # Position CRUD (HRAdmin only)
├── salary-ranges/              # Salary range management
├── dashboard/                  # Dashboard features
├── api/                        # Direct API endpoint tests
├── workflows/                  # Multi-step user workflows
├── visual/                     # Visual regression tests
├── accessibility/              # ARIA compliance tests
└── performance/                # Performance tests
```

**Supporting Files:**
- `fixtures/` - Reusable test helpers (login, test data, API calls)
- `page-objects/` - Page Object Models for complex pages
- `config/` - Test users, environment URLs
- `playwright.config.ts` - Playwright configuration

---

## 👥 Test User Accounts

The application has three test users with different permission levels:

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| **Employee** | `antoinette16` | `Pa$$word123` | **Read-only** - Can view data only |
| **Manager** | `rosamond33` | `Pa$$word123` | **Create/Update** - Can create and edit employees & departments (cannot delete) |
| **HRAdmin** | `ashtyn1` | `Pa$$word123` | **Full Access** - Complete CRUD on all entities including positions and salary ranges |

**Note:** These credentials are defined in `config/test-users.json` and match the users configured in IdentityServer.

---

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

Key settings:
- **Base URL:** `http://localhost:4200`
- **Timeout:** 30 seconds per test
- **Retries:** 2 retries on CI, 0 locally
- **Browsers:** Chromium, Firefox, WebKit
- **Screenshots:** Captured on failure
- **Videos:** Recorded on first retry
- **Reporters:** HTML, JSON, JUnit

### Environment URLs (`config/environments.json`)

```json
{
  "development": {
    "angularUrl": "http://localhost:4200",
    "apiUrl": "https://localhost:44378",
    "identityServerUrl": "https://sts.skoruba.local"
  }
}
```

---

## 🐛 Troubleshooting

### Tests Fail with Connection Errors

**Problem:** `net::ERR_CONNECTION_REFUSED` or timeout errors

**Solution:**
1. Verify all three services are running (Angular, API, IdentityServer)
2. Check URLs are accessible:
   - http://localhost:4200
   - https://localhost:44378/swagger
   - https://sts.skoruba.local

### Tests Timeout

**Problem:** Tests fail with `Test timeout of 30000ms exceeded`

**Solution:** Increase timeout in `playwright.config.ts` or for specific tests:

```typescript
// In your test file
test.setTimeout(60000); // 60 seconds
```

### Login Tests Fail

**Problem:** Authentication tests fail

**Possible causes:**
1. IdentityServer not running
2. Wrong test credentials
3. Browser cookies/storage interfering

**Solution:**
1. Restart IdentityServer
2. Verify test users exist in IdentityServer
3. Run tests in UI mode to see what's happening: `npx playwright test --ui`

### Element Not Found Errors

**Problem:** `Element not found` or `Selector not found`

**Solution:**
1. Use UI mode to inspect the page: `npx playwright test --ui`
2. Check if element has loaded: add `await page.waitForSelector('selector')`
3. Verify the selector is correct using Playwright Inspector

### Tests Pass Locally but Fail in CI

**Problem:** Tests work on your machine but fail in GitHub Actions

**Possible causes:**
1. Timing issues (CI is slower)
2. Browser differences
3. Environment variables

**Solution:**
1. Increase timeouts for CI
2. Add explicit waits for elements
3. Check CI logs for specific errors

---

## 📊 Viewing Test Results

### HTML Report (Recommended)

```bash
npx playwright show-report
```

**Shows:**
- ✅ Passed/Failed tests
- ⏱️ Test duration
- 📷 Screenshots on failure
- 🎥 Videos of test execution
- 📋 Error messages and stack traces

### Command Line Output

```bash
npx playwright test
```

Shows real-time test progress with pass/fail indicators.

### CI/CD Reports

Tests run automatically on GitHub Actions when you push code. Results appear in the Actions tab.

---

## 📚 Learn More

### Playwright Documentation
- [Official Docs](https://playwright.dev)
- [Getting Started](https://playwright.dev/docs/intro)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)

### Project Documentation
- [CLAUDE.md](CLAUDE.md) - Complete development guide
- [docs/](docs/) - Additional documentation

### Related Repositories
- [AngularNetTutorial](https://github.com/workcontrolgit/AngularNetTutorial) - Main tutorial repository
- [Angular Client](../Clients/TalentManagement-Angular-Material/) - Frontend application
- [.NET API](../ApiResources/TalentManagement-API/) - Backend API
- [IdentityServer](../TokenService/Duende-IdentityServer/) - Authentication service

---

## 🤝 Contributing

### Writing New Tests

1. Choose the appropriate test folder (e.g., `tests/employee-management/`)
2. Create a new `.spec.ts` file
3. Follow existing test patterns
4. Use fixtures for common operations (login, test data)
5. Run tests locally before committing

### Test Writing Best Practices

- **Keep tests independent** - Each test should work in isolation
- **Use descriptive names** - `test('should allow Manager to create employee', ...)`
- **Use Page Object Models** - For complex pages, create POM in `page-objects/`
- **Use fixtures** - Reuse login, data creation helpers from `fixtures/`
- **Clean up test data** - Delete created records in `afterEach`
- **Avoid hard-coded waits** - Use `waitForSelector()` instead of `waitForTimeout()`

---

## 📞 Support

**Questions?**
- Check [Playwright Documentation](https://playwright.dev)
- Review existing tests for examples
- Open an issue in the repository

---

## 📝 License

This project is part of the AngularNetTutorial repository. See parent repository for license information.

---

**Last Updated:** March 3, 2026
**Playwright Version:** Latest
**Node.js Required:** 20+

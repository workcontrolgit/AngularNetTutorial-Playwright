# Quick Start Guide
## Get Testing in 10 Minutes

---

## ✅ Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Visual Studio Code (recommended)
- [ ] Angular app running at `http://localhost:4200`
- [ ] .NET API running at `https://localhost:44378`
- [ ] IdentityServer running at `https://sts.skoruba.local`

---

## 🚀 Setup Steps

### Step 1: Install Dependencies (2 minutes)

```bash
cd c:\apps\playwright
npm install
```

This installs Playwright and all required packages.

### Step 2: Install Browsers (2 minutes)

```bash
npx playwright install
```

This installs Chromium, Firefox, and WebKit browsers.

### Step 3: Verify Installation (1 minute)

```bash
# Run the existing walkthrough test
npx playwright test tests/TalentManagement.spec.ts --headed
```

You should see:
- Browser opens
- Voice narration plays
- Test navigates through the app
- Test completes successfully

---

## 📝 Your First Test

### Create a Simple Login Test

**File:** `tests/auth/login-simple.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('User can login successfully', async ({ page }) => {
  // Navigate to app (redirects to IdentityServer)
  await page.goto('http://localhost:4200');

  // Fill login form
  await page.fill('input[name="Username"]', 'ashtyn1');
  await page.fill('input[name="Password"]', 'Pa$$word123');

  // Submit
  await page.click('button:has-text("Login")');

  // Wait for redirect back to app
  await page.waitForURL('http://localhost:4200/dashboard');

  // Verify we're logged in
  await expect(page.locator('text=Dashboard')).toBeVisible();
});
```

### Run Your Test

```bash
npx playwright test tests/auth/login-simple.spec.ts --headed
```

---

## 🎯 Common Commands

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in UI mode (interactive)
npx playwright test --ui

# Run tests in debug mode
npx playwright test --debug

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Reports & Debugging

```bash
# Show last test report
npx playwright show-report

# Generate trace for debugging
npx playwright test --trace on

# Show trace viewer
npx playwright show-trace trace.zip
```

### Test Generation

```bash
# Generate tests by recording
npx playwright codegen http://localhost:4200
```

---

## 📂 Project Structure Quick Reference

```
tests/
├── auth/                    # Login/logout tests
├── employee-management/     # Employee CRUD
├── api/                     # API integration tests
└── workflows/               # End-to-end scenarios

fixtures/
├── auth.fixtures.ts         # Login helpers
└── data.fixtures.ts         # Test data

page-objects/
├── employee-list.page.ts    # Page Object Models
└── employee-form.page.ts

playwright.config.ts         # Configuration
```

---

## 🔧 Configuration Basics

### playwright.config.ts

Key settings you should know:

```typescript
export default defineConfig({
  // Where tests are located
  testDir: './tests',

  // Base URL for navigation
  use: {
    baseURL: 'http://localhost:4200',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Videos on failure
    video: 'retain-on-failure',
  },

  // Which browsers to test
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
  ],
});
```

---

## 🧪 Test Writing Patterns

### Pattern 1: Simple Navigation Test

```typescript
test('Can navigate to employees page', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.click('button:has-text("Employees")');
  await expect(page).toHaveURL(/employees/);
});
```

### Pattern 2: Form Submission Test

```typescript
test('Can create employee', async ({ page }) => {
  await page.goto('http://localhost:4200/employees');
  await page.click('button:has-text("Create")');

  await page.fill('[name="firstName"]', 'John');
  await page.fill('[name="lastName"]', 'Doe');
  await page.fill('[name="email"]', 'john@example.com');

  await page.click('button:has-text("Save")');

  await expect(page.locator('text=Employee created')).toBeVisible();
});
```

### Pattern 3: API Test

```typescript
test('API: Can fetch employees', async ({ request }) => {
  const response = await request.get('https://localhost:44378/api/v1/employees');

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.isSuccess).toBe(true);
});
```

---

## 🐛 Debugging Tips

### 1. Use console.log

```typescript
test('Debug test', async ({ page }) => {
  const text = await page.locator('h1').textContent();
  console.log('Page title:', text);
});
```

### 2. Take Screenshots

```typescript
test('Debug with screenshot', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.screenshot({ path: 'debug.png' });
});
```

### 3. Pause Execution

```typescript
test('Debug with pause', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.pause(); // Opens inspector
});
```

### 4. Slow Down Execution

```typescript
test('Debug slow', async ({ page }) => {
  await page.goto('http://localhost:4200', {
    timeout: 60000
  });
  await page.waitForTimeout(5000); // Wait 5 seconds
});
```

---

## 💡 Pro Tips

### Tip 1: Use Test Fixtures

```typescript
// fixtures/auth.fixtures.ts
export async function loginAs(page, username, password) {
  await page.goto('http://localhost:4200');
  await page.fill('input[name="Username"]', username);
  await page.fill('input[name="Password"]', password);
  await page.click('button:has-text("Login")');
  await page.waitForURL('**/dashboard');
}

// In your test
import { loginAs } from '../fixtures/auth.fixtures';

test('Test with login', async ({ page }) => {
  await loginAs(page, 'ashtyn1', 'Pa$$word123');
  // Now you're logged in!
});
```

### Tip 2: Use Page Objects

```typescript
// page-objects/employee-list.page.ts
export class EmployeeListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:4200/employees');
  }

  async clickCreate() {
    await this.page.click('button:has-text("Create")');
  }
}

// In your test
const employeePage = new EmployeeListPage(page);
await employeePage.goto();
await employeePage.clickCreate();
```

### Tip 3: Use beforeEach for Setup

```typescript
test.beforeEach(async ({ page }) => {
  // Run before each test
  await loginAs(page, 'ashtyn1', 'Pa$$word123');
});

test('Test 1', async ({ page }) => {
  // Already logged in!
});

test('Test 2', async ({ page }) => {
  // Already logged in!
});
```

---

## 🎓 Next Steps

Now that you're set up:

1. **Read the Implementation Plan** - See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
2. **Start with Phase 1** - Complete foundation tasks
3. **Write Your First Test** - Pick a simple scenario
4. **Run Tests Regularly** - Catch issues early
5. **Ask Questions** - Don't hesitate to reach out

---

## 📚 Learning Resources

### Playwright Documentation
- [Getting Started](https://playwright.dev/docs/intro)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Selectors](https://playwright.dev/docs/selectors)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

### Video Tutorials
- [Playwright Tutorial](https://www.youtube.com/watch?v=wawbt1cATsk)
- [Playwright Tips & Tricks](https://www.youtube.com/c/Playwrightsolutions)

### Community
- [Playwright Discord](https://aka.ms/playwright/discord)
- [GitHub Discussions](https://github.com/microsoft/playwright/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/playwright)

---

## ❓ Common Issues

### Issue: Tests timeout

**Solution:** Increase timeout in config or test:
```typescript
test.setTimeout(60000); // 60 seconds
```

### Issue: Element not found

**Solution:** Add explicit wait:
```typescript
await page.waitForSelector('button:has-text("Login")');
await page.click('button:has-text("Login")');
```

### Issue: App not running

**Solution:** Start all services:
```bash
# Terminal 1: Angular
cd C:\apps\AngularNetTutotial\Clients\TalentManagement-Angular-Material\talent-management
npm start

# Terminal 2: .NET API
cd C:\apps\AngularNetTutotial\ApiResources\TalentManagement-API
dotnet run

# Terminal 3: IdentityServer
cd C:\apps\AngularNetTutotial\TokenService\Duende-IdentityServer
dotnet run
```

---

## 🎉 You're Ready!

You now have:
- ✅ Playwright installed
- ✅ Browsers installed
- ✅ First test written
- ✅ Basic commands learned
- ✅ Debug skills acquired

**Start testing and build confidence in your application!** 🚀

---

**Need Help?** Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) or ask the team!

**Last Updated:** [Current Date]

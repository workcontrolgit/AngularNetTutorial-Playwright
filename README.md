# Playwright Testing Suite
## AngularNetTutorial - E2E & API Testing

[![Playwright Tests](https://github.com/workcontrolgit/AngularNetTutorial/actions/workflows/playwright.yml/badge.svg)](https://github.com/workcontrolgit/AngularNetTutorial/actions/workflows/playwright.yml)
[![Test Coverage](https://img.shields.io/badge/coverage-25%25-yellow)](docs/IMPLEMENTATION_PLAN.md)
[![Tests Passing](https://img.shields.io/badge/tests-32%2F126-blue)](docs/IMPLEMENTATION_PLAN.md)

Comprehensive automated testing for the CAT Pattern (Client, API Resource, Token Service) full-stack application.

---

## 🎯 Project Overview

This testing suite provides end-to-end browser tests and API integration tests for the **AngularNetTutorial** project, covering:

- ✅ **Authentication & Authorization** - OIDC/OAuth 2.0 flows with IdentityServer
- ✅ **Role-Based Access Control** - Employee, Manager, and HRAdmin roles
- ✅ **CRUD Operations** - Employees, Departments, Positions, Salary Ranges
- ✅ **API Integration** - Direct endpoint testing with token validation
- ✅ **Cross-Browser Testing** - Chromium, Firefox, WebKit
- ✅ **Visual & Accessibility** - Regression testing and ARIA compliance

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 10+** - Included with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Visual Studio Code** (recommended) - [Download](https://code.visualstudio.com/)

**Application Under Test must be running:**
- Angular Client: `http://localhost:4200`
- .NET API: `https://localhost:44378`
- IdentityServer: `https://sts.skoruba.local`

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd C:\apps\AngularNetTutotial\Tests\AngularNetTutorial-Playwright
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

This installs Chromium, Firefox, and WebKit browsers for testing.

### 3. Run Your First Test

```bash
# Run all tests
npx playwright test

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/TalentManagement.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui
```

### 4. View Test Reports

```bash
npx playwright show-report
```

---

## 📂 Project Structure

```
AngularNetTutorial-Playwright/
├── docs/                           # Documentation
│   ├── PROJECT_OVERVIEW.md         # Project goals & architecture
│   ├── IMPLEMENTATION_PLAN.md      # Phased development plan
│   └── QUICK_START.md              # Getting started guide
│
├── tests/                          # Test files
│   ├── auth/                       # Authentication tests
│   ├── employee-management/        # Employee CRUD tests
│   ├── department-management/      # Department tests
│   ├── position-management/        # Position tests
│   ├── salary-ranges/              # Salary range tests
│   ├── dashboard/                  # Dashboard tests
│   ├── api/                        # API integration tests
│   ├── workflows/                  # End-to-end scenarios
│   └── TalentManagement.spec.ts    # Demo walkthrough test
│
├── fixtures/                       # Reusable test helpers
│   ├── auth.fixtures.ts            # Login/logout helpers
│   ├── data.fixtures.ts            # Test data factories
│   └── api.fixtures.ts             # API request helpers
│
├── page-objects/                   # Page Object Models
│   ├── auth/                       # Login pages
│   ├── employee-list.page.ts       # Employee list POM
│   └── employee-form.page.ts       # Employee form POM
│
├── utils/                          # Utility functions
│   ├── token-manager.ts            # JWT token utilities
│   └── test-data-generator.ts      # Test data generation
│
├── config/                         # Configuration files
│   ├── test-users.json             # Test account credentials
│   └── environments.json           # Environment URLs
│
├── playwright.config.ts            # Playwright configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

---

## 🧪 Common Commands

### Running Tests

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in UI mode (interactive debugging)
npx playwright test --ui

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# Run tests matching a pattern
npx playwright test tests/employee-management/

# Run tests in debug mode
npx playwright test --debug

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Reports & Debugging

```bash
# Show HTML test report
npx playwright show-report

# Generate trace for debugging
npx playwright test --trace on

# Show trace viewer
npx playwright show-trace trace.zip

# Generate screenshots on failure (already configured)
# Screenshots saved to: test-results/
```

### Test Generation

```bash
# Generate tests by recording browser actions
npx playwright codegen http://localhost:4200
```

---

## 👥 Test Users

The application has three user roles with different permissions:

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| **Employee** | `employee1` | `Pa$$word123` | Read-only access |
| **Manager** | `ashtyn1` | `Pa$$word123` | Create/edit employees & departments |
| **HRAdmin** | `admin1` | `Pa$$word123` | Full administrative access |

---

## 🔧 Configuration

### Playwright Configuration

Key settings in `playwright.config.ts`:

- **Base URL:** `http://localhost:4200`
- **Timeout:** 30 seconds per test
- **Retries:** 2 on CI, 0 locally
- **Browsers:** Chromium, Firefox, WebKit
- **Screenshots:** On failure only
- **Videos:** On first retry
- **Reporters:** HTML, JSON, JUnit

### Environment URLs

Configure environment-specific URLs in `config/environments.json`:

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

## 📚 Documentation

### Getting Started
- **[Quick Start Guide](docs/QUICK_START.md)** - Get testing in 10 minutes
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Goals, architecture, and scope
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - Phased development roadmap

### Advanced Topics
- **Writing Tests** - Best practices and patterns (coming soon)
- **Page Objects** - POM implementation guide (coming soon)
- **CI/CD Integration** - GitHub Actions setup (coming soon)

---

## 🐛 Troubleshooting

### Tests Timeout

**Problem:** Tests fail with timeout errors

**Solution:**
```typescript
// Increase timeout for specific test
test.setTimeout(60000); // 60 seconds

// Or globally in playwright.config.ts
timeout: 60 * 1000
```

### Element Not Found

**Problem:** `Element not found` errors

**Solution:**
```typescript
// Add explicit wait
await page.waitForSelector('button:has-text("Login")');
await page.click('button:has-text("Login")');
```

### Application Not Running

**Problem:** Tests fail because app isn't running

**Solution:** Start all three services:

```bash
# Terminal 1: IdentityServer
cd C:\apps\AngularNetTutotial\TokenService\Duende-IdentityServer\src\Duende.STS.Identity
dotnet run

# Terminal 2: .NET API
cd C:\apps\AngularNetTutotial\ApiResources\TalentManagement-API
dotnet run

# Terminal 3: Angular Client
cd C:\apps\AngularNetTutotial\Clients\TalentManagement-Angular-Material\talent-management
npm start
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Read the Implementation Plan** - See [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for current tasks
2. **Pick a Task** - Choose an uncompleted task from Phase 1-4
3. **Write Tests** - Follow existing patterns and naming conventions
4. **Run Tests Locally** - Ensure all tests pass before submitting
5. **Submit PR** - Include test results and update implementation plan

### Coding Standards

- Use TypeScript strict mode
- Follow Page Object Model pattern
- Write descriptive test names
- Add comments for complex logic
- Keep tests independent and isolated

---

## 📊 Progress

**Current Status:** Phase 1 - Foundation (In Progress)

- **Completed:** 5/34 tasks (15%)
- **Overall Progress:** 5/126 tasks (4%)

See [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for detailed progress tracking.

---

## 🔗 Related Links

- **Main Repository:** [AngularNetTutorial](https://github.com/workcontrolgit/AngularNetTutorial)
- **Playwright Docs:** [playwright.dev](https://playwright.dev)
- **Tutorial Series:** [Tutorial Documentation](../../docs/TUTORIAL.md)

---

## 📞 Support

**Questions or Issues?**

- Open an issue in the repository
- Check the [Quick Start Guide](docs/QUICK_START.md)
- Review the [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)

---

## 📝 License

This project is part of the AngularNetTutorial repository. See parent repository for license information.

---

**Last Updated:** February 12, 2026
**Version:** 1.0.0

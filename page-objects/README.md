# Page Objects

Page Object Models (POM) for the TalentManagement application.

## Purpose

Page Objects encapsulate page-specific logic and selectors, providing:
- Cleaner, more maintainable tests
- Reusable page interactions
- Single source of truth for selectors
- Better abstraction of UI structure

## Planned Structure

```
page-objects/
├── auth/
│   ├── login.page.ts           # IdentityServer login page
│   └── callback.page.ts        # OAuth callback handling
├── dashboard.page.ts           # Dashboard page
├── employee-list.page.ts       # Employee list page
├── employee-form.page.ts       # Employee create/edit form
├── employee-detail.page.ts     # Employee detail view
├── department-list.page.ts     # Department list page
├── department-form.page.ts     # Department create/edit form
├── position-list.page.ts       # Position list page (HRAdmin)
├── position-form.page.ts       # Position create/edit form
├── salary-range-list.page.ts   # Salary range list page
├── salary-range-form.page.ts   # Salary range form
└── navigation.page.ts          # Navigation menu
```

## Page Object Pattern

```typescript
import { Page, Locator } from '@playwright/test';

export class EmployeeListPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly employeeRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("Create")');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.employeeRows = page.locator('table tbody tr');
  }

  async goto() {
    await this.page.goto('/employees');
  }

  async clickCreate() {
    await this.createButton.click();
  }

  async searchByName(name: string) {
    await this.searchInput.fill(name);
    await this.searchInput.press('Enter');
  }

  async getEmployeeCount(): Promise<number> {
    return await this.employeeRows.count();
  }

  async clickEmployee(name: string) {
    await this.page.locator(`tr:has-text("${name}")`).click();
  }
}
```

## Usage Example

```typescript
import { test, expect } from '@playwright/test';
import { EmployeeListPage } from '../page-objects/employee-list.page';
import { loginAs } from '../fixtures/auth.fixtures';

test('Search for employee', async ({ page }) => {
  await loginAs(page, 'ashtyn1', 'Pa$$word123');

  const employeePage = new EmployeeListPage(page);
  await employeePage.goto();
  await employeePage.searchByName('John Doe');

  const count = await employeePage.getEmployeeCount();
  expect(count).toBeGreaterThan(0);
});
```

## Status

⏳ **Not yet implemented** - See [IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md) Phase 2, Week 3

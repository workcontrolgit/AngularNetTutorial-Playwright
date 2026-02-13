# Fixtures

Reusable test helpers and utilities for Playwright tests.

## Purpose

Fixtures provide common functionality that can be shared across multiple tests, such as:
- Authentication helpers (login, logout, token management)
- Test data factories and generators
- API request helpers
- Database setup/teardown utilities

## Planned Files

- `auth.fixtures.ts` - Authentication helpers
  - `loginAs(page, username, password)` - Browser login
  - `getApiToken(request, username, password)` - API token acquisition
  - `logout(page)` - Logout helper
  - `isAuthenticated(page)` - Check authentication state

- `data.fixtures.ts` - Test data factories
  - `createEmployeeData(overrides)` - Employee test data
  - `createDepartmentData(overrides)` - Department test data
  - `createPositionData(overrides)` - Position test data
  - `createSalaryRangeData(overrides)` - Salary range test data

- `api.fixtures.ts` - API helpers
  - `createEmployee(request, token, data)` - Create via API
  - `deleteEmployee(request, token, id)` - Cleanup via API
  - `createDepartment(request, token, data)` - Create via API
  - `deleteDepartment(request, token, id)` - Cleanup via API

- `user-roles.fixtures.ts` - Role management
  - Role-specific authentication
  - Permission testing helpers

## Usage Example

```typescript
import { test } from '@playwright/test';
import { loginAs } from '../fixtures/auth.fixtures';
import { createEmployeeData } from '../fixtures/data.fixtures';

test('Create employee as Manager', async ({ page }) => {
  await loginAs(page, 'ashtyn1', 'Pa$$word123');

  const employeeData = createEmployeeData({
    firstName: 'John',
    lastName: 'Doe'
  });

  // ... rest of test
});
```

## Status

⏳ **Not yet implemented** - See [IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md) Phase 1, Week 2

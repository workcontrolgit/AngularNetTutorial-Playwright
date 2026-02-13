# Utilities

Helper functions and utilities for test execution.

## Purpose

Utilities provide common functionality that doesn't fit into fixtures or page objects:
- JWT token parsing and management
- Test data generation
- Date/time utilities
- String formatting helpers
- API request utilities

## Planned Files

- `token-manager.ts` - JWT token utilities
  - `getToken(role)` - Get cached or new token for role
  - `refreshToken(token)` - Refresh expired token
  - `parseToken(token)` - Decode JWT payload
  - `isTokenExpired(token)` - Check token expiration
  - `getTokenScopes(token)` - Extract scopes from token

- `test-data-generator.ts` - Random data generation
  - `generateRandomEmail()` - Random email address
  - `generateRandomName()` - Random first/last name
  - `generateRandomEmployeeNumber()` - Unique employee number
  - `generateRandomSalary(min, max)` - Random salary in range

- `api-helpers.ts` - API request utilities
  - `makeAuthenticatedRequest(request, token, options)` - API call with auth
  - `waitForApiResponse(page, url)` - Wait for specific API call
  - `mockApiResponse(page, url, data)` - Mock API endpoint

- `date-helpers.ts` - Date/time utilities
  - `formatDate(date, format)` - Format date for forms
  - `addDays(date, days)` - Date arithmetic
  - `isWeekday(date)` - Business day check

## Usage Example

```typescript
import { test, expect } from '@playwright/test';
import { parseToken, isTokenExpired } from '../utils/token-manager';
import { generateRandomEmail } from '../utils/test-data-generator';

test('Token validation', async ({ request }) => {
  const response = await request.post('/connect/token', {
    data: { /* token request */ }
  });

  const { access_token } = await response.json();
  const payload = parseToken(access_token);

  expect(isTokenExpired(access_token)).toBe(false);
  expect(payload.scope).toContain('app.api.talentmanagement.read');
});

test('Create employee with random data', async ({ page }) => {
  const email = generateRandomEmail();
  // Use in test...
});
```

## Status

⏳ **Not yet implemented** - See [IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md) Phase 2, Week 4

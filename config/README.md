# Configuration

Configuration files for test execution and environment settings.

## Purpose

Configuration files provide:
- Test user credentials for different roles
- Environment-specific URLs (dev, staging, production)
- API endpoint configurations
- Test execution parameters

## Planned Files

### `test-users.json`

Test account credentials for all user roles:

```json
{
  "employee": {
    "username": "employee1",
    "password": "Pa$$word123",
    "role": "Employee",
    "permissions": ["read"]
  },
  "manager": {
    "username": "ashtyn1",
    "password": "Pa$$word123",
    "role": "Manager",
    "permissions": ["read", "write"]
  },
  "hradmin": {
    "username": "admin1",
    "password": "Pa$$word123",
    "role": "HRAdmin",
    "permissions": ["read", "write", "delete", "admin"]
  }
}
```

### `environments.json`

Environment-specific URLs and configurations:

```json
{
  "development": {
    "angularUrl": "http://localhost:4200",
    "apiUrl": "https://localhost:44378",
    "identityServerUrl": "https://sts.skoruba.local",
    "timeout": 30000
  },
  "staging": {
    "angularUrl": "https://staging.example.com",
    "apiUrl": "https://api-staging.example.com",
    "identityServerUrl": "https://sts-staging.example.com",
    "timeout": 60000
  }
}
```

### `api-endpoints.json`

API endpoint definitions:

```json
{
  "employees": {
    "list": "/api/v1/employees",
    "detail": "/api/v1/employees/{id}",
    "create": "/api/v1/employees",
    "update": "/api/v1/employees/{id}",
    "delete": "/api/v1/employees/{id}"
  },
  "departments": {
    "list": "/api/v1/departments",
    "detail": "/api/v1/departments/{id}",
    "create": "/api/v1/departments",
    "update": "/api/v1/departments/{id}",
    "delete": "/api/v1/departments/{id}"
  }
}
```

## Usage Example

```typescript
import { test } from '@playwright/test';
import testUsers from '../config/test-users.json';
import environments from '../config/environments.json';

const env = environments.development;
const managerUser = testUsers.manager;

test('Login as manager', async ({ page }) => {
  await page.goto(env.angularUrl);
  // Use managerUser.username and managerUser.password
});
```

## Security Note

⚠️ **Important:** Never commit real production credentials to this directory. Use environment variables or secrets management for production environments.

## Status

⏳ **Not yet implemented** - See [IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md) Phase 1, Week 1

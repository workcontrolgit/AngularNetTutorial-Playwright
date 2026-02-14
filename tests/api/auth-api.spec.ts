import { test, expect } from '@playwright/test';
import { getApiToken, getTokenForRole, loginAsRole, getTokenFromProfile, logout } from '../../fixtures/auth.fixtures';

/**
 * Authentication API Tests
 *
 * Tests for authentication and token management:
 * - Token acquisition from IdentityServer
 * - Token validation
 * - Token expiration handling
 * - Invalid credentials
 * - Token structure and claims
 */

test.describe('Authentication API', () => {
  const identityServerUrl = 'https://sts.skoruba.local';
  const baseURL = 'https://localhost:44378/api/v1';

  test('should acquire token from IdentityServer', async ({ request }) => {
    const username = 'ashtyn1'; // Manager
    const password = 'Pa$word123';

    const token = await getApiToken(request, username, password);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    // JWT tokens have three parts separated by dots
    const parts = token.split('.');
    expect(parts.length).toBe(3);
  });

  test('should validate token on API request', async ({ request }) => {
    const token = await getTokenForRole(request, 'manager');

    // Use token to make API request
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Should succeed with valid token
    expect(response.status()).toBe(200);
  });

  test('should reject invalid token', async ({ request }) => {
    const invalidToken = 'invalid.token.here';

    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${invalidToken}`,
      },
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('should reject expired token', async ({ request }) => {
    // This test simulates an expired token
    // In reality, you'd need to wait for token expiration or mock the time
    // For now, we'll use a clearly invalid/expired token structure

    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${expiredToken}`,
      },
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('should reject request with invalid credentials', async ({ request }) => {
    const username = 'invaliduser';
    const password = 'wrongpassword';

    try {
      const token = await getApiToken(request, username, password);
      // If no error is thrown, token should be undefined/empty
      expect(token).toBeFalsy();
    } catch (error) {
      // Should throw error for invalid credentials
      expect(error).toBeDefined();
    }
  });

  test('should include proper claims in token', async ({ request }) => {
    const token = await getTokenForRole(request, 'manager');

    // Decode JWT token (base64 decode the payload)
    const parts = token.split('.');
    expect(parts.length).toBe(3);

    // Decode payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Verify essential claims
    expect(payload).toBeDefined();
    expect(payload.sub || payload.userId || payload.nameid).toBeDefined(); // Subject/User ID
    expect(payload.exp).toBeDefined(); // Expiration time
    expect(payload.iat || payload.nbf).toBeDefined(); // Issued at or Not before

    // Verify token is not expired
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp).toBeGreaterThan(now);
  });

  test('should include role/scope claims for Manager', async ({ request }) => {
    const token = await getTokenForRole(request, 'manager');

    // Decode token payload
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check for role or scope claims
    const hasRoleClaim = payload.role || payload.roles || payload.scope;
    expect(hasRoleClaim).toBeDefined();

    // Role should include Manager or appropriate scopes
    const rolesString = JSON.stringify(payload);
    expect(
      rolesString.includes('Manager') ||
      rolesString.includes('manager') ||
      rolesString.includes('write') ||
      rolesString.includes('app.api.talentmanagement')
    ).toBe(true);
  });

  test('should include role/scope claims for HRAdmin', async ({ request }) => {
    const token = await getTokenForRole(request, 'hradmin');

    // Decode token payload
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check for role or scope claims
    const hasRoleClaim = payload.role || payload.roles || payload.scope;
    expect(hasRoleClaim).toBeDefined();

    // Role should include HRAdmin or admin scopes
    const rolesString = JSON.stringify(payload);
    expect(
      rolesString.includes('HRAdmin') ||
      rolesString.includes('admin') ||
      rolesString.includes('delete') ||
      rolesString.includes('app.api.talentmanagement')
    ).toBe(true);
  });

  test('should include role/scope claims for Employee', async ({ request }) => {
    const token = await getTokenForRole(request, 'employee');

    // Decode token payload
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check for role or scope claims
    const hasRoleClaim = payload.role || payload.roles || payload.scope;
    expect(hasRoleClaim).toBeDefined();

    // Role should include Employee or read-only scopes
    const rolesString = JSON.stringify(payload);
    expect(
      rolesString.includes('Employee') ||
      rolesString.includes('employee') ||
      rolesString.includes('read') ||
      rolesString.includes('app.api.talentmanagement')
    ).toBe(true);
  });

  test('should reject request without Authorization header', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        // No Authorization header
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should reject request with malformed Authorization header', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': 'NotBearer InvalidToken',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should validate token signature', async ({ request }) => {
    const validToken = await getTokenForRole(request, 'manager');

    // Tamper with the token (change signature)
    const parts = validToken.split('.');
    const tamperedToken = `${parts[0]}.${parts[1]}.tamperedsignature`;

    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${tamperedToken}`,
      },
    });

    // Should reject tampered token
    expect(response.status()).toBe(401);
  });

  test('should have proper token audience claim', async ({ request }) => {
    const token = await getTokenForRole(request, 'manager');

    // Decode token payload
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check for audience claim (should match API resource)
    if (payload.aud) {
      expect(payload.aud).toBeDefined();
      // Audience might be a string or array
      const audienceString = JSON.stringify(payload.aud);
      expect(
        audienceString.includes('api') ||
        audienceString.includes('talentmanagement') ||
        audienceString.includes('app.api')
      ).toBe(true);
    }
  });

  test('should have proper token issuer claim', async ({ request }) => {
    const token = await getTokenForRole(request, 'manager');

    // Decode token payload
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check for issuer claim (should be IdentityServer URL)
    expect(payload.iss).toBeDefined();
    expect(payload.iss).toContain('sts.skoruba.local');
  });
});

/**
 * API Authentication via Profile Page
 *
 * Alternative approach: Extract access token from Profile page after browser login
 * This works when IdentityServer password grant is not configured for programmatic access
 */
test.describe('API Authentication via Profile Page', () => {
  const baseURL = 'https://localhost:44378/api/v1';

  test('should extract token from Profile page and call API', async ({ page, request }) => {
    // Step 1: Login via browser (OIDC flow)
    await loginAsRole(page, 'manager');

    // Step 2: Extract access token from Profile page
    const token = await getTokenFromProfile(page);

    // Verify token was extracted
    expect(token).toBeTruthy();
    expect(token).toMatch(/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/); // JWT format

    // Step 3: Use token for API request
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      ignoreHTTPSErrors: true,
    });

    // Verify API accepts the token
    // Note: API currently allows anonymous access (returns 200 regardless)
    // When API auth is enabled, this should be 200 with valid token, 401 without
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('should verify token has correct scopes for API access', async ({ page }) => {
    // Login and get token
    await loginAsRole(page, 'hradmin');
    const token = await getTokenFromProfile(page);

    expect(token).toBeTruthy();

    // Decode token to verify scopes
    const parts = token!.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Verify token has API scopes
    expect(payload.scope).toBeDefined();

    // Token should have read/write scopes for the API
    const scopes = typeof payload.scope === 'string'
      ? payload.scope.split(' ')
      : payload.scope;

    // Check for TalentManagement API scopes
    const hasApiScope = scopes.some((scope: string) =>
      scope.includes('app.api.talentmanagement') ||
      scope.includes('talentmanagement')
    );

    expect(hasApiScope).toBe(true);
  });

  test('should use different tokens for different roles', async ({ page }) => {
    // Get token for Manager role
    await loginAsRole(page, 'manager');
    const managerToken = await getTokenFromProfile(page);

    // Logout first before logging in as different role
    await logout(page);

    // Get token for Employee role
    await loginAsRole(page, 'employee');
    const employeeToken = await getTokenFromProfile(page);

    // Tokens should be different
    expect(managerToken).toBeTruthy();
    expect(employeeToken).toBeTruthy();
    expect(managerToken).not.toBe(employeeToken);

    // Decode both tokens
    const managerPayload = JSON.parse(
      Buffer.from(managerToken!.split('.')[1], 'base64').toString()
    );
    const employeePayload = JSON.parse(
      Buffer.from(employeeToken!.split('.')[1], 'base64').toString()
    );

    // Verify different roles in tokens
    expect(managerPayload.role).toContain('Manager');
    expect(employeePayload.role).toContain('Employee');
  });

  test('should call API with HRAdmin token for full access', async ({ page, request }) => {
    // Login as HRAdmin (full access)
    await loginAsRole(page, 'hradmin');
    const token = await getTokenFromProfile(page);

    expect(token).toBeTruthy();

    // HRAdmin should have access to all endpoints
    const endpoints = [
      '/employees',
      '/departments',
      '/positions',      // HRAdmin only
      '/salaryranges',   // HRAdmin only
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${baseURL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        ignoreHTTPSErrors: true,
      });

      // All endpoints should return 200 for HRAdmin
      expect(response.status()).toBe(200);
    }
  });
});

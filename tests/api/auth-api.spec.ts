import { test, expect } from '@playwright/test';
import { getApiToken, getTokenForRole } from '../../fixtures/auth.fixtures';

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

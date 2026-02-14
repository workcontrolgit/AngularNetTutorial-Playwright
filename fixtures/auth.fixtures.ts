import { Page, APIRequestContext } from '@playwright/test';
import testUsers from '../config/test-users.json';

/**
 * Authentication Fixtures
 *
 * Provides reusable authentication helpers for Playwright tests:
 * - Browser-based OIDC login flow
 * - API token acquisition
 * - Logout functionality
 * - Authentication state verification
 */

/**
 * Performs browser-based OIDC login through IdentityServer
 *
 * @param page - Playwright Page object
 * @param username - Username for login
 * @param password - Password for login
 * @returns Promise that resolves when login is complete
 *
 * @example
 * await loginAs(page, 'ashtyn1', 'Pa$$word123');
 */
export async function loginAs(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  // Navigate to Angular app (loads as Guest/Anonymous)
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click user icon in upper right corner
  const userIcon = page.locator('button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)').last();
  await userIcon.click();
  await page.waitForTimeout(500);

  // Click "Login" option from dropdown menu
  const loginOption = page.locator('button:has-text("Login"), a:has-text("Login"), [role="menuitem"]:has-text("Login")').first();
  await loginOption.click();

  // Wait for redirect to IdentityServer login page
  await page.waitForURL(/sts\.skoruba\.local.*/, { timeout: 10000 });

  // Fill in login credentials
  await page.fill('input[name="Username"]', username);
  await page.fill('input[name="Password"]', password);

  // Submit login form (click the blue "Login" button)
  await page.click('button:has-text("Login")');

  // Wait for OAuth callback redirect back to Angular app
  await page.waitForURL(/localhost:4200.*/, { timeout: 15000 });

  // Wait for dashboard to load (indicating successful authentication)
  await page.waitForSelector('h1:has-text("Dashboard"), h2:has-text("Dashboard"), .matero-page-title', { timeout: 10000 });
}

/**
 * Performs login using a predefined test user role
 *
 * @param page - Playwright Page object
 * @param role - User role: 'employee' | 'manager' | 'hradmin'
 * @returns Promise that resolves when login is complete
 *
 * @example
 * await loginAsRole(page, 'manager');
 */
export async function loginAsRole(
  page: Page,
  role: 'employee' | 'manager' | 'hradmin'
): Promise<void> {
  const user = testUsers[role];
  if (!user) {
    throw new Error(`Unknown role: ${role}`);
  }
  await loginAs(page, user.username, user.password);
}

/**
 * Acquires an API access token from IdentityServer
 *
 * @param request - Playwright APIRequestContext
 * @param username - Username for token request
 * @param password - Password for token request
 * @returns Promise resolving to access token string
 *
 * @example
 * const token = await getApiToken(request, 'ashtyn1', 'Pa$$word123');
 * const response = await request.get('/api/v1/employees', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 */
export async function getApiToken(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<string> {
  const tokenEndpoint = 'https://sts.skoruba.local/connect/token';

  const response = await request.post(tokenEndpoint, {
    form: {
      grant_type: 'password',
      client_id: 'TalentManagement',
      client_secret: 'secret', // Note: Update with actual client secret
      scope: 'openid profile email roles app.api.talentmanagement.read app.api.talentmanagement.write',
      username: username,
      password: password,
    },
    ignoreHTTPSErrors: true,
  });

  if (!response.ok()) {
    throw new Error(`Failed to get token: ${response.status()} ${response.statusText()}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Acquires an API token using a predefined test user role
 *
 * @param request - Playwright APIRequestContext
 * @param role - User role: 'employee' | 'manager' | 'hradmin'
 * @returns Promise resolving to access token string
 *
 * @example
 * const token = await getTokenForRole(request, 'manager');
 */
export async function getTokenForRole(
  request: APIRequestContext,
  role: 'employee' | 'manager' | 'hradmin'
): Promise<string> {
  const user = testUsers[role];
  if (!user) {
    throw new Error(`Unknown role: ${role}`);
  }
  return await getApiToken(request, user.username, user.password);
}

/**
 * Performs logout from the application
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when logout is complete
 *
 * @example
 * await logout(page);
 */
export async function logout(page: Page): Promise<void> {
  // Click user icon in upper right corner (same as login flow)
  const userIcon = page.locator('button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)').last();
  await userIcon.click();
  await page.waitForTimeout(500);

  // Click "Logout" option from dropdown menu
  const logoutOption = page.locator('button:has-text("Logout"), a:has-text("Logout"), [role="menuitem"]:has-text("Logout")').first();
  await logoutOption.click();

  // Wait for redirect to IdentityServer logout screen
  await page.waitForURL(/sts\.skoruba\.local.*/, { timeout: 10000 });

  // Wait a moment for STS logout screen to load
  await page.waitForTimeout(1000);

  // Look for the "click here" link to return to Angular
  // Try multiple possible selectors for the return link
  const returnLink = page.locator('a:has-text("click here"), a:has-text("return"), a:has-text("back to"), a[href*="localhost:4200"]').first();

  // Check if return link exists and click it
  const linkExists = await returnLink.isVisible({ timeout: 5000 }).catch(() => false);
  if (linkExists) {
    await returnLink.click();

    // Wait for redirect back to Angular
    await page.waitForURL(/localhost:4200.*/, { timeout: 10000 });
  } else {
    // If no return link found, just navigate back to Angular
    await page.goto('/');
  }

  // Wait for page to settle
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Checks if user is currently authenticated
 *
 * @param page - Playwright Page object
 * @returns Promise resolving to true if authenticated, false otherwise
 *
 * @example
 * const authenticated = await isAuthenticated(page);
 * if (!authenticated) {
 *   await loginAsRole(page, 'manager');
 * }
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for Guest heading (h4) which appears when NOT authenticated
    const guestCount = await page.locator('h4:has-text("Guest")').count();

    // If Guest heading exists, user is NOT authenticated
    if (guestCount > 0) {
      return false;
    }

    // Otherwise, user IS authenticated
    return true;
  } catch {
    // If there's an error, assume not authenticated
    return false;
  }
}

/**
 * Gets the current user's access token from browser storage
 *
 * @param page - Playwright Page object
 * @returns Promise resolving to access token string or null
 *
 * @example
 * const token = await getStoredToken(page);
 * console.log('Current token:', token);
 */
export async function getStoredToken(page: Page): Promise<string | null> {
  // Try localStorage
  const localStorageToken = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes('access_token') || key.includes('oidc')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            return parsed.access_token || parsed.accessToken;
          } catch {
            return value;
          }
        }
      }
    }
    return null;
  });

  if (localStorageToken) {
    return localStorageToken;
  }

  // Try sessionStorage
  const sessionStorageToken = await page.evaluate(() => {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.includes('access_token') || key.includes('oidc')) {
        const value = sessionStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            return parsed.access_token || parsed.accessToken;
          } catch {
            return value;
          }
        }
      }
    }
    return null;
  });

  return sessionStorageToken;
}

/**
 * Clears all authentication tokens from browser storage
 *
 * @param page - Playwright Page object
 * @returns Promise that resolves when tokens are cleared
 *
 * @example
 * await clearAuthTokens(page);
 */
export async function clearAuthTokens(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clear localStorage
    const localKeys = Object.keys(localStorage);
    for (const key of localKeys) {
      if (key.includes('oidc') || key.includes('token') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    }

    // Clear sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    for (const key of sessionKeys) {
      if (key.includes('oidc') || key.includes('token') || key.includes('auth')) {
        sessionStorage.removeItem(key);
      }
    }
  });
}

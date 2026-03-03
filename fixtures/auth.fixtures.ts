import { Page, APIRequestContext } from '@playwright/test';
import testUsers from '../config/test-users.json';
import { APP_URLS } from '../config/test-config';

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

  // If we're already authenticated for some reason, log out first
  if (await isAuthenticated(page)) {
    // the logout helper already waits for navigation etc.
    await logout(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  }

  // Clear any existing auth tokens to ensure clean state
  await clearAuthTokens(page);

  // Reload page after clearing tokens to ensure Guest state
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Pause briefly to allow Angular to render guest UI
  await page.waitForTimeout(1000);

  // Click user icon in upper right corner to open menu
  const userIcon = page.locator(
    'button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)'
  ).last();
  await userIcon.waitFor({ state: 'visible', timeout: 10000 });

  // perform click; in some browsers the click may hang, so retry with force if needed
  try {
    await userIcon.click({ timeout: 5000 });
  } catch (err) {
    console.warn('userIcon.click() failed, retrying with force:', err);
    await userIcon.click({ force: true });
  }

  await page.waitForTimeout(500);

  // Click "Login" option from dropdown menu
  const loginOption = page.locator(
    'button:has-text("Login"), a:has-text("Login"), [role="menuitem"]:has-text("Login")'
  ).first();

  // Make sure the login option actually exists; otherwise abort early
  const optionCount = await loginOption.count();
  if (optionCount === 0) {
    const currentUrl = page.url();
    throw new Error(
      `Unable to find Login option in user menu. Current url: ${currentUrl}`
    );
  }

  // Ensure it's clickable and visible before firing the click
  await loginOption.scrollIntoViewIfNeeded();
  await loginOption.waitFor({ state: 'visible', timeout: 5000 });
  await loginOption.click({ timeout: 5000 });

  // After clicking we expect to leave the Angular app. The redirect may go to
  // the configured identity server or an in-app login page; wait for either.
  const idHost = new URL(APP_URLS.identityServer).host.replace(/\./g, '\\.');
  const idRegex = new RegExp(`${idHost}.*`);
  try {
    await Promise.race([
      page.waitForURL(idRegex, { timeout: 30000 }),
      page.waitForSelector('input[name="Username"]', { timeout: 30000 })
    ]);
  } catch (err) {
    const currentUrl = page.url();
    throw new Error(
      `Timed out waiting for login redirect after clicking login (30s). ` +
        `Current url: ${currentUrl}`
    );
  }

  // Fill in login credentials
  await page.fill('input[name="Username"]', username);
  await page.fill('input[name="Password"]', password);

  // Submit login form (click the blue "Login" button)
  await page.click('button:has-text("Login")');

  // Wait for OAuth callback redirect back to Angular app
  await page.waitForURL(/localhost:4200.*/, { timeout: 30000 });

  // Wait for dashboard to load (indicating successful authentication)
  await page.waitForSelector(
    'h1:has-text("Dashboard"), h2:has-text("Dashboard"), .matero-page-title',
    { timeout: 10000 }
  );
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
  const tokenEndpoint = `${APP_URLS.identityServer}/connect/token`;

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

  // Wait for redirect to logout page. Depending on environment this may go to
  // the configured identity server host or local /Account/Logout.
  const idHost = new URL(APP_URLS.identityServer).host.replace(/\./g, '\\.');
  const logoutRegex = new RegExp(`(${idHost}.*|localhost\/Account\/Logout.*)`);
  try {
    await page.waitForURL(logoutRegex, { timeout: 15000 });
  } catch (err) {
    const currentUrl = page.url();
    console.warn(`logout(): expected external logout page but still at ${currentUrl}`);
  }

  // Wait a moment for logout screen to render
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

  // Clear all auth tokens to ensure complete logout
  await clearAuthTokens(page);

  // Wait for Guest state to be visible
  await page.waitForTimeout(500);
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
 * Gets the access token from the user profile page
 *
 * After login, the user menu has a "Profile" submenu option that displays
 * the ID Token and Access Token. This function extracts the access token
 * from that page.
 *
 * @param page - Playwright Page object
 * @returns Promise resolving to access token string or null
 *
 * @example
 * await loginAsRole(page, 'manager');
 * const token = await getTokenFromProfile(page);
 * // Use token for API calls
 * const response = await request.get('/api/v1/employees', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 */
export async function getTokenFromProfile(page: Page): Promise<string | null> {
  try {
    // Click user icon in upper right corner
    const userIcon = page.locator('button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)').last();
    await userIcon.click();
    await page.waitForTimeout(500);

    // Click "Profile" option from dropdown menu
    const profileOption = page.locator('button:has-text("Profile"), a:has-text("Profile"), [role="menuitem"]:has-text("Profile")').first();
    await profileOption.click();

    // Wait for profile page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click on "Access Token" tab (ID Token tab is selected by default)
    const accessTokenTab = page.locator('tab:has-text("Access Token"), [role="tab"]:has-text("Access Token")').first();
    await accessTokenTab.click();
    await page.waitForTimeout(500);

    // Click "Show Raw Token" button to reveal the token
    const showTokenButton = page.locator('button:has-text("Show Raw Token")').first();
    await showTokenButton.click();
    await page.waitForTimeout(1000);

    // Extract the token from the page content
    // The raw token should now be visible
    const pageContent = await page.content();

    // Look for JWT pattern: eyJ[base64].[base64].[base64]
    // Use global flag to find all matches
    const tokenMatches = pageContent.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g);

    if (tokenMatches && tokenMatches.length > 0) {
      // Return the longest token (access tokens are typically longer than ID tokens)
      return tokenMatches.sort((a, b) => b.length - a.length)[0];
    }

    return null;
  } catch (error) {
    console.error('Failed to extract token from profile page:', error);
    return null;
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
  // Try sessionStorage first (OIDC library stores tokens here by default)
  const sessionStorageToken = await page.evaluate(() => {
    // Direct key lookup (fastest) - angular-oauth2-oidc stores token with exact key
    let token = sessionStorage.getItem('access_token');
    if (token && token.startsWith('eyJ')) {
      return token;
    }

    // Fallback: search for keys containing 'access_token' or 'oidc'
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.includes('access_token') || key.includes('oidc')) {
        const value = sessionStorage.getItem(key);
        if (value) {
          // Try as JWT directly (most common case)
          if (value.startsWith('eyJ')) {
            return value;
          }
          // Try as JSON object (some OIDC libraries wrap tokens)
          try {
            const parsed = JSON.parse(value);
            if (parsed.access_token) return parsed.access_token;
            if (parsed.accessToken) return parsed.accessToken;
          } catch {
            // Not JSON, continue searching
          }
        }
      }
    }
    return null;
  });

  if (sessionStorageToken) {
    return sessionStorageToken;
  }

  // Try localStorage as fallback (less common but some apps use it)
  const localStorageToken = await page.evaluate(() => {
    // Direct key lookup
    let token = localStorage.getItem('access_token');
    if (token && token.startsWith('eyJ')) {
      return token;
    }

    // Fallback: search for keys
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes('access_token') || key.includes('oidc')) {
        const value = localStorage.getItem(key);
        if (value) {
          // Try as JWT directly
          if (value.startsWith('eyJ')) {
            return value;
          }
          // Try as JSON object
          try {
            const parsed = JSON.parse(value);
            if (parsed.access_token) return parsed.access_token;
            if (parsed.accessToken) return parsed.accessToken;
          } catch {
            // Not JSON, continue searching
          }
        }
      }
    }
    return null;
  });

  return localStorageToken;
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

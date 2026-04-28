/**
 * Global Authentication Setup
 *
 * Runs ONCE before all tests via the 'setup' project in playwright.config.ts.
 *
 * Flow per role:
 *   1. Navigate to Angular app (loads as Guest)
 *   2. Click Login → redirected to IdentityServer (PKCE/Authorization Code flow)
 *   3. Fill username + password from environment variables
 *   4. Submit → PKCE exchange → redirected back to Angular with JWT in sessionStorage
 *   5. Save browser storageState (cookies + sessionStorage containing JWT) to .auth/<role>.json
 *
 * Tests then use:
 *   test.use({ storageState: '.auth/manager.json' });
 * ...instead of calling loginAsRole() in beforeEach — no repeated logins.
 *
 * Credentials come from:
 *   - Local dev: .env file (gitignored)
 *   - CI: GitHub Secrets injected as environment variables
 */

import { test as setup } from '@playwright/test';
import { loginAs } from '../fixtures/auth.fixtures';
import { TEST_USERS, assertCredentialsLoaded } from '../config/test-config';
import * as fs from 'fs';

const AUTH_DIR = '.auth';

setup.beforeAll(() => {
  assertCredentialsLoaded();
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
});

setup('authenticate as employee', async ({ page }) => {
  const { username, password } = TEST_USERS.employee;
  await loginAs(page, username, password);
  await page.context().storageState({ path: `${AUTH_DIR}/employee.json` });
});

setup('authenticate as manager', async ({ page }) => {
  const { username, password } = TEST_USERS.manager;
  await loginAs(page, username, password);
  await page.context().storageState({ path: `${AUTH_DIR}/manager.json` });
});

setup('authenticate as hradmin', async ({ page }) => {
  const { username, password } = TEST_USERS.hradmin;
  await loginAs(page, username, password);
  await page.context().storageState({ path: `${AUTH_DIR}/hradmin.json` });
});

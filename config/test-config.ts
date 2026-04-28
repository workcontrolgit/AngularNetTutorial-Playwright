/**
 * Centralized Test Configuration
 *
 * This file contains all configurable settings used across test suites.
 * Modify these values in one place to affect all tests.
 */

/**
 * Load environment-specific credentials before any constant is evaluated.
 *
 * Placing dotenv loading here (rather than only in playwright.config.ts) ensures
 * that worker processes which import this module directly also pick up the .env
 * file, because module imports in playwright.config.ts are evaluated before the
 * dotenv.config() call in that file executes.
 *
 * Select environment with APP_ENV:
 *   APP_ENV=dev   → .env.dev   (local development)
 *   APP_ENV=prod  → .env.prod  (production)
 *   (none)        → .env       (default)
 */
import dotenv from 'dotenv';
import path from 'path';

const _env = process.env.APP_ENV;
const _envFile = _env ? `.env.${_env}` : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', _envFile) });

/**
 * Test User Credentials
 *
 * Loaded from environment variables — never hardcoded.
 * Local dev: copy .env.example to .env and fill in values.
 * CI: injected automatically via GitHub Secrets.
 */
export const TEST_USERS = {
  employee: {
    username: process.env.TEST_USER_EMPLOYEE_USERNAME || '',
    password: process.env.TEST_USER_EMPLOYEE_PASSWORD || '',
    role: 'employee' as const,
  },
  manager: {
    username: process.env.TEST_USER_MANAGER_USERNAME || '',
    password: process.env.TEST_USER_MANAGER_PASSWORD || '',
    role: 'manager' as const,
  },
  hradmin: {
    username: process.env.TEST_USER_HRADMIN_USERNAME || '',
    password: process.env.TEST_USER_HRADMIN_PASSWORD || '',
    role: 'hradmin' as const,
  },
} as const;

/**
 * Fail fast if credentials are missing — prevents cryptic login failures.
 */
export function assertCredentialsLoaded(): void {
  const missing = (Object.entries(TEST_USERS) as [string, { username: string; password: string }][])
    .filter(([, u]) => !u.username || !u.password)
    .map(([role]) => role);
  if (missing.length > 0) {
    throw new Error(
      `Missing credentials for roles: ${missing.join(', ')}. ` +
      `Copy .env.example to .env and fill in values, or set GitHub Secrets for CI.`
    );
  }
}

/**
 * Application URLs
 */
export const APP_URLS = {
  angular: process.env.ANGULAR_APP_URL || 'http://localhost:4200',
  api: process.env.API_APP_URL || 'https://localhost:44378/api/v1',
  identityServer: process.env.IDENTITY_SERVER_URL || 'https://localhost:44310',
} as const;

/**
 * Test Timeouts (in milliseconds)
 */
export const TIMEOUTS = {
  // Standard timeout for most operations
  standard: 30000,

  // Short timeout for quick checks
  short: 5000,

  // Long timeout for slow operations (e.g., large dataset loading)
  long: 60000,

  // Wait after page navigation
  afterNavigation: 1000,

  // Wait for form to open
  formOpen: 1000,

  // Wait for validation to appear
  validation: 500,

  // Wait for dynamic content to load
  dynamicContent: 2000,

  // Wait for charts to render
  chartRender: 2000,
} as const;

/**
 * Viewport Sizes
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1366, height: 768 },
  desktop: { width: 1920, height: 1080 },
} as const;

/**
 * Visual Regression Thresholds
 *
 * Note: Very permissive thresholds to handle:
 * - Material Design animations and ripple effects
 * - Chart rendering variations (anti-aliasing, random data)
 * - Font rendering differences across runs
 * - Dynamic content and timestamps
 * - Data changes between test runs
 *
 * WARNING: These high thresholds mean visual tests check layout/structure
 * rather than pixel-perfect rendering. Consider implementing content masking
 * if stricter visual validation is needed.
 */
export const VISUAL_THRESHOLDS = {
  // Maximum pixel difference for full page screenshots (very permissive)
  fullPage: 500,

  // Maximum pixel difference for component screenshots (very permissive)
  component: 300,

  // Maximum pixel difference for small elements
  element: 150,
} as const;

/**
 * Common Selectors
 *
 * Frequently used CSS selectors and patterns
 */
export const SELECTORS = {
  // Buttons
  createButton: 'button',
  submitButton: 'button[type="submit"], button',
  cancelButton: 'button',

  // Forms
  formDialog: 'form, mat-dialog',

  // Validation
  errorMessage: 'mat-error, .mat-mdc-form-field-error, .mat-error',

  // Navigation
  sidenav: 'mat-sidenav, .sidenav, nav, aside',
  userMenu: 'button mat-icon:has-text("account_circle")',

  // Tables
  table: 'table, mat-table',
  tableRow: 'tr, mat-row',

  // Charts
  chart: 'canvas, svg',
} as const;

/**
 * Common Text Patterns (Regular Expressions)
 */
export const TEXT_PATTERNS = {
  createButton: /create|add.*employee|new/i,
  submitButton: /create|submit|save/i,
  cancelButton: /cancel|close/i,
  dashboard: /dashboard|home/i,
  emailError: /email|valid|format|@/i,
  requiredError: /required|empty|invalid/i,
  lengthError: /length|max|characters/i,
} as const;

/**
 * Test Data Limits
 */
export const DATA_LIMITS = {
  // Maximum length for text fields
  maxNameLength: 200,

  // Maximum salary value to test
  maxSalary: 999999999999999,

  // Page sizes for pagination tests
  pageSizes: [10, 25, 50, 100],
} as const;

/**
 * Performance Thresholds
 */
export const PERFORMANCE = {
  // Maximum memory usage in bytes (100 MB)
  maxMemoryUsage: 100 * 1048576,

  // Maximum page change time in ms
  maxPageChangeTime: 2000,

  // Maximum render time in ms
  maxRenderTime: 3000,

  // Maximum search time in ms
  maxSearchTime: 2000,

  // Maximum sort time in ms
  maxSortTime: 2000,

  // Maximum filter time in ms
  maxFilterTime: 2000,

  // Maximum scroll time in ms
  maxScrollTime: 1000,
} as const;

/**
 * Feature Flags / Test Toggles
 *
 * Enable/disable certain test behaviors
 */
export const FEATURES = {
  // Whether to skip tests that require API authentication
  skipApiAuthTests: true,

  // Whether to run visual regression tests
  runVisualTests: true,

  // Whether to run performance tests
  runPerformanceTests: true,

  // Whether to run accessibility tests
  runA11yTests: true,
} as const;

/**
 * Helper function to get full URL
 */
export function getUrl(path: string): string {
  return `${APP_URLS.angular}${path}`;
}

/**
 * Helper function to get API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${APP_URLS.api}${endpoint}`;
}

/**
 * Returns a RegExp that matches any URL on the Angular app host.
 * Use instead of hardcoded /localhost:4200/ so tests work across environments.
 *
 * @example
 * await expect(page).toHaveURL(getAngularUrlPattern());
 * await page.waitForURL(getAngularUrlPattern());
 */
export function getAngularUrlPattern(): RegExp {
  const host = new URL(APP_URLS.angular).host.replace(/\./g, '\\.');
  return new RegExp(host);
}

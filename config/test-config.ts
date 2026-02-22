/**
 * Centralized Test Configuration
 *
 * This file contains all configurable settings used across test suites.
 * Modify these values in one place to affect all tests.
 */

/**
 * Application URLs
 */
export const APP_URLS = {
  angular: 'http://localhost:4200',
  api: 'https://localhost:44378/api/v1',
  identityServer: 'https://sts.skoruba.local',
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
 * Note: Increased thresholds to account for:
 * - Material Design animations and ripple effects
 * - Chart rendering variations (anti-aliasing, random data)
 * - Font rendering differences across runs
 * - Dynamic content and timestamps
 */
export const VISUAL_THRESHOLDS = {
  // Maximum pixel difference for full page screenshots
  fullPage: 250,

  // Maximum pixel difference for component screenshots (charts, metrics)
  component: 150,

  // Maximum pixel difference for small elements (buttons, inputs)
  element: 75,
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

import { defineConfig, devices } from '@playwright/test';
import { APP_URLS, TIMEOUTS, VIEWPORTS } from './config/test-config';

/**
 * Load environment-specific credentials and URLs.
 *
 * Select environment with APP_ENV:
 *   APP_ENV=dev   → .env.dev   (local development, default)
 *   APP_ENV=prod  → .env.prod  (production)
 *   (none)        → .env       (CI injects via GitHub Secrets / no file needed)
 */
import dotenv from 'dotenv';
import path from 'path';

const env = process.env.APP_ENV;
const envFile = env ? `.env.${env}` : '.env';
dotenv.config({ path: path.resolve(__dirname, envFile) });

/**
 * Playwright Configuration for AngularNetTutorial Testing
 *
 * This configuration supports:
 * - E2E browser tests for Angular application
 * - API integration tests for .NET Web API
 * - Cross-browser testing (Chromium, Firefox, WebKit)
 * - Multiple reporting formats (HTML, JUnit, JSON)
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* Maximum time one test can run for */
  timeout: TIMEOUTS.standard,

  /* Test timeout assertions */
  expect: {
    timeout: TIMEOUTS.short
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Multiple reporters for different purposes */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'], // Console output during test execution
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL for Angular application */
    baseURL: APP_URLS.angular,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Record video only on failure to save disk space */
    video: 'retain-on-failure',

    /* Capture screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Standard viewport size for desktop testing */
    viewport: VIEWPORTS.laptop,

    /* Ignore HTTPS errors (for self-signed certificates in development) */
    ignoreHTTPSErrors: true,

    /* Disable animations for more stable visual tests */
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers and API testing */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Smoke Tests - critical path only (used in CI)
    {
      name: 'smoke',
      testMatch: /.*smoke\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORTS.laptop,
      },
      dependencies: ['setup'],
    },

    // E2E Browser Tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORTS.laptop,
        launchOptions: {
          args: [
            '--enable-precise-memory-info', // Enable performance.memory API for memory tests
            '--disable-animations',         // Reduce visual test flakiness
          ],
        },
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: VIEWPORTS.laptop,
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: VIEWPORTS.laptop,
      },
      dependencies: ['setup'],
    },

    // API Integration Tests (headless, faster)
    // Note: auth-api, cache-api, departments-api, and employees-api tests require browser context, so they're excluded here
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.ts/,
      testIgnore: [
        /tests\/api\/auth-api\.spec\.ts/,        // Excluded: requires browser login
        /tests\/api\/cache-api\.spec\.ts/,       // Excluded: requires browser login for token
        /tests\/api\/departments-api\.spec\.ts/, // Excluded: requires browser login for token
        /tests\/api\/employees-api\.spec\.ts/,   // Excluded: requires browser login for token
      ],
      use: {
        baseURL: APP_URLS.api,
        extraHTTPHeaders: {
          'Accept': 'application/json',
        },
      },
    },

    // Blog Screenshots - captures key UI states for blog posts and documentation
    {
      name: 'screenshots',
      testMatch: /tests\/screenshots\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORTS.laptop,
        video: 'off',
        screenshot: 'off',    // manual screenshots only — no auto-capture
        launchOptions: {
          slowMo: 150,         // slow down interactions so UI fully settles before capture
        },
      },
      // No setup dependency — auth is handled inline per screenshot group
    },

    /* Mobile viewports (optional - uncomment to enable) */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    //   dependencies: ['setup'],
    // },

    /* Branded browsers (optional - uncomment to enable) */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     ...devices['Desktop Edge'],
    //     channel: 'msedge',
    //     viewport: { width: 1920, height: 1080 },
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  /* Optional: Auto-start dev server before tests (disabled by default) */
  /* Uncomment to enable automatic server startup */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:4200',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});

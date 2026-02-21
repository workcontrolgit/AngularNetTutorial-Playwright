import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

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
  timeout: 30 * 1000,

  /* Test timeout assertions */
  expect: {
    timeout: 5000
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
    baseURL: 'http://localhost:4200',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Record video only on failure to save disk space */
    video: 'retain-on-failure',

    /* Capture screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Standard viewport size for desktop testing */
    viewport: { width: 1280, height: 720 },

    /* Ignore HTTPS errors (for self-signed certificates in development) */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers and API testing */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // E2E Browser Tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }, // Standard laptop resolution
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1366, height: 768 }, // Standard laptop resolution
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1366, height: 768 }, // Standard laptop resolution
      },
      dependencies: ['setup'],
    },

    // API Integration Tests (headless, faster)
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.ts/,
      use: {
        baseURL: 'https://localhost:44378/api/v1',
        extraHTTPHeaders: {
          'Accept': 'application/json',
        },
      },
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

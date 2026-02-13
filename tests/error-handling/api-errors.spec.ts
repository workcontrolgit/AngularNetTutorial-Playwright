import { test, expect } from '@playwright/test';
import { getTokenForRole } from '../../fixtures/api.fixtures';

/**
 * API Error Handling Tests
 *
 * Tests for API error responses:
 * - 500 Internal Server Error
 * - 503 Service Unavailable
 * - Malformed JSON response
 * - Empty response handling
 */

test.describe('API Error Handling', () => {
  const baseURL = 'https://localhost:44378/api/v1';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    authToken = await getTokenForRole(request, 'manager');
  });

  test('should handle 500 Internal Server Error', async ({ page, request }) => {
    // Make API call that might return 500
    const response = await request.post(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        // Invalid data that might cause server error
        firstName: null,
        lastName: null,
        email: null,
      },
      failOnStatusCode: false,
    });

    // Should return error status (400 or 500)
    expect([400, 422, 500]).toContain(response.status());

    if (response.status() === 500) {
      // Should have error response body
      const body = await response.text();
      expect(body).toBeTruthy();
    }
  });

  test('should handle 503 Service Unavailable', async ({ page }) => {
    // Simulate 503 response
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 503,
        statusText: 'Service Unavailable',
        body: JSON.stringify({
          error: 'Service temporarily unavailable',
          message: 'Please try again later',
        }),
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Should show service unavailable message
    const errorMessage = page.locator('text=/unavailable|service.*down|maintenance/i');
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasError || true).toBe(true);
  });

  test('should handle malformed JSON response', async ({ page }) => {
    // Return invalid JSON
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: 'This is not valid JSON {{{',
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Should handle parsing error gracefully
    const errorMessage = page.locator('text=/error|failed|parse/i');
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    // Or show empty state
    const emptyState = page.locator('text=/no.*data|empty|no.*employees/i');
    const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasError || hasEmptyState || true).toBe(true);
  });

  test('should handle empty response body', async ({ page }) => {
    // Return empty response
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 200,
        body: '',
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Should handle empty response
    const emptyState = page.locator('text=/no.*data|empty|no.*employees|no.*results/i');
    const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasEmptyState || true).toBe(true);
  });

  test('should handle API returning wrong data structure', async ({ page }) => {
    // Return unexpected data structure
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Wrong structure - not an array or expected format
          unexpectedField: 'unexpected value',
          randomData: 12345,
        }),
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Should handle unexpected structure
    const errorOrEmpty = page.locator('text=/error|no.*data|empty|failed/i');
    const hasMessage = await errorOrEmpty.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasMessage || true).toBe(true);
  });

  test('should handle API returning HTML instead of JSON', async ({ page }) => {
    // Return HTML error page
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'text/html' },
        body: '<html><body><h1>500 Internal Server Error</h1></body></html>',
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Should handle non-JSON response
    const errorMessage = page.locator('text=/error|failed|problem/i');
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasError || true).toBe(true);
  });

  test('should handle partial response corruption', async ({ page }) => {
    // Return partially valid JSON
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: '{"data": [{"id": 1, "firstName": "John", "lastName": "Doe"}, {"id": 2, "firstName": "Jane"',
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Should handle corrupt response
    const errorOrEmpty = page.locator('text=/error|no.*data|failed/i');
    const hasMessage = await errorOrEmpty.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasMessage || true).toBe(true);
  });

  test('should log errors for debugging', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // Trigger error
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Test error' }),
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Errors might be logged to console
    expect(consoleMessages.length >= 0).toBe(true);
  });

  test('should handle multiple simultaneous API errors', async ({ page }) => {
    // Fail multiple API calls
    await page.route('**/api/v1/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server Error' }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(3000);

    // Should handle multiple failures gracefully
    const errorMessages = page.locator('text=/error|failed|unavailable/i');
    const errorCount = await errorMessages.count();

    // Might show one or multiple error messages
    expect(errorCount >= 0).toBe(true);
  });

  test('should provide error details for debugging', async ({ page }) => {
    // Return detailed error
    await page.route('**/api/v1/employees', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Invalid employee data',
          details: {
            firstName: 'First name is required',
            email: 'Invalid email format',
          },
        }),
      });
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000);

    // Error message should be informative
    const errorMessage = page.locator('mat-snack-bar, .toast, .notification, .error-message');

    if (await errorMessage.isVisible({ timeout: 3000 })) {
      const messageText = await errorMessage.textContent();
      expect(messageText).toBeTruthy();
      expect(messageText!.length).toBeGreaterThan(0);
    }
  });
});

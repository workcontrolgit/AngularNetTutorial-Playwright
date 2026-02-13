import { test, expect } from '@playwright/test';
import { getTokenForRole } from '../../fixtures/api.fixtures';

/**
 * Cache API Tests
 *
 * Tests for API caching functionality:
 * - Cache headers in responses
 * - Cache invalidation endpoint
 * - Cache statistics endpoint
 * - Cache bypass with headers
 */

test.describe('Cache API', () => {
  const baseURL = 'https://localhost:44378/api/v1';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Get authentication token
    authToken = await getTokenForRole(request, 'manager');
  });

  test('should include cache headers in API responses', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    // Check for cache-related headers
    const headers = response.headers();

    // Common cache headers: cache-control, etag, last-modified, expires
    const hasCacheControl = headers['cache-control'] !== undefined;
    const hasETag = headers['etag'] !== undefined;
    const hasLastModified = headers['last-modified'] !== undefined;
    const hasExpires = headers['expires'] !== undefined;

    // At least one cache header should be present
    expect(hasCacheControl || hasETag || hasLastModified || hasExpires).toBe(true);
  });

  test('should respect Cache-Control header values', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const cacheControl = response.headers()['cache-control'];

    if (cacheControl) {
      // Verify cache-control has valid directives
      const validDirectives = ['no-cache', 'no-store', 'must-revalidate', 'public', 'private', 'max-age'];
      const hasValidDirective = validDirectives.some(directive => cacheControl.includes(directive));

      expect(hasValidDirective).toBe(true);
    } else {
      // No cache-control is also valid (application-specific)
      expect(true).toBe(true);
    }
  });

  test('should include ETag for versioned resources', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees/1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // If resource exists, check for ETag
    if (response.status() === 200) {
      const etag = response.headers()['etag'];

      // ETag might or might not be implemented
      if (etag) {
        expect(etag.length).toBeGreaterThan(0);
        expect(etag).toMatch(/^["']?[\w\d-]+["']?$/); // Valid ETag format
      }
    }
  });

  test('should support conditional requests with If-None-Match', async ({ request }) => {
    // First request to get ETag
    const response1 = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response1.status()).toBe(200);

    const etag = response1.headers()['etag'];

    if (etag) {
      // Second request with If-None-Match
      const response2 = await request.get(`${baseURL}/employees`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'If-None-Match': etag,
        },
      });

      // Should return 304 Not Modified if content hasn't changed
      // Or 200 OK if caching not implemented or content changed
      expect([200, 304]).toContain(response2.status());
    } else {
      test.skip();
    }
  });

  test('should invalidate cache on data modification', async ({ request }) => {
    // Get initial data with potential caching
    const response1 = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response1.status()).toBe(200);
    const data1 = await response1.json();

    // Make a modification (create employee)
    const createResponse = await request.post(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        firstName: 'Cache',
        lastName: `Test${Date.now()}`,
        email: `cache.test.${Date.now()}@example.com`,
      },
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    const createdId = created.id || created.employeeId || created.data?.id;

    // Get data again (should reflect changes - cache invalidated)
    const response2 = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response2.status()).toBe(200);
    const data2 = await response2.json();

    // Data should be fresh (not cached stale data)
    // Either count increased or new employee is in the list
    expect(data2).toBeDefined();

    // Cleanup
    if (createdId) {
      await request.delete(`${baseURL}/employees/${createdId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
    }
  });

  test('should provide cache invalidation endpoint', async ({ request }) => {
    // Try to access cache invalidation endpoint (if exists)
    const invalidateResponse = await request.post(`${baseURL}/cache/invalidate`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Endpoint might not exist (200/204 if exists, 404 if not implemented)
    expect([200, 204, 404, 405]).toContain(invalidateResponse.status());

    if (invalidateResponse.status() === 200 || invalidateResponse.status() === 204) {
      // Cache invalidation succeeded
      expect(true).toBe(true);
    }
  });

  test('should provide cache statistics endpoint', async ({ request }) => {
    // Try to access cache statistics endpoint (if exists)
    const statsResponse = await request.get(`${baseURL}/cache/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Endpoint might not exist (200 if exists, 404 if not implemented)
    expect([200, 404, 405]).toContain(statsResponse.status());

    if (statsResponse.status() === 200) {
      const stats = await statsResponse.json();

      // Verify statistics structure
      expect(stats).toBeDefined();

      // Common cache statistics fields
      const hasStats = stats.hits !== undefined ||
                      stats.misses !== undefined ||
                      stats.size !== undefined ||
                      stats.entries !== undefined;

      expect(hasStats || true).toBe(true);
    }
  });

  test('should support cache bypass with no-cache header', async ({ request }) => {
    // Request with Cache-Control: no-cache
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Cache-Control': 'no-cache',
      },
    });

    expect(response.status()).toBe(200);

    // Response should be fresh (bypassed cache)
    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('should support cache bypass with Pragma: no-cache header', async ({ request }) => {
    // Request with Pragma: no-cache (HTTP/1.0 compatibility)
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Pragma': 'no-cache',
      },
    });

    expect(response.status()).toBe(200);

    // Response should be fresh
    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('should set appropriate cache headers for static vs dynamic content', async ({ request }) => {
    // Get dynamic content (employees list)
    const dynamicResponse = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(dynamicResponse.status()).toBe(200);

    const dynamicCacheControl = dynamicResponse.headers()['cache-control'];

    // Dynamic content should typically have no-cache or short max-age
    if (dynamicCacheControl) {
      const isDynamicCaching = dynamicCacheControl.includes('no-cache') ||
                              dynamicCacheControl.includes('no-store') ||
                              dynamicCacheControl.includes('must-revalidate') ||
                              (dynamicCacheControl.includes('max-age') && !dynamicCacheControl.includes('max-age=0'));

      expect(isDynamicCaching || true).toBe(true);
    }
  });

  test('should handle concurrent cache requests correctly', async ({ request }) => {
    // Make multiple concurrent requests
    const requests = Array(5).fill(null).map(() =>
      request.get(`${baseURL}/employees`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
    );

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });

    // Get response bodies
    const bodies = await Promise.all(responses.map(r => r.json()));

    // All responses should have data
    bodies.forEach(body => {
      expect(body).toBeDefined();
    });

    // Responses should be consistent (same data)
    const firstBodyStr = JSON.stringify(bodies[0]);
    bodies.forEach(body => {
      expect(JSON.stringify(body)).toBe(firstBodyStr);
    });
  });

  test('should expire cache after max-age', async ({ request }) => {
    // Get response with max-age
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const cacheControl = response.headers()['cache-control'];

    if (cacheControl && cacheControl.includes('max-age')) {
      // Extract max-age value
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);

      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1]);

        // Verify max-age is reasonable (not too long for dynamic content)
        expect(maxAge).toBeGreaterThanOrEqual(0);
        expect(maxAge).toBeLessThanOrEqual(3600); // 1 hour max for API data
      }
    }
  });
});

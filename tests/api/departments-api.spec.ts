import { test, expect } from '@playwright/test';
import { getTokenForRole } from '../../fixtures/api.fixtures';
import { createDepartmentData } from '../../fixtures/data.fixtures';

/**
 * Department API Tests
 *
 * Direct API endpoint tests for department management:
 * - GET /api/v1/departments (list)
 * - POST /api/v1/departments (create)
 * - PUT /api/v1/departments/:id (update)
 * - DELETE /api/v1/departments/:id (delete)
 * - Error scenarios
 */

test.describe('Department API', () => {
  const baseURL = 'https://localhost:44378/api/v1';
  let authToken: string;
  let testDepartmentId: number;

  test.beforeAll(async ({ request }) => {
    // Get authentication token for Manager role
    authToken = await getTokenForRole(request, 'manager');
  });

  test.afterEach(async ({ request }) => {
    // Cleanup: delete test department if created
    if (testDepartmentId) {
      try {
        await request.delete(`${baseURL}/departments/${testDepartmentId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
      } catch {
        // Ignore cleanup errors
      }
      testDepartmentId = 0;
    }
  });

  test('should GET list of departments', async ({ request }) => {
    const response = await request.get(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();

    // Response should be an array or have a data property with an array
    if (Array.isArray(data)) {
      expect(data.length).toBeGreaterThanOrEqual(0);
    } else if (data.data && Array.isArray(data.data)) {
      expect(data.data.length).toBeGreaterThanOrEqual(0);
    } else if (data.items && Array.isArray(data.items)) {
      expect(data.items.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should POST create new department', async ({ request }) => {
    const departmentData = createDepartmentData({
      name: `API_Dept_${Date.now()}`,
      description: 'Created via API test',
    });

    const response = await request.post(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: departmentData,
    });

    expect(response.status()).toBe(201);

    const created = await response.json();
    const createdDept = created.data || created;

    testDepartmentId = createdDept.id || createdDept.departmentId;

    expect(createdDept.name).toBe(departmentData.name);
    expect(createdDept.description).toBe(departmentData.description);
    expect(testDepartmentId).toBeGreaterThan(0);
  });

  test('should GET department by ID', async ({ request }) => {
    // First, create a test department
    const departmentData = createDepartmentData({
      name: `API_GetById_${Date.now()}`,
      description: 'Test get by ID',
    });

    const createResponse = await request.post(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: departmentData,
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    testDepartmentId = created.id || created.departmentId || created.data?.id;

    // Now get the department by ID
    const response = await request.get(`${baseURL}/departments/${testDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const department = await response.json();
    const deptData = department.data || department;

    expect(deptData.name).toBe(departmentData.name);
    expect(deptData.description).toBe(departmentData.description);
  });

  test('should PUT update department', async ({ request }) => {
    // First, create a test department
    const departmentData = createDepartmentData({
      name: `API_Update_${Date.now()}`,
      description: 'Original description',
    });

    const createResponse = await request.post(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: departmentData,
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    testDepartmentId = created.id || created.departmentId || created.data?.id;

    // Now update the department
    const updatedData = {
      ...departmentData,
      id: testDepartmentId,
      description: 'Updated description via API',
    };

    const response = await request.put(`${baseURL}/departments/${testDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: updatedData,
    });

    expect([200, 204]).toContain(response.status());

    // Verify update by getting the department
    const getResponse = await request.get(`${baseURL}/departments/${testDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const department = await getResponse.json();
    const deptData = department.data || department;

    expect(deptData.description).toBe('Updated description via API');
  });

  test('should DELETE department', async ({ request }) => {
    // Create a test department first
    const departmentData = createDepartmentData({
      name: `API_Delete_${Date.now()}`,
      description: 'To be deleted',
    });

    const createResponse = await request.post(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: departmentData,
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    const departmentId = created.id || created.departmentId || created.data?.id;

    // Delete the department
    const response = await request.delete(`${baseURL}/departments/${departmentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 204]).toContain(response.status());

    // Verify deletion - GET should return 404
    const getResponse = await request.get(`${baseURL}/departments/${departmentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(getResponse.status()).toBe(404);

    // Don't need cleanup since already deleted
    testDepartmentId = 0;
  });

  test('should return 401 without authentication', async ({ request }) => {
    const response = await request.get(`${baseURL}/departments`, {
      headers: {
        // No Authorization header
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should return 400 for invalid data on create', async ({ request }) => {
    const invalidData = {
      name: '', // Empty required field
      description: 'Invalid department',
    };

    const response = await request.post(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: invalidData,
    });

    expect([400, 422]).toContain(response.status());
  });

  test('should return 404 for non-existent department ID', async ({ request }) => {
    const invalidId = 999999999;

    const response = await request.get(`${baseURL}/departments/${invalidId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(404);
  });

  test('should validate required name field', async ({ request }) => {
    const incompleteData = {
      description: 'Missing name field',
      // name is missing
    };

    const response = await request.post(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: incompleteData,
    });

    expect([400, 422]).toContain(response.status());

    const error = await response.json();
    expect(error).toBeDefined();
  });

  test('should handle duplicate department names', async ({ request }) => {
    // Create first department
    const departmentData = createDepartmentData({
      name: `API_Duplicate_${Date.now()}`,
      description: 'Original',
    });

    const firstResponse = await request.post(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: departmentData,
    });

    expect(firstResponse.status()).toBe(201);
    const created = await firstResponse.json();
    testDepartmentId = created.id || created.departmentId || created.data?.id;

    // Try to create duplicate
    const duplicateData = {
      name: departmentData.name, // Same name
      description: 'Duplicate attempt',
    };

    const response = await request.post(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: duplicateData,
    });

    // Should return error (400, 409 Conflict, or 422)
    expect([400, 409, 422]).toContain(response.status());
  });

  test('should return proper content-type header', async ({ request }) => {
    const response = await request.get(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should support search/filter parameters', async ({ request }) => {
    const response = await request.get(`${baseURL}/departments?search=test`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();

    // Response should be valid
    if (Array.isArray(data)) {
      expect(Array.isArray(data)).toBe(true);
    } else if (data.data || data.items) {
      expect(Array.isArray(data.data || data.items)).toBe(true);
    }
  });
});

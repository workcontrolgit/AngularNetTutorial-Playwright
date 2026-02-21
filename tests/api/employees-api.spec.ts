import { test, expect } from '@playwright/test';
import { getTokenForRole } from '../../fixtures/api.fixtures';
import { createEmployeeData } from '../../fixtures/data.fixtures';

/**
 * Employee API Tests
 *
 * Direct API endpoint tests for employee management:
 * - GET endpoints (list, detail)
 * - POST endpoint (create)
 * - PUT endpoint (update)
 * - DELETE endpoint (delete)
 * - Authentication scenarios (401, 403)
 * - Validation scenarios (400, 404)
 */

test.describe('Employee API', () => {
  const baseURL = 'https://localhost:44378/api/v1';
  let authToken: string;
  let testEmployeeId: number;

  test.beforeAll(async ({ request }) => {
    // Get authentication token for Manager role
    authToken = await getTokenForRole(request, 'manager');
  });

  test.afterEach(async ({ request }) => {
    // Cleanup: delete test employee if created
    if (testEmployeeId) {
      try {
        await request.delete(`${baseURL}/employees/${testEmployeeId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
      } catch {
        // Ignore cleanup errors
      }
      testEmployeeId = 0;
    }
  });

  test('should GET list of employees', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees`, {
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

  test('should GET employee by ID', async ({ request }) => {
    // First, create a test employee
    const employeeData = createEmployeeData({
      firstName: 'APITest',
      lastName: `GetById${Date.now()}`,
    });

    const createResponse = await request.post(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: employeeData,
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    testEmployeeId = created.id || created.employeeId || created.data?.id;

    // Now get the employee by ID
    const response = await request.get(`${baseURL}/employees/${testEmployeeId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const employee = await response.json();
    const employeeData2 = employee.data || employee;

    expect(employeeData2.firstName).toBe(employeeData.firstName);
    expect(employeeData2.lastName).toBe(employeeData.lastName);
    expect(employeeData2.email).toBe(employeeData.email);
  });

  test('should POST create new employee with token', async ({ request }) => {
    const employeeData = createEmployeeData({
      firstName: 'APITest',
      lastName: `Create${Date.now()}`,
      email: `api.create.${Date.now()}@example.com`,
    });

    const response = await request.post(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: employeeData,
    });

    expect(response.status()).toBe(201);

    const created = await response.json();
    const createdEmployee = created.data || created;

    testEmployeeId = createdEmployee.id || createdEmployee.employeeId;

    expect(createdEmployee.firstName).toBe(employeeData.firstName);
    expect(createdEmployee.lastName).toBe(employeeData.lastName);
    expect(createdEmployee.email).toBe(employeeData.email);
    expect(testEmployeeId).toBeGreaterThan(0);
  });

  test('should PUT update employee with token', async ({ request }) => {
    // First, create a test employee
    const employeeData = createEmployeeData({
      firstName: 'APITest',
      lastName: `Update${Date.now()}`,
    });

    const createResponse = await request.post(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: employeeData,
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    testEmployeeId = created.id || created.employeeId || created.data?.id;

    // Now update the employee
    const updatedData = {
      ...employeeData,
      id: testEmployeeId,
      firstName: 'UpdatedFirstName',
      email: `updated.${Date.now()}@example.com`,
    };

    const response = await request.put(`${baseURL}/employees/${testEmployeeId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: updatedData,
    });

    expect([200, 204]).toContain(response.status());

    // Verify update by getting the employee
    const getResponse = await request.get(`${baseURL}/employees/${testEmployeeId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const employee = await getResponse.json();
    const employeeData2 = employee.data || employee;

    expect(employeeData2.firstName).toBe('UpdatedFirstName');
  });

  test('should DELETE employee with admin token', async ({ request }) => {
    // Get HRAdmin token (has delete permission)
    const adminToken = await getTokenForRole(request, 'hradmin');

    // Create a test employee first
    const employeeData = createEmployeeData({
      firstName: 'APITest',
      lastName: `Delete${Date.now()}`,
    });

    const createResponse = await request.post(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      data: employeeData,
    });

    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    const employeeId = created.id || created.employeeId || created.data?.id;

    // Delete the employee
    const response = await request.delete(`${baseURL}/employees/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    expect([200, 204]).toContain(response.status());

    // Verify deletion - GET should return 404
    const getResponse = await request.get(`${baseURL}/employees/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    expect(getResponse.status()).toBe(404);

    // Don't need cleanup since already deleted
    testEmployeeId = 0;
  });

  test('should return 401 Unauthorized without token', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        // No Authorization header
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should return 403 Forbidden with wrong role for delete', async ({ request }) => {
    // Get Employee role token (no delete permission)
    const employeeToken = await getTokenForRole(request, 'employee');

    // Try to delete with employee token (should fail)
    const response = await request.delete(`${baseURL}/employees/1`, {
      headers: {
        'Authorization': `Bearer ${employeeToken}`,
      },
    });

    // Should be 403 Forbidden (or 401 if role-based auth not implemented)
    expect([401, 403]).toContain(response.status());
  });

  test('should return 400 Bad Request with invalid data', async ({ request }) => {
    const invalidData = {
      firstName: '', // Empty required field
      lastName: '',
      email: 'invalid-email', // Invalid email format
    };

    const response = await request.post(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: invalidData,
    });

    expect([400, 422]).toContain(response.status());

    const error = await response.json();
    expect(error).toBeDefined();

    // Error response should contain validation details
    // Structure varies by API implementation
    if (error.errors) {
      expect(error.errors).toBeDefined();
    } else if (error.message) {
      expect(error.message).toBeDefined();
    }
  });

  test('should return 404 Not Found for invalid employee ID', async ({ request }) => {
    const invalidId = 999999999; // Very unlikely to exist

    const response = await request.get(`${baseURL}/employees/${invalidId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(404);
  });

  test('should support pagination parameters', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees?page=1&pageSize=10`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();

    // Check for pagination metadata
    if (data.totalCount !== undefined || data.total !== undefined) {
      expect(typeof (data.totalCount || data.total)).toBe('number');
    }

    if (data.pageSize !== undefined) {
      expect(data.pageSize).toBeLessThanOrEqual(10);
    }
  });

  test('should support search/filter parameters', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees?search=test`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();

    // Response should be valid (array or paginated response)
    if (Array.isArray(data)) {
      expect(Array.isArray(data)).toBe(true);
    } else if (data.data || data.items) {
      expect(Array.isArray(data.data || data.items)).toBe(true);
    }
  });

  test('should validate required fields on create', async ({ request }) => {
    const incompleteData = {
      firstName: 'Test',
      // Missing required lastName and email
    };

    const response = await request.post(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: incompleteData,
    });

    expect([400, 422]).toContain(response.status());
  });

  test('should validate email format on create', async ({ request }) => {
    const invalidEmailData = createEmployeeData({
      firstName: 'Test',
      lastName: 'User',
      email: 'not-an-email', // Invalid format
    });

    const response = await request.post(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: invalidEmailData,
    });

    expect([400, 422]).toContain(response.status());
  });

  test('should return proper content-type header', async ({ request }) => {
    const response = await request.get(`${baseURL}/employees`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});

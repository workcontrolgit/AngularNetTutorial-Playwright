import { APIRequestContext } from '@playwright/test';
import type { EmployeeData, DepartmentData } from './data.fixtures';

/**
 * API Fixtures
 *
 * Provides helper functions for API operations:
 * - Creating resources via API
 * - Deleting resources for test cleanup
 * - Making authenticated API requests
 */

const API_BASE_URL = 'https://localhost:44378/api/v1';

/**
 * Makes an authenticated API request
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token for authorization
 * @param method - HTTP method
 * @param endpoint - API endpoint (relative to base URL)
 * @param data - Request body data (optional)
 * @returns Promise resolving to API response
 */
async function makeAuthenticatedRequest(
  request: APIRequestContext,
  token: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
) {
  const url = `${API_BASE_URL}${endpoint}`;

  const options: any = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ignoreHTTPSErrors: true,
  };

  if (data) {
    options.data = data;
  }

  switch (method) {
    case 'GET':
      return await request.get(url, options);
    case 'POST':
      return await request.post(url, options);
    case 'PUT':
      return await request.put(url, options);
    case 'DELETE':
      return await request.delete(url, options);
  }
}

/**
 * Creates an employee via API
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token (must have write permission)
 * @param data - Employee data
 * @returns Promise resolving to created employee (with ID)
 *
 * @example
 * const employee = await createEmployee(request, token, {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john.doe@example.com'
 * });
 */
export async function createEmployee(
  request: APIRequestContext,
  token: string,
  data: EmployeeData
): Promise<any> {
  const response = await makeAuthenticatedRequest(
    request,
    token,
    'POST',
    '/employees',
    data
  );

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to create employee: ${response.status()} - ${errorText}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Deletes an employee via API
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token (must have delete permission)
 * @param id - Employee ID to delete
 * @returns Promise that resolves when deletion is complete
 *
 * @example
 * await deleteEmployee(request, token, 123);
 */
export async function deleteEmployee(
  request: APIRequestContext,
  token: string,
  id: number
): Promise<void> {
  const response = await makeAuthenticatedRequest(
    request,
    token,
    'DELETE',
    `/employees/${id}`
  );

  if (!response.ok() && response.status() !== 404) {
    const errorText = await response.text();
    throw new Error(`Failed to delete employee: ${response.status()} - ${errorText}`);
  }
}

/**
 * Gets employee by ID via API
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token
 * @param id - Employee ID
 * @returns Promise resolving to employee data
 */
export async function getEmployee(
  request: APIRequestContext,
  token: string,
  id: number
): Promise<any> {
  const response = await makeAuthenticatedRequest(
    request,
    token,
    'GET',
    `/employees/${id}`
  );

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to get employee: ${response.status()} - ${errorText}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Creates a department via API
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token (must have write permission)
 * @param data - Department data
 * @returns Promise resolving to created department (with ID)
 *
 * @example
 * const department = await createDepartment(request, token, {
 *   name: 'Engineering',
 *   description: 'Software Development'
 * });
 */
export async function createDepartment(
  request: APIRequestContext,
  token: string,
  data: DepartmentData
): Promise<any> {
  const response = await makeAuthenticatedRequest(
    request,
    token,
    'POST',
    '/departments',
    data
  );

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to create department: ${response.status()} - ${errorText}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Deletes a department via API
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token (must have delete permission)
 * @param id - Department ID to delete
 * @returns Promise that resolves when deletion is complete
 *
 * @example
 * await deleteDepartment(request, token, 456);
 */
export async function deleteDepartment(
  request: APIRequestContext,
  token: string,
  id: number
): Promise<void> {
  const response = await makeAuthenticatedRequest(
    request,
    token,
    'DELETE',
    `/departments/${id}`
  );

  if (!response.ok() && response.status() !== 404) {
    const errorText = await response.text();
    throw new Error(`Failed to delete department: ${response.status()} - ${errorText}`);
  }
}

/**
 * Gets all employees via API
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token
 * @returns Promise resolving to array of employees
 */
export async function getAllEmployees(
  request: APIRequestContext,
  token: string
): Promise<any[]> {
  const response = await makeAuthenticatedRequest(
    request,
    token,
    'GET',
    '/employees'
  );

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to get employees: ${response.status()} - ${errorText}`);
  }

  const result = await response.json();
  return result.data || result.items || result;
}

/**
 * Gets all departments via API
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token
 * @returns Promise resolving to array of departments
 */
export async function getAllDepartments(
  request: APIRequestContext,
  token: string
): Promise<any[]> {
  const response = await makeAuthenticatedRequest(
    request,
    token,
    'GET',
    '/departments'
  );

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to get departments: ${response.status()} - ${errorText}`);
  }

  const result = await response.json();
  return result.data || result.items || result;
}

/**
 * Updates an employee via API
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token (must have write permission)
 * @param id - Employee ID to update
 * @param data - Updated employee data
 * @returns Promise resolving to updated employee
 */
export async function updateEmployee(
  request: APIRequestContext,
  token: string,
  id: number,
  data: Partial<EmployeeData>
): Promise<any> {
  const response = await makeAuthenticatedRequest(
    request,
    token,
    'PUT',
    `/employees/${id}`,
    data
  );

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to update employee: ${response.status()} - ${errorText}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Cleans up test data by deleting multiple employees
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token (must have delete permission)
 * @param ids - Array of employee IDs to delete
 * @returns Promise that resolves when all deletions are complete
 *
 * @example
 * await cleanupEmployees(request, token, [1, 2, 3]);
 */
export async function cleanupEmployees(
  request: APIRequestContext,
  token: string,
  ids: number[]
): Promise<void> {
  await Promise.all(
    ids.map(id => deleteEmployee(request, token, id).catch(() => {
      // Ignore errors during cleanup
    }))
  );
}

/**
 * Cleans up test data by deleting multiple departments
 *
 * @param request - Playwright APIRequestContext
 * @param token - Bearer token (must have delete permission)
 * @param ids - Array of department IDs to delete
 * @returns Promise that resolves when all deletions are complete
 *
 * @example
 * await cleanupDepartments(request, token, [10, 11, 12]);
 */
export async function cleanupDepartments(
  request: APIRequestContext,
  token: string,
  ids: number[]
): Promise<void> {
  await Promise.all(
    ids.map(id => deleteDepartment(request, token, id).catch(() => {
      // Ignore errors during cleanup
    }))
  );
}

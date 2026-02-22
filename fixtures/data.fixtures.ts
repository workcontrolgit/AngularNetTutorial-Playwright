/**
 * Test Data Fixtures
 *
 * Provides factory functions for generating test data with sensible defaults
 * and the ability to override specific fields.
 */

export interface EmployeeData {
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 0 | 1 | 2; // 0 = Male, 1 = Female, 2 = Other (API enum values)
  hireDate?: string;
  salary?: number;
  positionId?: number;
  departmentId?: number;
}

export interface DepartmentData {
  name?: string;
  location?: string;
  managerId?: number;
}

export interface PositionData {
  title?: string;
  description?: string;
  salaryRangeId?: number;
  level?: string;
}

export interface SalaryRangeData {
  name?: string;
  minSalary?: number;
  maxSalary?: number;
}

/**
 * Generates a random employee number
 */
function generateEmployeeNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `EMP${timestamp}${random}`;
}

/**
 * Generates a random email address
 */
function generateEmail(firstName: string, lastName: string): string {
  const domain = 'example.com';
  const timestamp = Date.now().toString().slice(-4);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}@${domain}`;
}

/**
 * Generates a random phone number
 */
function generatePhoneNumber(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const firstPart = Math.floor(Math.random() * 900) + 100;
  const secondPart = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${firstPart}-${secondPart}`;
}

/**
 * Generates a random date within a range
 */
function generateRandomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

/**
 * Creates employee test data with defaults and optional overrides
 *
 * @param overrides - Partial employee data to override defaults
 * @returns Complete employee data object
 *
 * @example
 * const employee = createEmployeeData({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   salary: 75000
 * });
 */
export function createEmployeeData(overrides: EmployeeData = {}): Required<EmployeeData> {
  const firstName = overrides.firstName || 'Test';
  const lastName = overrides.lastName || `User${Math.floor(Math.random() * 10000)}`;

  return {
    employeeNumber: overrides.employeeNumber || generateEmployeeNumber(),
    firstName,
    lastName,
    email: overrides.email || generateEmail(firstName, lastName),
    phoneNumber: overrides.phoneNumber || generatePhoneNumber(),
    dateOfBirth: overrides.dateOfBirth || generateRandomDate(1970, 2000),
    gender: overrides.gender ?? 0, // 0 = Male (default)
    hireDate: overrides.hireDate || generateRandomDate(2020, 2024),
    salary: overrides.salary || Math.floor(Math.random() * 50000) + 50000,
    positionId: overrides.positionId || 1,
    departmentId: overrides.departmentId || 1,
  };
}

/**
 * Creates department test data with defaults and optional overrides
 *
 * @param overrides - Partial department data to override defaults
 * @returns Complete department data object
 *
 * @example
 * const department = createDepartmentData({
 *   name: 'Engineering',
 *   location: 'Building A'
 * });
 */
export function createDepartmentData(overrides: DepartmentData = {}): Required<DepartmentData> {
  const deptNumber = Math.floor(Math.random() * 1000);
  return {
    name: overrides.name || `Test Department ${deptNumber}`,
    location: overrides.location || `Floor ${Math.floor(Math.random() * 10) + 1}`,
    managerId: overrides.managerId || 1,
  };
}

/**
 * Creates position test data with defaults and optional overrides
 *
 * @param overrides - Partial position data to override defaults
 * @returns Complete position data object
 *
 * @example
 * const position = createPositionData({
 *   title: 'Senior Developer',
 *   level: 'Senior'
 * });
 */
export function createPositionData(overrides: PositionData = {}): Required<PositionData> {
  const posNumber = Math.floor(Math.random() * 1000);
  const levels = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];
  const randomLevel = levels[Math.floor(Math.random() * levels.length)];

  return {
    title: overrides.title || `Test Position ${posNumber}`,
    description: overrides.description || `Test position created for automated testing`,
    salaryRangeId: overrides.salaryRangeId || 1,
    level: overrides.level || randomLevel,
  };
}

/**
 * Creates salary range test data with defaults and optional overrides
 *
 * @param overrides - Partial salary range data to override defaults
 * @returns Complete salary range data object
 *
 * @example
 * const salaryRange = createSalaryRangeData({
 *   title: 'Level 3 Range',
 *   minSalary: 80000,
 *   maxSalary: 120000
 * });
 */
export function createSalaryRangeData(overrides: SalaryRangeData = {}): Required<SalaryRangeData> {
  const rangeNumber = Math.floor(Math.random() * 1000);
  const baseMin = overrides.minSalary || Math.floor(Math.random() * 50000) + 40000;
  const baseMax = overrides.maxSalary || baseMin + 30000;

  return {
    name: overrides.name || `Test Salary Range ${rangeNumber}`,
    minSalary: baseMin,
    maxSalary: baseMax,
  };
}

/**
 * Creates multiple employee records
 *
 * @param count - Number of employees to create
 * @param overrides - Common overrides to apply to all employees
 * @returns Array of employee data objects
 *
 * @example
 * const employees = createMultipleEmployees(5, { departmentId: 2 });
 */
export function createMultipleEmployees(
  count: number,
  overrides: EmployeeData = {}
): Required<EmployeeData>[] {
  return Array.from({ length: count }, () => createEmployeeData(overrides));
}

/**
 * Creates multiple department records
 *
 * @param count - Number of departments to create
 * @param overrides - Common overrides to apply to all departments
 * @returns Array of department data objects
 *
 * @example
 * const departments = createMultipleDepartments(3);
 */
export function createMultipleDepartments(
  count: number,
  overrides: DepartmentData = {}
): Required<DepartmentData>[] {
  return Array.from({ length: count }, () => createDepartmentData(overrides));
}

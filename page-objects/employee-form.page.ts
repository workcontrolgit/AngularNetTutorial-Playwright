import { Page, Locator } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Employee Form Page Object
 *
 * Employee-specific extension of BaseFormPage.
 * Adds field locators and fill/select methods for the create/edit employee form.
 *
 * Shared logic (submit, cancel, validation, success verification) lives in BaseFormPage.
 */
export class EmployeeFormPage extends BaseFormPage {
  // ── Employee-specific field locators ────────────────────────────────────
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly employeeNumberInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly salaryInput: Locator;
  readonly dateOfBirthInput: Locator;
  readonly positionSelect: Locator;
  readonly departmentSelect: Locator;
  readonly genderSelect: Locator;
  readonly hireDateInput: Locator;

  readonly requiredFieldError: Locator;
  readonly emailFormatError: Locator;

  constructor(page: Page) {
    super(page, '/employees');

    this.firstNameInput = page.locator('input[name*="firstName"], input[formControlName="firstName"]');
    this.lastNameInput = page.locator('input[name*="lastName"], input[formControlName="lastName"]');
    this.emailInput = page.locator('input[name*="email"], input[formControlName="email"]');
    this.employeeNumberInput = page.locator('input[name*="employeeNumber"], input[formControlName="employeeNumber"]');
    this.phoneNumberInput = page.locator('input[name*="phone"], input[formControlName="phoneNumber"]');
    this.salaryInput = page.locator('input[name*="salary"], input[formControlName="salary"]');
    this.dateOfBirthInput = page.locator('input[name*="dateOfBirth"], input[formControlName="dateOfBirth"], input[type="date"]');
    this.positionSelect = page.locator('mat-select[formControlName="positionId"], select[name*="position"]');
    this.departmentSelect = page.locator('mat-select[formControlName="departmentId"], select[name*="department"]');
    this.genderSelect = page.locator('mat-select[formControlName="gender"], select[name*="gender"]');
    this.hireDateInput = page.locator('input[name*="hireDate"], input[formControlName="hireDate"]');

    this.requiredFieldError = page.locator('.mat-error, .error').filter({ hasText: /required/i });
    this.emailFormatError = page.locator('.mat-error, .error').filter({ hasText: /email|valid|format/i });
  }

  // ── Employee-specific form-filled check ─────────────────────────────────

  protected async isFormStillFilled(): Promise<boolean> {
    const firstNameValue = await this.page.getByLabel('First Name').inputValue().catch(() => '');
    const lastNameValue = await this.page.getByLabel('Last Name').inputValue().catch(() => '');
    return firstNameValue.length > 0 && lastNameValue.length > 0;
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async gotoCreate() {
    await this.page.goto('/employees/create');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoEdit(employeeId: number) {
    await this.page.goto(`/employees/${employeeId}/edit`);
    await this.page.waitForLoadState('networkidle');
  }

  // ── Field fill methods ──────────────────────────────────────────────────

  async fillFirstName(firstName: string) {
    await this.firstNameInput.fill(firstName);
  }

  async fillLastName(lastName: string) {
    await this.lastNameInput.fill(lastName);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillEmployeeNumber(employeeNumber: string) {
    const isVisible = await this.employeeNumberInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) await this.employeeNumberInput.fill(employeeNumber);
  }

  async fillPhoneNumber(phoneNumber: string) {
    try {
      await this.page.getByLabel('Phone Number').fill(phoneNumber);
      await this.page.waitForTimeout(300);
    } catch {
      try { await this.phoneNumberInput.fill(phoneNumber, { timeout: 2000 }); } catch {}
    }
  }

  async fillDateOfBirth(dateOfBirth: string) {
    try {
      await this.page.getByLabel('Date of Birth').fill(dateOfBirth);
      await this.page.waitForTimeout(300);
    } catch {
      try { await this.dateOfBirthInput.fill(dateOfBirth, { timeout: 2000 }); } catch {}
    }
  }

  async fillSalary(salary: number | string) {
    const isVisible = await this.salaryInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) await this.salaryInput.fill(salary.toString());
  }

  async fillHireDate(date: string) {
    const isVisible = await this.hireDateInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) await this.hireDateInput.fill(date);
  }

  // ── Dropdown selection methods ──────────────────────────────────────────
  // Uses .nth(1) by default to skip blank placeholder option

  async selectPosition(positionName: string | number = 1) {
    await this.selectDropdown(this.positionSelect, positionName);
  }

  async selectDepartment(departmentName: string | number = 1) {
    await this.selectDropdown(this.departmentSelect, departmentName);
  }

  async selectGender(genderName: string | number = 1) {
    await this.selectDropdown(this.genderSelect, genderName);
  }

  // ── fillForm convenience method ─────────────────────────────────────────

  async fillForm(employeeData: {
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    salary?: number;
    position?: string | number;
    department?: string | number;
    gender?: string | number;
    hireDate?: string;
  }) {
    await this.fillFirstName(employeeData.firstName);
    await this.fillLastName(employeeData.lastName);
    await this.fillEmail(employeeData.email);

    if (employeeData.employeeNumber) await this.fillEmployeeNumber(employeeData.employeeNumber);
    if (employeeData.dateOfBirth)    await this.fillDateOfBirth(employeeData.dateOfBirth);
    if (employeeData.phoneNumber)    await this.fillPhoneNumber(employeeData.phoneNumber);
    if (employeeData.salary)         await this.fillSalary(employeeData.salary);
    if (employeeData.position !== undefined)   await this.selectPosition(employeeData.position);
    if (employeeData.department !== undefined) await this.selectDepartment(employeeData.department);
    if (employeeData.gender !== undefined)     await this.selectGender(employeeData.gender);
    if (employeeData.hireDate)       await this.fillHireDate(employeeData.hireDate);
  }

  // ── Field utilities ─────────────────────────────────────────────────────

  async clearField(fieldName: 'firstName' | 'lastName' | 'email' | 'employeeNumber' | 'phoneNumber' | 'salary') {
    const fieldMap = {
      firstName: this.firstNameInput,
      lastName: this.lastNameInput,
      email: this.emailInput,
      employeeNumber: this.employeeNumberInput,
      phoneNumber: this.phoneNumberInput,
      salary: this.salaryInput,
    };
    await fieldMap[fieldName].clear();
  }

  async blurField(fieldName: 'firstName' | 'lastName' | 'email' | 'employeeNumber' | 'phoneNumber' | 'salary') {
    const fieldMap = {
      firstName: this.firstNameInput,
      lastName: this.lastNameInput,
      email: this.emailInput,
      employeeNumber: this.employeeNumberInput,
      phoneNumber: this.phoneNumberInput,
      salary: this.salaryInput,
    };
    await fieldMap[fieldName].blur();
    await this.page.waitForTimeout(500);
  }

  async getFieldValue(fieldName: 'firstName' | 'lastName' | 'email' | 'employeeNumber' | 'phoneNumber' | 'salary'): Promise<string> {
    const fieldMap = {
      firstName: this.firstNameInput,
      lastName: this.lastNameInput,
      email: this.emailInput,
      employeeNumber: this.employeeNumberInput,
      phoneNumber: this.phoneNumberInput,
      salary: this.salaryInput,
    };
    return await fieldMap[fieldName].inputValue();
  }

  async isEditMode(): Promise<boolean> {
    const firstNameValue = await this.firstNameInput.inputValue();
    const lastNameValue = await this.lastNameInput.inputValue();
    return firstNameValue.length > 0 || lastNameValue.length > 0;
  }

  async getFormData(): Promise<{
    firstName: string; lastName: string; email: string;
    employeeNumber: string; phoneNumber: string; salary: string;
  }> {
    return {
      firstName:      await this.getFieldValue('firstName'),
      lastName:       await this.getFieldValue('lastName'),
      email:          await this.getFieldValue('email'),
      employeeNumber: await this.getFieldValue('employeeNumber'),
      phoneNumber:    await this.getFieldValue('phoneNumber'),
      salary:         await this.getFieldValue('salary'),
    };
  }
}

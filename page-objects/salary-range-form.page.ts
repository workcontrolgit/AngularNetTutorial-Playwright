import { Page, Locator } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Salary Range Form Page Object
 *
 * Angular source facts:
 * - Form fields: name (required, maxLength(100)), minSalary (required, min(0)), maxSalary (required, min(0))
 * - Custom validator: minSalary must be less than maxSalary (shows when form.touched)
 * - No currency field in the form — currency is not part of the form
 * - Submit button is NOT disabled by validation (no [disabled]="salaryRangeForm.invalid")
 * - onSubmit() does NOT call markAllAsTouched() — errors only appear after focus+blur
 */
export class SalaryRangeFormPage extends BaseFormPage {
  readonly nameInput: Locator;
  readonly minSalaryInput: Locator;
  readonly maxSalaryInput: Locator;

  constructor(page: Page) {
    super(page, '/salary-ranges');

    this.nameInput = page.locator('input[formControlName="name"]');
    this.minSalaryInput = page.locator('input[formControlName="minSalary"]');
    this.maxSalaryInput = page.locator('input[formControlName="maxSalary"]');
  }

  protected async isFormStillFilled(): Promise<boolean> {
    const nameValue = await this.nameInput.inputValue().catch(() => '');
    if (nameValue.length > 0) return true;
    const minValue = await this.minSalaryInput.inputValue().catch(() => '');
    return minValue.length > 0;
  }

  // ── Field fill methods ──────────────────────────────────────────────────

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillMinSalary(amount: number | string) {
    await this.minSalaryInput.fill(amount.toString());
  }

  async fillMaxSalary(amount: number | string) {
    await this.maxSalaryInput.fill(amount.toString());
  }

  // ── fillForm convenience method ─────────────────────────────────────────

  async fillForm(data: { name?: string; minSalary?: number; maxSalary?: number }) {
    if (data.name) await this.fillName(data.name);
    if (data.minSalary !== undefined) await this.fillMinSalary(data.minSalary);
    if (data.maxSalary !== undefined) await this.fillMaxSalary(data.maxSalary);
  }
}

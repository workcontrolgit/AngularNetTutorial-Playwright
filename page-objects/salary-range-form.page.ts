import { Page, Locator } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Salary Range Form Page Object
 *
 * Covers the create/edit salary range form (HRAdmin only).
 * Shared behaviour (submit, cancel, validation, success) comes from BaseFormPage.
 */
export class SalaryRangeFormPage extends BaseFormPage {
  readonly titleInput: Locator;
  readonly minSalaryInput: Locator;
  readonly maxSalaryInput: Locator;

  constructor(page: Page) {
    super(page, '/salary-ranges');

    this.titleInput = page.locator('input[formControlName="title"], input[name*="title"]');
    this.minSalaryInput = page.locator(
      'input[formControlName="minSalary"], input[name*="minSalary"], input[name*="min"]'
    );
    this.maxSalaryInput = page.locator(
      'input[formControlName="maxSalary"], input[name*="maxSalary"], input[name*="max"]'
    );
  }

  protected async isFormStillFilled(): Promise<boolean> {
    const titleValue = await this.titleInput.inputValue().catch(() => '');
    if (titleValue.length > 0) return true;
    // Fall back to checking min salary (salary range may not have a title field)
    const minValue = await this.minSalaryInput.inputValue().catch(() => '');
    return minValue.length > 0;
  }

  // ── Field fill methods ──────────────────────────────────────────────────

  async fillTitle(title: string) {
    const isVisible = await this.titleInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) await this.titleInput.fill(title);
  }

  async fillMinSalary(amount: number | string) {
    await this.minSalaryInput.fill(amount.toString());
  }

  async fillMaxSalary(amount: number | string) {
    await this.maxSalaryInput.fill(amount.toString());
  }

  // ── fillForm convenience method ─────────────────────────────────────────

  async fillForm(data: { title?: string; minSalary?: number; maxSalary?: number }) {
    if (data.title) await this.fillTitle(data.title);
    if (data.minSalary !== undefined) await this.fillMinSalary(data.minSalary);
    if (data.maxSalary !== undefined) await this.fillMaxSalary(data.maxSalary);
  }
}

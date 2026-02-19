import { Page, Locator } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Position Form Page Object
 *
 * Covers the create/edit position form (HRAdmin only).
 * Shared behaviour (submit, cancel, validation, success) comes from BaseFormPage.
 */
export class PositionFormPage extends BaseFormPage {
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly salaryRangeSelect: Locator;

  constructor(page: Page) {
    super(page, '/positions');

    // Positions may use "title" or "name" depending on the Angular form binding
    this.titleInput = page.locator(
      'input[formControlName="title"], input[name*="title"], ' +
      'input[formControlName="name"], input[name*="name"]'
    );
    this.descriptionInput = page.locator(
      'textarea[formControlName="description"], textarea[name*="description"]'
    );
    this.salaryRangeSelect = page.locator(
      'mat-select[formControlName="salaryRangeId"], select[name*="salaryRange"]'
    );
  }

  protected async isFormStillFilled(): Promise<boolean> {
    const value = await this.titleInput.inputValue().catch(() => '');
    return value.length > 0;
  }

  // ── Field fill methods ──────────────────────────────────────────────────

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async fillDescription(description: string) {
    const isVisible = await this.descriptionInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) await this.descriptionInput.fill(description);
  }

  async selectSalaryRange(value: string | number = 1) {
    await this.selectDropdown(this.salaryRangeSelect, value);
  }

  // ── fillForm convenience method ─────────────────────────────────────────

  async fillForm(data: { title: string; description?: string; salaryRange?: string | number }) {
    await this.fillTitle(data.title);
    if (data.description) await this.fillDescription(data.description);
    if (data.salaryRange !== undefined) await this.selectSalaryRange(data.salaryRange);
  }
}

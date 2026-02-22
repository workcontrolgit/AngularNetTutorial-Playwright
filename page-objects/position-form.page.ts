import { Page, Locator } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Position Form Page Object
 *
 * Covers the create/edit position form (HRAdmin only via route guard).
 * Shared behaviour (submit, cancel, validation, success) comes from BaseFormPage.
 *
 * Angular form fields (from position-form.component.ts):
 *   positionTitle       — required, maxLength(100)
 *   positionNumber      — required, maxLength(50)
 *   positionDescription — optional, maxLength(500)
 *   departmentId        — required (mat-select)
 *   salaryRangeId       — required (mat-select)
 */
export class PositionFormPage extends BaseFormPage {
  readonly titleInput: Locator;
  readonly positionNumberInput: Locator;
  readonly descriptionInput: Locator;
  readonly departmentSelect: Locator;
  readonly salaryRangeSelect: Locator;

  constructor(page: Page) {
    super(page, '/positions');

    this.titleInput = page.locator('input[formControlName="positionTitle"]');
    this.positionNumberInput = page.locator('input[formControlName="positionNumber"]');
    this.descriptionInput = page.locator('textarea[formControlName="positionDescription"]');
    this.departmentSelect = page.locator('mat-select[formControlName="departmentId"]');
    this.salaryRangeSelect = page.locator('mat-select[formControlName="salaryRangeId"]');
  }

  protected async isFormStillFilled(): Promise<boolean> {
    const value = await this.titleInput.inputValue().catch(() => '');
    return value.length > 0;
  }

  // ── Field fill methods ──────────────────────────────────────────────────

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async fillPositionNumber(positionNumber: string) {
    await this.positionNumberInput.fill(positionNumber);
  }

  async fillDescription(description: string) {
    const isVisible = await this.descriptionInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) await this.descriptionInput.fill(description);
  }

  /** Selects the first available option from a mat-select dropdown. */
  private async selectFirstOption(select: Locator): Promise<void> {
    const isVisible = await select.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isVisible) return;
    await select.click();
    const option = this.page.locator('mat-option').first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  // ── fillForm convenience method ─────────────────────────────────────────

  /**
   * Fills all required fields for a position form.
   * Automatically selects the first available department and salary range.
   * positionNumber defaults to PN-{timestamp} if not provided.
   */
  async fillForm(data: { title: string; positionNumber?: string; description?: string }) {
    await this.fillTitle(data.title);
    await this.fillPositionNumber(data.positionNumber ?? `PN-${Date.now()}`);
    await this.selectFirstOption(this.departmentSelect);
    await this.selectFirstOption(this.salaryRangeSelect);
    if (data.description) await this.fillDescription(data.description);
  }
}

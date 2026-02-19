import { Page, Locator } from '@playwright/test';
import { BaseFormPage } from './base-form.page';

/**
 * Department Form Page Object
 *
 * Covers the create/edit department form.
 * Shared behaviour (submit, cancel, validation, success) comes from BaseFormPage.
 */
export class DepartmentFormPage extends BaseFormPage {
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;

  constructor(page: Page) {
    super(page, '/departments');

    this.nameInput = page.locator('input[formControlName="name"], input[name*="name"]');
    this.descriptionInput = page.locator(
      'textarea[formControlName="description"], textarea[name*="description"], input[formControlName="description"]'
    );
  }

  protected async isFormStillFilled(): Promise<boolean> {
    const nameValue = await this.page.getByLabel('Name').inputValue().catch(
      () => this.nameInput.inputValue().catch(() => '')
    );
    return nameValue.length > 0;
  }

  // ── Field fill methods ──────────────────────────────────────────────────

  async fillName(name: string) {
    try {
      await this.page.getByLabel('Name').fill(name);
    } catch {
      await this.nameInput.fill(name);
    }
  }

  async fillDescription(description: string) {
    const isVisible = await this.descriptionInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) await this.descriptionInput.fill(description);
  }

  // ── fillForm convenience method ─────────────────────────────────────────

  async fillForm(data: { name: string; description?: string }) {
    await this.fillName(data.name);
    if (data.description) await this.fillDescription(data.description);
  }
}

import { Page, Locator } from '@playwright/test';
import { BaseListPage } from './base-list.page';

/**
 * Department List Page Object
 *
 * All shared list behaviour (search, pagination, CRUD buttons, permission checks)
 * comes from BaseListPage.
 *
 * Overrides searchInput because the department list uses a mat-autocomplete
 * bound to formControlName="Name" instead of a plain placeholder/name attribute.
 */
export class DepartmentListPage extends BaseListPage {
  override readonly searchInput: Locator;

  constructor(page: Page) {
    super(page, '/departments', 'departments');
    // Department list uses an autocomplete with formControlName="Name"
    this.searchInput = page.locator('input[formControlName="Name"]');
  }
}

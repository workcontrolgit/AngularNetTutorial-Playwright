import { Page, Locator } from '@playwright/test';
import { BaseListPage } from './base-list.page';

/**
 * Employee List Page Object
 *
 * Employee-specific extension of BaseListPage.
 * All shared list behaviour (search, pagination, CRUD buttons, permission checks)
 * lives in BaseListPage.
 *
 * This class provides:
 * - Employee-specific method aliases for backwards compatibility
 * - Pagination info helper
 */
export class EmployeeListPage extends BaseListPage {
  constructor(page: Page) {
    super(page, '/employees', 'employees');
  }

  // ── Employee-named aliases (keep tests readable) ────────────────────────

  async getEmployeeCount(): Promise<number> {
    return this.getRowCount();
  }

  getEmployeeRow(index: number): Locator {
    return this.getRow(index);
  }

  getEmployeeByName(name: string): Locator {
    return this.getRowByText(name);
  }

  async clickEmployee(index: number) {
    await this.clickRow(index);
  }

  async clickEmployeeByName(name: string) {
    await this.getRowByText(name).click();
    await this.page.waitForTimeout(1000);
  }

  // ── Back-compat alias for getRowData ───────────────────────────────────

  async getEmployeeData(rowIndex: number): Promise<string[]> {
    return this.getRowData(rowIndex);
  }
}

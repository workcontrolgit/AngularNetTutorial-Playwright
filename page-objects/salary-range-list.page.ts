import { Page } from '@playwright/test';
import { BaseListPage } from './base-list.page';

/**
 * Salary Range List Page Object
 *
 * All shared list behaviour (search, pagination, CRUD buttons, permission checks)
 * comes from BaseListPage.
 */
export class SalaryRangeListPage extends BaseListPage {
  constructor(page: Page) {
    super(page, '/salary-ranges', 'salary ranges');
  }
}

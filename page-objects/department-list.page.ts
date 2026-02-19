import { Page } from '@playwright/test';
import { BaseListPage } from './base-list.page';

/**
 * Department List Page Object
 *
 * All shared list behaviour (search, pagination, CRUD buttons, permission checks)
 * comes from BaseListPage.
 */
export class DepartmentListPage extends BaseListPage {
  constructor(page: Page) {
    super(page, '/departments', 'departments');
  }
}

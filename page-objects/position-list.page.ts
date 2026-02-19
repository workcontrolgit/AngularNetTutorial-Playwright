import { Page } from '@playwright/test';
import { BaseListPage } from './base-list.page';

/**
 * Position List Page Object
 *
 * All shared list behaviour (search, pagination, CRUD buttons, permission checks)
 * comes from BaseListPage.
 */
export class PositionListPage extends BaseListPage {
  constructor(page: Page) {
    super(page, '/positions', 'positions');
  }
}

// spec: docs/plans/playwright-test-planner-angularnettutorial.md
// seed: tests/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';
import { loginAsRole, logout } from '../../fixtures/auth.fixtures';

const roles = [
  { loginRole: 'employee' as const, label: 'Employee' },
  { loginRole: 'manager' as const, label: 'Manager' },
  { loginRole: 'hradmin' as const, label: 'HRAdmin' },
];

async function expectDashboardLoaded(page: Page, roleLabel: string) {
  const main = page.locator('main').first();
  const dashboardHeading = page
    .locator('h1:has-text("Dashboard"), .matero-page-title:has-text("Dashboard")')
    .first();

  const contentCandidates = [
    main.getByText('Total Employees').first(),
    main.getByText('Recent Employees').first(),
    main.getByText('Quick Actions').first(),
  ];

  const brokenState = main
    .getByText(/not found|forbidden|unauthorized|something went wrong|failed to load/i)
    .first();

  await expect(page, `Expected ${roleLabel} to land on /dashboard`).toHaveURL(
    /\/dashboard(?:[/?#].*)?$/
  );
  await expect(main, `Expected dashboard main content to render for ${roleLabel}`).toBeVisible();
  await expect(
    dashboardHeading,
    `Expected dashboard heading to be visible for ${roleLabel}`
  ).toBeVisible();

  await expect
    .poll(
      async () => {
        for (const candidate of contentCandidates) {
          if (await candidate.isVisible().catch(() => false)) {
            return true;
          }
        }
        return false;
      },
      { message: `Expected dashboard content to load for ${roleLabel}` }
    )
    .toBe(true);

  await expect(
    brokenState,
    `Dashboard should not be in a broken state for ${roleLabel}`
  ).toBeHidden();
}

test.describe('Dashboard And Navigation', () => {
  test('Dashboard availability by role', async ({ page }) => {
    test.slow();

    for (const { loginRole, label } of roles) {
      await test.step(`Validate dashboard for ${label}`, async () => {
        // 1. Login as the target role.
        await loginAsRole(page, loginRole);

        // 2. Navigate to /dashboard.
        await page.goto('/dashboard');

        // 3. Verify the page heading and main dashboard content load.
        await expectDashboardLoaded(page, label);
        await logout(page);
      });
    }
  });
});

/**
 * Blog Screenshots
 *
 * Captures key UI states from the TalentManagement app for use in blog posts
 * and documentation. Run this suite whenever the UI changes or before publishing
 * a new article.
 *
 * Usage:
 *   npx playwright test --project=screenshots
 *
 * Output:
 *   screenshots-output/
 *   ├── series-0-architecture/     (anonymous state, sidebar, navigation)
 *   ├── series-1-authentication/   (login, dashboard, user menu, profile)
 *   ├── series-2-dotnet-api/       (Swagger UI)
 *   ├── series-3-angular-material/ (employee list/form, department list, dashboard charts)
 *   └── series-6-ai-app-features/  (AI chat widget, HR insights, dashboard AI card)
 *
 * Prerequisites: All three services must be running:
 *   - Angular:        http://localhost:4200
 *   - .NET API:       https://localhost:44378
 *   - IdentityServer: https://localhost:44310
 *
 * For AI screenshots: set AiEnabled: true in API appsettings.json
 *                     and aiEnabled: true in Angular environment.ts
 */

import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAs, loginAsRole, logout } from '../../fixtures/auth.fixtures';
import { APP_URLS } from '../../config/test-config';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Output root — siblings with the tests/ folder */
const OUTPUT_ROOT = path.join(__dirname, '..', '..', 'screenshots-output');

/**
 * Take a screenshot and save it to screenshots-output/{series}/{filename}.
 * Creates intermediate directories automatically.
 */
async function shot(
  page: Page,
  series: string,
  filename: string,
  options: { fullPage?: boolean; clip?: { x: number; y: number; width: number; height: number } } = {}
): Promise<void> {
  const dir = path.join(OUTPUT_ROOT, series);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: path.join(dir, filename),
    fullPage: options.fullPage ?? false,
    clip: options.clip,
  });
}

/** Wait for the page to fully settle (network + extra render time). */
async function settle(page: Page, ms = 1500): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ms);
}

// ---------------------------------------------------------------------------
// Series 0 — Architecture / Anonymous state
// ---------------------------------------------------------------------------

test.describe('Series 0 — Architecture', () => {
  test('anonymous home page', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    // Full app in guest/anonymous state
    await shot(page, 'series-0-architecture', 'anonymous-home.png', { fullPage: true });

    // Sidebar navigation only
    const sidebar = page.locator('mat-sidenav, .matero-sidenav, app-sidebar, nav').first();
    const box = await sidebar.boundingBox();
    if (box) {
      await shot(page, 'series-0-architecture', 'sidebar-navigation.png', {
        clip: { x: box.x, y: box.y, width: box.width, height: box.height },
      });
    }
  });

  test('full stack architecture — swagger confirms API is running', async ({ page }) => {
    await page.goto(`${APP_URLS.api.replace('/api/v1', '')}/swagger`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await settle(page, 2000);
    await shot(page, 'series-0-architecture', 'swagger-ui-overview.png', { fullPage: false });
  });
});

// ---------------------------------------------------------------------------
// Series 1 — Authentication
// ---------------------------------------------------------------------------

test.describe('Series 1 — Authentication', () => {
  test('IdentityServer login form', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    // Open user menu and click login to reach IdentityServer
    const userIcon = page.locator(
      'button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)'
    ).last();
    await userIcon.click();
    await page.waitForTimeout(500);

    const loginOption = page.locator(
      'button:has-text("Login"), a:has-text("Login"), [role="menuitem"]:has-text("Login")'
    ).first();
    await loginOption.click();

    // Wait for IdentityServer login page
    await page.waitForSelector('input[name="Username"]', { timeout: 15000 });
    await settle(page, 1000);
    await shot(page, 'series-1-authentication', 'identityserver-login-form.png');
  });

  test('user menu — anonymous state', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const userIcon = page.locator(
      'button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)'
    ).last();
    await userIcon.click();
    await page.waitForTimeout(800);
    await shot(page, 'series-1-authentication', 'user-menu-anonymous.png');
  });

  test('dashboard after login — manager role', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await settle(page, 2000);
    await shot(page, 'series-1-authentication', 'dashboard-authenticated.png', { fullPage: false });
  });

  test('user menu — authenticated state', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await settle(page);

    const userIcon = page.locator(
      'button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)'
    ).last();
    await userIcon.click();
    await page.waitForTimeout(800);
    await shot(page, 'series-1-authentication', 'user-menu-authenticated.png');
  });

  test('role-based sidebar — HRAdmin sees all menu items', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await settle(page);
    const sidebar = page.locator('mat-sidenav, .matero-sidenav, app-sidebar, nav').first();
    const box = await sidebar.boundingBox();
    if (box) {
      await shot(page, 'series-1-authentication', 'sidebar-hradmin-full-menu.png', {
        clip: { x: box.x, y: box.y, width: box.width, height: box.height },
      });
    }
  });

  test('role-based sidebar — manager sees limited menu', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await settle(page);
    const sidebar = page.locator('mat-sidenav, .matero-sidenav, app-sidebar, nav').first();
    const box = await sidebar.boundingBox();
    if (box) {
      await shot(page, 'series-1-authentication', 'sidebar-manager-limited-menu.png', {
        clip: { x: box.x, y: box.y, width: box.width, height: box.height },
      });
    }
  });

  test('IdentityServer logout screen', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await settle(page);

    // Trigger logout
    const userIcon = page.locator(
      'button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)'
    ).last();
    await userIcon.click();
    await page.waitForTimeout(500);

    const logoutOption = page.locator(
      'button:has-text("Logout"), a:has-text("Logout"), [role="menuitem"]:has-text("Logout")'
    ).first();
    await logoutOption.click();

    // Wait for IdentityServer logout page
    await page.waitForTimeout(3000);
    await settle(page, 1000);
    await shot(page, 'series-1-authentication', 'identityserver-logout-screen.png');
  });
});

// ---------------------------------------------------------------------------
// Series 2 — .NET API (Swagger)
// ---------------------------------------------------------------------------

test.describe('Series 2 — .NET API', () => {
  const swaggerBase = APP_URLS.api.replace('/api/v1', '') + '/swagger';

  test('swagger UI — full overview', async ({ page }) => {
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);
    await shot(page, 'series-2-dotnet-api', 'swagger-full-overview.png', { fullPage: false });
  });

  test('swagger UI — employees endpoints expanded', async ({ page }) => {
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);

    // Expand the Employees section
    const employeesSection = page.locator('.opblock-tag-section, .opblock-tag').filter({ hasText: /employee/i }).first();
    if (await employeesSection.count() > 0) {
      await employeesSection.click();
      await page.waitForTimeout(1000);
    }
    await shot(page, 'series-2-dotnet-api', 'swagger-employees-endpoints.png', { fullPage: false });
  });

  test('swagger UI — AI endpoints expanded', async ({ page }) => {
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);

    // Expand the AI section
    const aiSection = page.locator('.opblock-tag-section, .opblock-tag').filter({ hasText: /^ai$/i }).first();
    if (await aiSection.count() > 0) {
      await aiSection.click();
      await page.waitForTimeout(1000);
      await shot(page, 'series-2-dotnet-api', 'swagger-ai-endpoints.png', { fullPage: false });
    }
  });
});

// ---------------------------------------------------------------------------
// Series 3 — Angular Material UI
// ---------------------------------------------------------------------------

test.describe('Series 3 — Angular Material', () => {
  test('dashboard — metrics cards and charts', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await settle(page, 3000); // extra time for charts to render
    await shot(page, 'series-3-angular-material', 'dashboard-metrics-charts.png', { fullPage: true });
  });

  test('employee list — data table with pagination', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await settle(page, 2000);
    await shot(page, 'series-3-angular-material', 'employee-list-table.png', { fullPage: false });
  });

  test('employee create form — dialog open', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await settle(page, 1500);

    // Open create dialog
    const createBtn = page.locator('button').filter({ hasText: /create|add/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForSelector('mat-dialog-container, .mat-dialog-container, form', { timeout: 5000 });
      await page.waitForTimeout(800);
      await shot(page, 'series-3-angular-material', 'employee-create-form.png');
    }
  });

  test('department list', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/departments');
    await settle(page, 2000);
    await shot(page, 'series-3-angular-material', 'department-list-table.png', { fullPage: false });
  });

  test('position list — HRAdmin only', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await page.goto('/positions');
    await settle(page, 2000);
    await shot(page, 'series-3-angular-material', 'position-list-table.png', { fullPage: false });
  });

  test('salary ranges — HRAdmin only', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await page.goto('/salary-ranges');
    await settle(page, 2000);
    await shot(page, 'series-3-angular-material', 'salary-ranges-table.png', { fullPage: false });
  });
});

// ---------------------------------------------------------------------------
// Series 6 — AI Features
// ---------------------------------------------------------------------------

test.describe('Series 6 — AI Features', () => {
  test.beforeEach(async ({ page }) => {
    // Skip entire group gracefully if AI is disabled in the environment
    // (We check by navigating to /ai-chat and seeing if content loads)
  });

  test('dashboard — AI insights card loaded', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await settle(page, 2000);

    // Check if AI insights card is present (only when aiEnabled: true)
    const aiCard = page.locator('.ai-insights-card, mat-card:has(mat-icon:has-text("smart_toy"))').first();
    const hasAiCard = await aiCard.count() > 0;

    if (hasAiCard) {
      // Wait for AI insight text to appear (Ollama can take 5-15s)
      await page.waitForSelector('.ai-insight-text, .ai-insights-card p', { timeout: 30000 })
        .catch(() => { /* AI may be disabled or loading — screenshot either state */ });
      await page.waitForTimeout(1000);
      await shot(page, 'series-6-ai-app-features', 'dashboard-ai-insights-card.png', { fullPage: false });

      // Crop just the AI card for a close-up
      const box = await aiCard.boundingBox();
      if (box) {
        await shot(page, 'series-6-ai-app-features', 'dashboard-ai-insights-card-closeup.png', {
          clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 300) },
        });
      }
    } else {
      // Screenshot dashboard anyway — documents the disabled state
      await shot(page, 'series-6-ai-app-features', 'dashboard-ai-disabled-state.png', { fullPage: false });
    }
  });

  test('AI chat widget — disabled banner (aiEnabled: false)', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/ai-chat');
    await settle(page, 1500);

    // Capture whatever state we're in — could be the info banner or the live chat
    await shot(page, 'series-6-ai-app-features', 'ai-chat-page-full.png', { fullPage: true });
  });

  test('AI chat — Tab 1 general chat with a reply', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/ai-chat');
    await settle(page, 1500);

    // Check if tabs exist (only when aiEnabled: true)
    const tabGroup = page.locator('mat-tab-group').first();
    const hasTabs = await tabGroup.count() > 0;

    if (!hasTabs) {
      // AI disabled — screenshot the info banner
      await shot(page, 'series-6-ai-app-features', 'ai-chat-disabled-banner.png', { fullPage: false });
      return;
    }

    // Tab 1 is General Chat — it should be active by default
    await shot(page, 'series-6-ai-app-features', 'ai-chat-tab1-general-empty.png', { fullPage: false });

    // Type a question and send
    const input = page.locator('mat-tab-body:first-child textarea, mat-tab-body:first-child input[type="text"]').first();
    if (await input.count() > 0) {
      await input.fill('What is OAuth 2.0 and how does it differ from OpenID Connect?');
      await page.keyboard.press('Enter');

      // Wait for the AI reply (Ollama can take up to 15s)
      await page.waitForSelector(
        'mat-tab-body:first-child .assistant, mat-tab-body:first-child [class*="assistant"]',
        { timeout: 30000 }
      ).catch(() => { /* capture whatever state loaded */ });
      await page.waitForTimeout(2000);
      await shot(page, 'series-6-ai-app-features', 'ai-chat-tab1-with-reply.png', { fullPage: false });
    }
  });

  test('AI chat — Tab 2 HR insights with a data-grounded answer', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/ai-chat');
    await settle(page, 1500);

    const tabGroup = page.locator('mat-tab-group').first();
    if (await tabGroup.count() === 0) {
      return; // AI disabled — skip
    }

    // Switch to Tab 2 (HR Insights)
    const hrTab = page.locator('[role="tab"]').filter({ hasText: /hr insight/i }).first();
    if (await hrTab.count() > 0) {
      await hrTab.click();
      await page.waitForTimeout(800);
      await shot(page, 'series-6-ai-app-features', 'ai-chat-tab2-hr-insights-empty.png', { fullPage: false });

      // Click a suggestion button (pre-filled question)
      const suggestionBtn = page.locator('mat-tab-body:nth-child(2) button[mat-stroked-button], mat-tab-body:nth-child(2) button[mat-flat-button]').first();
      if (await suggestionBtn.count() > 0) {
        await suggestionBtn.click();
      } else {
        // Fallback: type a question manually
        const input = page.locator('mat-tab-body:nth-child(2) textarea, mat-tab-body:nth-child(2) input').first();
        if (await input.count() > 0) {
          await input.fill('Which department has the most employees?');
          await page.keyboard.press('Enter');
        }
      }

      // Wait for data-grounded reply
      await page.waitForTimeout(30000).catch(() => {});
      await shot(page, 'series-6-ai-app-features', 'ai-chat-tab2-hr-insights-with-answer.png', { fullPage: false });
    }
  });

  test('AI chat — suggestion buttons visible', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/ai-chat');
    await settle(page, 1500);

    const hrTab = page.locator('[role="tab"]').filter({ hasText: /hr insight/i }).first();
    if (await hrTab.count() > 0) {
      await hrTab.click();
      await page.waitForTimeout(800);

      // Capture the suggestion buttons row
      const buttons = page.locator('mat-tab-body:nth-child(2) button').first();
      const box = await buttons.boundingBox();
      if (box) {
        await shot(page, 'series-6-ai-app-features', 'ai-chat-suggestion-buttons.png', { fullPage: false });
      }
    }
  });

  test('swagger — AI chat endpoint try-it-out', async ({ page }) => {
    const swaggerBase = APP_URLS.api.replace('/api/v1', '') + '/swagger';
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);

    // Expand AI section
    const aiSection = page.locator('.opblock-tag-section, .opblock-tag').filter({ hasText: /^ai$/i }).first();
    if (await aiSection.count() > 0) {
      await aiSection.click();
      await page.waitForTimeout(1000);

      // Expand the chat POST endpoint
      const chatEndpoint = page.locator('.opblock-post').filter({ hasText: /\/ai\/chat/i }).first();
      if (await chatEndpoint.count() > 0) {
        await chatEndpoint.click();
        await page.waitForTimeout(800);
        await shot(page, 'series-6-ai-app-features', 'swagger-ai-chat-endpoint.png', { fullPage: false });
      }
    }
  });
});

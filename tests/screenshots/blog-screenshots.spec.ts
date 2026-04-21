/**
 * Blog Screenshots
 *
 * Captures key UI states from the TalentManagement app for use in blog posts
 * and documentation. Each screenshot is registered in screenshot-catalog.json
 * so AI tools can reference images by description when writing blog articles.
 *
 * Usage:
 *   npx playwright test --project=screenshots
 *
 * Output:
 *   screenshots-output/                  ← PNG files organised by series
 *   screenshot-catalog.json              ← Machine-readable index (regenerated each run)
 *
 * Prerequisites: All three services must be running:
 *   - Angular:        http://localhost:4200
 *   - .NET API:       https://localhost:44378
 *   - IdentityServer: https://localhost:44310
 *
 * For Series 6 AI screenshots: set AiEnabled: true in API appsettings.json
 *                               and aiEnabled: true in Angular environment.ts
 */

import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { APP_URLS } from '../../config/test-config';

// ---------------------------------------------------------------------------
// Catalog types
// ---------------------------------------------------------------------------

interface ScreenshotMeta {
  /** One or two sentence description of what the screenshot shows. Used by AI when selecting images for blog posts. */
  description: string;
  /** Blog article numbers this screenshot is relevant to (e.g. ["1.1", "1.2"]) */
  articles: string[];
  /** Keywords for filtering (e.g. ["dashboard", "authentication", "manager"]) */
  tags: string[];
  /** How an AI writer should use this image in a blog (caption hint, placement suggestion) */
  useFor: string;
}

interface CatalogEntry extends ScreenshotMeta {
  path: string;       // relative path from repo root: screenshots-output/series-x/filename.png
  series: string;     // e.g. "series-1-authentication"
  filename: string;   // e.g. "dashboard-authenticated.png"
  capturedAt: string; // ISO timestamp
}

interface Catalog {
  generated: string;
  screenshots: CatalogEntry[];
}

// ---------------------------------------------------------------------------
// Catalog writer (accumulates entries across tests in a single run)
// ---------------------------------------------------------------------------

const OUTPUT_ROOT = path.join(__dirname, '..', '..', 'screenshots-output');
const CATALOG_PATH = path.join(__dirname, '..', '..', 'screenshot-catalog.json');

// Load existing catalog (if present) so we can merge/overwrite individual entries
let catalog: Catalog = { generated: new Date().toISOString(), screenshots: [] };

function saveCatalog(): void {
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// shot() — take screenshot + register catalog entry
// ---------------------------------------------------------------------------

async function shot(
  page: Page,
  series: string,
  filename: string,
  meta: ScreenshotMeta,
  options: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  } = {}
): Promise<void> {
  const dir = path.join(OUTPUT_ROOT, series);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, filename);
  await page.screenshot({
    path: filePath,
    fullPage: options.fullPage ?? false,
    clip: options.clip,
  });

  // Upsert catalog entry (replace if same series+filename already exists)
  const relativePath = `screenshots-output/${series}/${filename}`;
  catalog.screenshots = catalog.screenshots.filter(
    e => !(e.series === series && e.filename === filename)
  );
  catalog.screenshots.push({
    path: relativePath,
    series,
    filename,
    capturedAt: new Date().toISOString(),
    ...meta,
  });
  saveCatalog();
}

/** Wait for network + extra render time. */
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

    await shot(page, 'series-0-architecture', 'anonymous-home.png', {
      description:
        'Full TalentManagement app in anonymous/Guest state — shows the sidebar with limited menu items, the header with the user icon, and an empty dashboard placeholder.',
      articles: ['0.1', '0.2', '1.1'],
      tags: ['anonymous', 'guest', 'home', 'sidebar', 'app-shell'],
      useFor: 'Hero image for architecture overview articles; illustrates the app before login.',
    });

    const sidebar = page.locator('mat-sidenav, .matero-sidenav, app-sidebar, nav').first();
    const box = await sidebar.boundingBox();
    if (box) {
      await shot(page, 'series-0-architecture', 'sidebar-navigation.png', {
        description:
          'Left sidebar showing the navigation menu items available to an anonymous (Guest) user — limited to public routes only.',
        articles: ['0.1', '1.4'],
        tags: ['sidebar', 'navigation', 'anonymous', 'menu'],
        useFor: 'Illustrate the sidebar structure before discussing role-based menu visibility.',
      }, { clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    }
  });

  test('swagger confirms API is running', async ({ page }) => {
    await page.goto(`${APP_URLS.api.replace('/api/v1', '')}/swagger`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await settle(page, 2000);

    await shot(page, 'series-0-architecture', 'swagger-ui-overview.png', {
      description:
        'NSwag/Swagger UI for the TalentManagement .NET 10 Web API, showing all versioned controller groups (Employees, Departments, Positions, AI, etc.) collapsed.',
      articles: ['0.1', '2.1', '2.4', '6.1'],
      tags: ['swagger', 'api', 'dotnet', 'nswag', 'overview'],
      useFor: 'Show the API is running and document the full endpoint surface in a single image.',
    });
  });
});

// ---------------------------------------------------------------------------
// Series 1 — Authentication
// ---------------------------------------------------------------------------

test.describe('Series 1 — Authentication', () => {
  test('IdentityServer login form', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const userIcon = page.locator(
      'button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)'
    ).last();
    await userIcon.click();
    await page.waitForTimeout(500);

    const loginOption = page.locator(
      'button:has-text("Login"), a:has-text("Login"), [role="menuitem"]:has-text("Login")'
    ).first();
    await loginOption.click();

    await page.waitForSelector('input[name="Username"]', { timeout: 15000 });
    await settle(page, 1000);

    await shot(page, 'series-1-authentication', 'identityserver-login-form.png', {
      description:
        'Duende IdentityServer 7.0 login page — shows the Username and Password fields and the Login button. Reached after clicking Login in the Angular user menu.',
      articles: ['1.1'],
      tags: ['identityserver', 'login', 'oauth2', 'oidc', 'authentication'],
      useFor: 'Illustrate the OIDC redirect step in the OAuth 2.0 PKCE flow.',
    });
  });

  test('user menu — anonymous state', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    const userIcon = page.locator(
      'button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)'
    ).last();
    await userIcon.click();
    await page.waitForTimeout(800);

    await shot(page, 'series-1-authentication', 'user-menu-anonymous.png', {
      description:
        'Angular app header user menu expanded in anonymous state — shows only the "Login" option.',
      articles: ['1.1'],
      tags: ['user-menu', 'anonymous', 'header', 'login-button'],
      useFor: 'Show where users click to initiate the OIDC login flow.',
    });
  });

  test('dashboard after login — manager role', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await settle(page, 2000);

    await shot(page, 'series-1-authentication', 'dashboard-authenticated.png', {
      description:
        'TalentManagement dashboard immediately after a successful OAuth 2.0 PKCE login as the Manager role — shows metrics cards, sidebar with manager-visible menu items, and authenticated user avatar.',
      articles: ['1.1', '1.2', '1.4'],
      tags: ['dashboard', 'authenticated', 'manager', 'post-login', 'oauth2'],
      useFor: 'Hero image showing the successful result of the OIDC login flow.',
    });
  });

  test('user menu — authenticated state', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await settle(page);

    const userIcon = page.locator(
      'button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)'
    ).last();
    await userIcon.click();
    await page.waitForTimeout(800);

    await shot(page, 'series-1-authentication', 'user-menu-authenticated.png', {
      description:
        'Angular app header user menu expanded after login — shows Profile, Settings, and Logout options alongside the authenticated username.',
      articles: ['1.1', '1.2'],
      tags: ['user-menu', 'authenticated', 'header', 'logout', 'profile'],
      useFor: 'Show the post-login user menu options including Profile (for token inspection) and Logout.',
    });
  });

  test('sidebar — HRAdmin full menu', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await settle(page);

    const sidebar = page.locator('mat-sidenav, .matero-sidenav, app-sidebar, nav').first();
    const box = await sidebar.boundingBox();
    if (box) {
      await shot(page, 'series-1-authentication', 'sidebar-hradmin-full-menu.png', {
        description:
          'Sidebar navigation as seen by the HRAdmin role — all menu items visible including Positions, Salary Ranges, and AI Assistant.',
        articles: ['1.4'],
        tags: ['sidebar', 'hradmin', 'role-based-ui', 'menu', 'ngx-permissions'],
        useFor: 'Contrast with the Manager sidebar to demonstrate role-based UI rendering via ngx-permissions.',
      }, { clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    }
  });

  test('sidebar — manager limited menu', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await settle(page);

    const sidebar = page.locator('mat-sidenav, .matero-sidenav, app-sidebar, nav').first();
    const box = await sidebar.boundingBox();
    if (box) {
      await shot(page, 'series-1-authentication', 'sidebar-manager-limited-menu.png', {
        description:
          'Sidebar navigation as seen by the Manager role — Positions and Salary Ranges are hidden; only Employee and Department management are visible.',
        articles: ['1.4'],
        tags: ['sidebar', 'manager', 'role-based-ui', 'menu', 'ngx-permissions'],
        useFor: 'Demonstrate role-based menu hiding with ngx-permissions; pair with the HRAdmin sidebar for a before/after comparison.',
      }, { clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    }
  });

  test('IdentityServer logout screen', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await settle(page);

    const userIcon = page.locator(
      'button[aria-label="User menu"], button mat-icon:has-text("account_circle"), header button:has(mat-icon)'
    ).last();
    await userIcon.click();
    await page.waitForTimeout(500);

    const logoutOption = page.locator(
      'button:has-text("Logout"), a:has-text("Logout"), [role="menuitem"]:has-text("Logout")'
    ).first();
    await logoutOption.click();

    await page.waitForTimeout(3000);
    await settle(page, 1000);

    await shot(page, 'series-1-authentication', 'identityserver-logout-screen.png', {
      description:
        'Duende IdentityServer logout confirmation screen with a "click here" link to return to the Angular app.',
      articles: ['1.1'],
      tags: ['identityserver', 'logout', 'oauth2', 'oidc'],
      useFor: 'Illustrate the IdentityServer-managed logout redirect step.',
    });
  });
});

// ---------------------------------------------------------------------------
// Series 2 — .NET API (Swagger)
// ---------------------------------------------------------------------------

test.describe('Series 2 — .NET API', () => {
  const swaggerBase = APP_URLS.api.replace('/api/v1', '') + '/swagger';

  test('swagger — employees endpoints expanded', async ({ page }) => {
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);

    const employeesSection = page.locator('.opblock-tag-section, .opblock-tag').filter({ hasText: /employee/i }).first();
    if (await employeesSection.count() > 0) {
      await employeesSection.click();
      await page.waitForTimeout(1000);
    }

    await shot(page, 'series-2-dotnet-api', 'swagger-employees-endpoints.png', {
      description:
        'Swagger UI with the Employees controller expanded — shows GET, POST, PUT, DELETE endpoints with versioning and JWT lock icons indicating auth-protected routes.',
      articles: ['2.1', '2.3', '2.4'],
      tags: ['swagger', 'api', 'employees', 'crud', 'versioning', 'jwt'],
      useFor: 'Document the employee CRUD API surface; show JWT auth requirement on protected endpoints.',
    });
  });

  test('swagger — AI endpoints expanded', async ({ page }) => {
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);

    const aiSection = page.locator('.opblock-tag-section, .opblock-tag').filter({ hasText: /^ai$/i }).first();
    if (await aiSection.count() > 0) {
      await aiSection.click();
      await page.waitForTimeout(1000);

      await shot(page, 'series-2-dotnet-api', 'swagger-ai-endpoints.png', {
        description:
          'Swagger UI with the AI controller expanded — shows POST /ai/chat, POST /ai/hr-insight, and POST /ai/nl-employee-search endpoints.',
        articles: ['6.1', '6.2', '6.5'],
        tags: ['swagger', 'api', 'ai', 'chat', 'hr-insight', 'ollama'],
        useFor: 'Show the AI endpoint surface available after enabling AiEnabled feature flag.',
      });
    }
  });

  test('swagger — ai/chat try-it-out expanded', async ({ page }) => {
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);

    const aiSection = page.locator('.opblock-tag-section, .opblock-tag').filter({ hasText: /^ai$/i }).first();
    if (await aiSection.count() > 0) {
      await aiSection.click();
      await page.waitForTimeout(1000);

      const chatEndpoint = page.locator('.opblock-post').filter({ hasText: /\/ai\/chat/i }).first();
      if (await chatEndpoint.count() > 0) {
        await chatEndpoint.click();
        await page.waitForTimeout(800);

        await shot(page, 'series-2-dotnet-api', 'swagger-ai-chat-endpoint.png', {
          description:
            'Swagger UI showing the POST /api/v1/ai/chat endpoint expanded with its request body schema (message, systemPrompt fields).',
          articles: ['6.1'],
          tags: ['swagger', 'ai', 'chat', 'endpoint', 'request-body'],
          useFor: 'Illustrate how to test the AI chat endpoint directly from Swagger UI in Article 6.1.',
        });
      }
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
    await settle(page, 3000);

    await shot(page, 'series-3-angular-material', 'dashboard-metrics-charts.png', {
      description:
        'TalentManagement dashboard showing KPI metric cards (total employees, departments, new hires) and Chart.js bar/doughnut charts for department and gender distribution.',
      articles: ['3.1', '3.4', '6.4'],
      tags: ['dashboard', 'charts', 'metrics', 'angular-material', 'chartjs'],
      useFor: 'Hero image for dashboard and Chart.js articles; also the base screenshot for AI insights overlay comparison in Series 6.',
    }, { fullPage: true });
  });

  test('employee list — data table', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await settle(page, 2000);

    await shot(page, 'series-3-angular-material', 'employee-list-table.png', {
      description:
        'Angular Material data table listing employees with sortable columns (name, department, position, hire date), pagination controls, and a search/filter bar.',
      articles: ['3.1', '6.5'],
      tags: ['employee-list', 'data-table', 'angular-material', 'pagination', 'sorting'],
      useFor: 'Illustrate the Material Design data table component and the employee list feature.',
    });
  });

  test('employee create form — dialog', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await settle(page, 1500);

    const createBtn = page.locator('button').filter({ hasText: /create|add/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForSelector('mat-dialog-container, .mat-dialog-container, form', { timeout: 5000 });
      await page.waitForTimeout(800);

      await shot(page, 'series-3-angular-material', 'employee-create-form.png', {
        description:
          'Angular Material dialog showing the Create Employee reactive form with fields for name, email, department, position, hire date, and gender — with inline validation.',
        articles: ['3.2', '3.3'],
        tags: ['employee-form', 'reactive-forms', 'mat-dialog', 'validation', 'angular-material'],
        useFor: 'Illustrate the reactive form inside a Material dialog for the forms and dialogs articles.',
      });
    }
  });

  test('department list', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/departments');
    await settle(page, 2000);

    await shot(page, 'series-3-angular-material', 'department-list-table.png', {
      description:
        'Department management page showing a Material data table with department names and action buttons (edit, delete) accessible to Manager and HRAdmin roles.',
      articles: ['3.1'],
      tags: ['department-list', 'data-table', 'angular-material', 'crud'],
      useFor: 'Illustrate the department management feature alongside the employee list.',
    });
  });

  test('position list — HRAdmin only', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await page.goto('/positions');
    await settle(page, 2000);

    await shot(page, 'series-3-angular-material', 'position-list-table.png', {
      description:
        'Position management page visible only to the HRAdmin role — shows a Material table of job positions with title, department, and salary range columns.',
      articles: ['1.4', '3.1'],
      tags: ['position-list', 'hradmin', 'role-based-ui', 'data-table'],
      useFor: 'Demonstrate HRAdmin-only feature access; useful for role-based UI articles.',
    });
  });

  test('salary ranges — HRAdmin only', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await page.goto('/salary-ranges');
    await settle(page, 2000);

    await shot(page, 'series-3-angular-material', 'salary-ranges-table.png', {
      description:
        'Salary Range management page restricted to HRAdmin — shows a table with range label, minimum, and maximum salary columns.',
      articles: ['1.4', '3.1'],
      tags: ['salary-ranges', 'hradmin', 'role-based-ui', 'data-table'],
      useFor: 'Show the HRAdmin-exclusive salary range management feature.',
    });
  });
});

// ---------------------------------------------------------------------------
// Series 6 — AI Features
// ---------------------------------------------------------------------------

test.describe('Series 6 — AI Features', () => {
  test('dashboard — AI insights card', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await settle(page, 2000);

    const aiCard = page.locator('.ai-insights-card, mat-card:has(mat-icon:has-text("smart_toy"))').first();
    const hasAiCard = await aiCard.count() > 0;

    if (hasAiCard) {
      // Wait for AI text to arrive from Ollama (up to 30s)
      await page.waitForSelector('.ai-insight-text, .ai-insights-card p', { timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(1000);

      await shot(page, 'series-6-ai-app-features', 'dashboard-ai-insights-card.png', {
        description:
          'TalentManagement dashboard with the AI Insights mat-card at the top — shows an LLM-generated plain-English executive summary of live workforce metrics produced by Ollama.',
        articles: ['6.4'],
        tags: ['dashboard', 'ai-insights', 'ollama', 'executive-summary', 'angular-material'],
        useFor: 'Hero image for Article 6.4; shows the AI card in context above the metric cards.',
      });

      const box = await aiCard.boundingBox();
      if (box) {
        await shot(page, 'series-6-ai-app-features', 'dashboard-ai-insights-card-closeup.png', {
          description:
            'Close-up of the AI Insights mat-card — smart_toy icon, "AI Workforce Insights" title, and the generated executive summary text.',
          articles: ['6.4'],
          tags: ['dashboard', 'ai-insights', 'mat-card', 'closeup', 'smart-toy-icon'],
          useFor: 'Use as an inline image in Article 6.4 step-by-step walkthrough to show the finished card component.',
        }, { clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 300) } });
      }
    } else {
      await shot(page, 'series-6-ai-app-features', 'dashboard-ai-disabled-state.png', {
        description:
          'Dashboard without the AI insights card — the state when aiEnabled is false in environment.ts. Original dashboard is completely unaffected by the AI feature flag.',
        articles: ['6.4'],
        tags: ['dashboard', 'ai-disabled', 'feature-flag', 'graceful-degradation'],
        useFor: 'Show the before state (AI disabled) before revealing the after state (AI enabled) in Article 6.4.',
      });
    }
  });

  test('AI chat widget — full page', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/ai-chat');
    await settle(page, 1500);

    await shot(page, 'series-6-ai-app-features', 'ai-chat-page-full.png', {
      description:
        'Full AI Assistant page (/ai-chat) — either shows the two-tab chat UI (when aiEnabled: true) or an info banner explaining how to enable AI features (when false).',
      articles: ['6.3'],
      tags: ['ai-chat', 'angular-material', 'mat-tab-group', 'feature-flag'],
      useFor: 'Hero image for Article 6.3 showing the complete chat page layout.',
    }, { fullPage: true });
  });

  test('AI chat — Tab 1 with reply', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/ai-chat');
    await settle(page, 1500);

    const tabGroup = page.locator('mat-tab-group').first();
    if (await tabGroup.count() === 0) {
      await shot(page, 'series-6-ai-app-features', 'ai-chat-disabled-banner.png', {
        description:
          'AI Assistant page showing the info banner when aiEnabled is false — explains that Ollama must be running and AiEnabled set to true.',
        articles: ['6.3'],
        tags: ['ai-chat', 'disabled-state', 'feature-flag', 'info-banner'],
        useFor: 'Show the graceful disabled state in Article 6.3 before enabling the feature.',
      });
      return;
    }

    await shot(page, 'series-6-ai-app-features', 'ai-chat-tab1-general-empty.png', {
      description:
        'AI Assistant page, Tab 1 (General Chat) — empty state showing the text input and Send button before any messages are sent.',
      articles: ['6.3'],
      tags: ['ai-chat', 'general-chat', 'tab1', 'empty-state', 'angular-material'],
      useFor: 'Show the initial empty chat state at the beginning of Article 6.3.',
    });

    const input = page.locator('mat-tab-body textarea, mat-tab-body input[type="text"]').first();
    if (await input.count() > 0) {
      await input.fill('What is OAuth 2.0 and how does it differ from OpenID Connect?');
      await page.keyboard.press('Enter');

      await page.waitForSelector(
        '[class*="assistant"], .message-assistant, .chat-message',
        { timeout: 30000 }
      ).catch(() => {});
      await page.waitForTimeout(2000);

      await shot(page, 'series-6-ai-app-features', 'ai-chat-tab1-with-reply.png', {
        description:
          'AI Assistant Tab 1 (General Chat) showing a user question about OAuth 2.0 vs OIDC and Ollama\'s reply — demonstrates the conversation history layout with user/assistant message bubbles.',
        articles: ['6.3'],
        tags: ['ai-chat', 'general-chat', 'tab1', 'ollama-reply', 'conversation'],
        useFor: 'Show the live chat in action in Article 6.3.',
      });
    }
  });

  test('AI chat — Tab 2 HR insights with answer', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/ai-chat');
    await settle(page, 1500);

    const tabGroup = page.locator('mat-tab-group').first();
    if (await tabGroup.count() === 0) return;

    const hrTab = page.locator('[role="tab"]').filter({ hasText: /hr insight/i }).first();
    if (await hrTab.count() === 0) return;

    await hrTab.click();
    await page.waitForTimeout(800);

    await shot(page, 'series-6-ai-app-features', 'ai-chat-tab2-hr-insights-empty.png', {
      description:
        'AI Assistant Tab 2 (HR Insights) in empty state — shows the four pre-filled suggestion buttons and text input before any question is asked.',
      articles: ['6.3'],
      tags: ['ai-chat', 'hr-insights', 'tab2', 'suggestion-buttons', 'empty-state'],
      useFor: 'Show the HR Insights tab layout including the suggestion buttons in Article 6.3.',
    });

    // Click first suggestion or type a question
    const suggestionBtn = page.locator('mat-tab-body button[mat-stroked-button], mat-tab-body button[mat-flat-button]').first();
    if (await suggestionBtn.count() > 0) {
      await suggestionBtn.click();
    } else {
      const input = page.locator('mat-tab-body textarea, mat-tab-body input').nth(1);
      if (await input.count() > 0) {
        await input.fill('Which department has the most employees?');
        await page.keyboard.press('Enter');
      }
    }

    // Wait for Ollama (up to 30s)
    await page.waitForTimeout(30000).catch(() => {});
    await page.waitForTimeout(1000);

    await shot(page, 'series-6-ai-app-features', 'ai-chat-tab2-hr-insights-with-answer.png', {
      description:
        'AI Assistant Tab 2 (HR Insights) showing a data-grounded answer from Ollama — the reply references actual department headcounts from the live database rather than hallucinated figures. Execution time shown below the answer.',
      articles: ['6.2', '6.3'],
      tags: ['ai-chat', 'hr-insights', 'tab2', 'rag', 'grounded-answer', 'execution-time'],
      useFor: 'Key proof-of-concept image for Article 6.2 and 6.3 — shows that the AI answer is grounded in real workforce data, not hallucinated.',
    });
  });
});

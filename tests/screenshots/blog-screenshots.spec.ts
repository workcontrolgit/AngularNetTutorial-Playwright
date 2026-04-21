/**
 * Blog Screenshots
 *
 * Captures key UI states from the TalentManagement app for use in blog posts
 * and documentation. Each screenshot:
 *   - Is saved as a PNG in screenshots-output/{series}/
 *   - Gets a matching WAV narration file in the same folder (Windows TTS via speak.ps1)
 *   - Is registered in screenshot-catalog.json for AI-assisted blog writing
 *
 * Usage:
 *   npx playwright test --project=screenshots
 *
 * Output:
 *   screenshots-output/series-x/filename.png    ← screenshot
 *   screenshots-output/series-x/filename.wav    ← narration audio (Windows only)
 *   screenshot-catalog.json                     ← machine-readable index
 *
 * Prerequisites:
 *   - Angular:        http://localhost:4200
 *   - .NET API:       https://localhost:44378
 *   - IdentityServer: https://localhost:44310
 *   - For Series 6:   Ollama running + AiEnabled: true + aiEnabled: true in environment.ts
 */

import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { loginAsRole } from '../../fixtures/auth.fixtures';
import { APP_URLS } from '../../config/test-config';

// ---------------------------------------------------------------------------
// Catalog types
// ---------------------------------------------------------------------------

interface ScreenshotMeta {
  /** Technical description — what the screenshot shows (used in the catalog for AI lookup). */
  description: string;
  /** Conversational narration script spoken aloud via TTS when the screenshot is taken. 1-3 short sentences. */
  narration: string;
  /** Blog article numbers this screenshot is relevant to (e.g. ["1.1", "1.2"]) */
  articles: string[];
  /** Keywords for filtering (e.g. ["dashboard", "authentication", "manager"]) */
  tags: string[];
  /** How an AI writer should use this image in a blog (caption hint, placement suggestion) */
  useFor: string;
}

interface CatalogEntry extends ScreenshotMeta {
  path: string;       // e.g. "screenshots-output/series-1-authentication/dashboard.png"
  audioPath: string;  // e.g. "screenshots-output/series-1-authentication/dashboard.wav"
  series: string;
  filename: string;
  capturedAt: string;
}

interface Catalog {
  generated: string;
  screenshots: CatalogEntry[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OUTPUT_ROOT  = path.join(__dirname, '..', '..', 'screenshots-output');
const CATALOG_PATH = path.join(__dirname, '..', '..', 'screenshot-catalog.json');
const SPEAK_SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'speak.ps1');

// Set SCREENSHOTS_VOICE env var to choose a Windows TTS voice, e.g:
//   $env:SCREENSHOTS_VOICE = "Microsoft David Desktop"
const TTS_VOICE = process.env.SCREENSHOTS_VOICE ?? '';
const TTS_RATE  = parseInt(process.env.SCREENSHOTS_RATE ?? '-1', 10);

// ---------------------------------------------------------------------------
// Catalog writer
// ---------------------------------------------------------------------------

let catalog: Catalog = { generated: new Date().toISOString(), screenshots: [] };

function saveCatalog(): void {
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// TTS — call speak.ps1 via PowerShell (Windows only; skipped silently on other OS)
// ---------------------------------------------------------------------------

function generateAudio(text: string, outputWav: string): void {
  if (process.platform !== 'win32') {
    return; // TTS is Windows-only; skip on macOS/Linux CI
  }
  if (!fs.existsSync(SPEAK_SCRIPT)) {
    console.warn(`speak.ps1 not found at ${SPEAK_SCRIPT} — skipping audio`);
    return;
  }

  const args = [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', SPEAK_SCRIPT,
    '-Text', text,
    '-OutputPath', outputWav,
    '-Rate', String(TTS_RATE),
  ];
  if (TTS_VOICE) {
    args.push('-Voice', TTS_VOICE);
  }

  const result = spawnSync('powershell.exe', args, { encoding: 'utf-8' });

  if (result.status !== 0) {
    console.warn(`speak.ps1 exited ${result.status}: ${result.stderr ?? result.stdout}`);
  }
}

// ---------------------------------------------------------------------------
// shot() — screenshot + audio + catalog entry
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
  const dir      = path.join(OUTPUT_ROOT, series);
  const baseName = path.basename(filename, '.png');
  const pngPath  = path.join(dir, filename);
  const wavPath  = path.join(dir, `${baseName}.wav`);

  fs.mkdirSync(dir, { recursive: true });

  // 1. Take screenshot
  await page.screenshot({
    path: pngPath,
    fullPage: options.fullPage ?? false,
    clip: options.clip,
  });

  // 2. Generate narration audio (Windows TTS)
  generateAudio(meta.narration, wavPath);

  // 3. Upsert catalog entry
  const relativePng  = `screenshots-output/${series}/${filename}`;
  const relativeWav  = `screenshots-output/${series}/${baseName}.wav`;

  catalog.screenshots = catalog.screenshots.filter(
    e => !(e.series === series && e.filename === filename)
  );
  catalog.screenshots.push({
    path:      relativePng,
    audioPath: relativeWav,
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
        'Full TalentManagement app in anonymous Guest state — sidebar with limited menu, header with user icon, empty dashboard placeholder.',
      narration:
        'This is the TalentManagement application before login. The sidebar shows only public routes, and the header displays a Guest user icon in the top right corner.',
      articles: ['0.1', '0.2', '1.1'],
      tags: ['anonymous', 'guest', 'home', 'sidebar', 'app-shell'],
      useFor: 'Hero image for architecture overview articles; shows the app before login.',
    });

    const sidebar = page.locator('mat-sidenav, .matero-sidenav, app-sidebar, nav').first();
    const box = await sidebar.boundingBox();
    if (box) {
      await shot(page, 'series-0-architecture', 'sidebar-navigation.png', {
        description:
          'Left sidebar showing navigation menu items available to an anonymous Guest user — limited to public routes only.',
        narration:
          'The sidebar navigation shows a limited set of menu items for anonymous users. After login, additional items appear based on the user\'s assigned role.',
        articles: ['0.1', '1.4'],
        tags: ['sidebar', 'navigation', 'anonymous', 'menu'],
        useFor: 'Illustrate sidebar structure before discussing role-based menu visibility.',
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
        'NSwag Swagger UI for the TalentManagement .NET 10 Web API — all versioned controller groups collapsed.',
      narration:
        'The Swagger UI confirms the .NET 10 Web API is running on port 44378. You can see all the controller groups — Employees, Departments, Positions, and the AI endpoints added in Series 6.',
      articles: ['0.1', '2.1', '2.4', '6.1'],
      tags: ['swagger', 'api', 'dotnet', 'nswag', 'overview'],
      useFor: 'Show the API is running and document the full endpoint surface.',
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
        'Duende IdentityServer 7.0 login page — Username and Password fields, Login button. Reached after clicking Login in the Angular user menu.',
      narration:
        'Clicking Login redirects to Duende IdentityServer — the token service in our CAT architecture. Enter your username and password here to receive an ID token and access token via the OAuth 2.0 PKCE flow.',
      articles: ['1.1'],
      tags: ['identityserver', 'login', 'oauth2', 'oidc', 'pkce'],
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
        'Angular app header user menu expanded in anonymous state — shows only the Login option.',
      narration:
        'Clicking the user icon in the top right opens a dropdown with a single Login option. This is where users start the OAuth 2.0 login flow.',
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
        'TalentManagement dashboard after successful OAuth 2.0 PKCE login as Manager — metrics cards, sidebar with manager-visible items, authenticated user avatar in header.',
      narration:
        'After a successful login, IdentityServer redirects back to the Angular app with an access token. The dashboard loads with live workforce metrics, and the sidebar now shows the Manager\'s available features.',
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
        'Angular app header user menu after login — shows Profile, Settings, and Logout options alongside the authenticated username.',
      narration:
        'Once logged in, the user menu expands to show Profile, Settings, and Logout. The Profile page is particularly useful for inspecting the ID token and access token returned by IdentityServer.',
      articles: ['1.1', '1.2'],
      tags: ['user-menu', 'authenticated', 'header', 'logout', 'profile'],
      useFor: 'Show the post-login user menu options including Profile and Logout.',
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
          'Sidebar as seen by HRAdmin role — all menu items visible including Positions, Salary Ranges, and AI Assistant.',
        narration:
          'Logged in as HRAdmin, the sidebar shows the complete menu including Positions, Salary Ranges, and the AI Assistant — features restricted to the administrator role using ngx-permissions.',
        articles: ['1.4'],
        tags: ['sidebar', 'hradmin', 'role-based-ui', 'menu', 'ngx-permissions'],
        useFor: 'Contrast with the Manager sidebar to demonstrate role-based UI rendering.',
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
          'Sidebar as seen by Manager role — Positions and Salary Ranges hidden; only Employee and Department management visible.',
        narration:
          'As a Manager, the sidebar shows only Employee and Department management. Positions and Salary Ranges are hidden — ngx-permissions reads the roles claim from the access token and removes those menu items automatically.',
        articles: ['1.4'],
        tags: ['sidebar', 'manager', 'role-based-ui', 'menu', 'ngx-permissions'],
        useFor: 'Pair with the HRAdmin sidebar for a before/after role comparison.',
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
      narration:
        'Logout is handled by IdentityServer, not Angular. This screen confirms the session has been terminated. Clicking the link returns to the Angular app in Guest mode.',
      articles: ['1.1'],
      tags: ['identityserver', 'logout', 'oauth2', 'oidc', 'session'],
      useFor: 'Illustrate the IdentityServer-managed logout redirect step.',
    });
  });
});

// ---------------------------------------------------------------------------
// Series 2 — .NET API (Swagger)
// ---------------------------------------------------------------------------

test.describe('Series 2 — .NET API', () => {
  const swaggerBase = APP_URLS.api.replace('/api/v1', '') + '/swagger';

  test('swagger — employees endpoints', async ({ page }) => {
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);

    const section = page.locator('.opblock-tag-section, .opblock-tag').filter({ hasText: /employee/i }).first();
    if (await section.count() > 0) {
      await section.click();
      await page.waitForTimeout(1000);
    }

    await shot(page, 'series-2-dotnet-api', 'swagger-employees-endpoints.png', {
      description:
        'Swagger UI Employees controller expanded — GET, POST, PUT, DELETE endpoints with versioning and JWT lock icons.',
      narration:
        'The Employees controller exposes a full set of versioned REST endpoints. The lock icons indicate which routes require a Bearer token — in this case all of them except the read endpoint for anonymous access.',
      articles: ['2.1', '2.3', '2.4'],
      tags: ['swagger', 'employees', 'crud', 'versioning', 'jwt', 'dotnet'],
      useFor: 'Document the employee CRUD API surface and JWT auth requirement.',
    });
  });

  test('swagger — AI endpoints', async ({ page }) => {
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);

    const aiSection = page.locator('.opblock-tag-section, .opblock-tag').filter({ hasText: /^ai$/i }).first();
    if (await aiSection.count() > 0) {
      await aiSection.click();
      await page.waitForTimeout(1000);

      await shot(page, 'series-2-dotnet-api', 'swagger-ai-endpoints.png', {
        description:
          'Swagger UI AI controller expanded — POST /ai/chat, POST /ai/hr-insight, POST /ai/nl-employee-search.',
        narration:
          'Series 6 adds an AI controller with three endpoints. The chat endpoint accepts any question. The H R insight endpoint grounds the answer in live workforce data. And the natural language search endpoint parses plain English into structured employee filter parameters.',
        articles: ['6.1', '6.2', '6.5'],
        tags: ['swagger', 'ai', 'chat', 'hr-insight', 'nl-search', 'ollama'],
        useFor: 'Show the full AI endpoint surface after enabling the AiEnabled feature flag.',
      });
    }
  });

  test('swagger — ai/chat endpoint expanded', async ({ page }) => {
    await page.goto(swaggerBase, { waitUntil: 'networkidle', timeout: 15000 });
    await settle(page, 2000);

    const aiSection = page.locator('.opblock-tag-section, .opblock-tag').filter({ hasText: /^ai$/i }).first();
    if (await aiSection.count() > 0) {
      await aiSection.click();
      await page.waitForTimeout(800);

      const chatEndpoint = page.locator('.opblock-post').filter({ hasText: /\/ai\/chat/i }).first();
      if (await chatEndpoint.count() > 0) {
        await chatEndpoint.click();
        await page.waitForTimeout(800);

        await shot(page, 'series-2-dotnet-api', 'swagger-ai-chat-endpoint.png', {
          description:
            'Swagger UI POST /api/v1/ai/chat endpoint expanded — shows request body schema with message and systemPrompt fields.',
          narration:
            'The chat endpoint accepts two fields: message is the question to ask, and systemPrompt is an optional instruction that controls the AI\'s persona or constraints. Both are plain strings — no special formatting required.',
          articles: ['6.1'],
          tags: ['swagger', 'ai', 'chat', 'request-body', 'system-prompt'],
          useFor: 'Illustrate how to test the AI chat endpoint from Swagger in Article 6.1.',
        });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Series 3 — Angular Material UI
// ---------------------------------------------------------------------------

test.describe('Series 3 — Angular Material', () => {
  test('dashboard — metrics and charts', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/dashboard');
    await settle(page, 3000);

    await shot(page, 'series-3-angular-material', 'dashboard-metrics-charts.png', {
      description:
        'Dashboard showing KPI metric cards (total employees, departments, new hires) and Chart.js bar/doughnut charts for department and gender distribution.',
      narration:
        'The dashboard displays live workforce metrics as Material Design cards and Chart.js visualisations. The data comes from a single API call to the dashboard metrics endpoint, which aggregates counts across employees, departments, and positions.',
      articles: ['3.1', '3.4', '6.4'],
      tags: ['dashboard', 'charts', 'metrics', 'angular-material', 'chartjs', 'kpi'],
      useFor: 'Hero image for dashboard articles; base screenshot for AI insights overlay comparison in Series 6.',
    }, { fullPage: true });
  });

  test('employee list — data table', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/employees');
    await settle(page, 2000);

    await shot(page, 'series-3-angular-material', 'employee-list-table.png', {
      description:
        'Angular Material data table listing employees — sortable columns, pagination controls, and a search/filter bar.',
      narration:
        'The employee list uses an Angular Material data table with server-side sorting and pagination. The search bar filters results by name or department without reloading the page.',
      articles: ['3.1', '6.5'],
      tags: ['employee-list', 'data-table', 'pagination', 'sorting', 'angular-material'],
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
      await page.waitForSelector('mat-dialog-container, form', { timeout: 5000 });
      await page.waitForTimeout(800);

      await shot(page, 'series-3-angular-material', 'employee-create-form.png', {
        description:
          'Material dialog showing Create Employee reactive form — fields for name, email, department, position, hire date, gender — with inline validation.',
        narration:
          'Clicking Create opens a Material dialog with a reactive form. All fields use Angular Material form controls with built-in validation. Errors appear inline as you type, following the Material Design specification.',
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
        'Department management page — Material data table with department names and edit/delete action buttons.',
      narration:
        'The department list follows the same Material table pattern as the employee list. Managers can create, edit, and delete departments. The table refreshes automatically after each operation.',
      articles: ['3.1'],
      tags: ['department-list', 'data-table', 'crud', 'angular-material'],
      useFor: 'Illustrate the department management feature alongside the employee list.',
    });
  });

  test('position list — HRAdmin only', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await page.goto('/positions');
    await settle(page, 2000);

    await shot(page, 'series-3-angular-material', 'position-list-table.png', {
      description:
        'Position management page — HRAdmin-only table of job positions with title, department, and salary range columns.',
      narration:
        'Positions are visible only to the HRAdmin role. The ngx-permissions directive hides this page from Managers and Employees entirely — both in the sidebar and via route guard.',
      articles: ['1.4', '3.1'],
      tags: ['position-list', 'hradmin', 'role-based-ui', 'data-table', 'ngx-permissions'],
      useFor: 'Demonstrate HRAdmin-only feature access for role-based UI articles.',
    });
  });

  test('salary ranges — HRAdmin only', async ({ page }) => {
    await loginAsRole(page, 'hradmin');
    await page.goto('/salary-ranges');
    await settle(page, 2000);

    await shot(page, 'series-3-angular-material', 'salary-ranges-table.png', {
      description:
        'Salary Range management page restricted to HRAdmin — table with range label, minimum and maximum salary columns.',
      narration:
        'Salary ranges are an HRAdmin-only feature. They define the pay bands that Positions reference, creating a hierarchy from Salary Range down to Position down to Employee.',
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

    if (await aiCard.count() > 0) {
      await page.waitForSelector('.ai-insight-text, .ai-insights-card p', { timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(1000);

      await shot(page, 'series-6-ai-app-features', 'dashboard-ai-insights-card.png', {
        description:
          'Dashboard with AI Insights mat-card at the top — LLM-generated plain-English executive summary of live workforce metrics from Ollama.',
        narration:
          'With AI enabled, the dashboard now opens with an executive summary generated by Ollama. The card appears above the metric cards and automatically refreshes each time the dashboard loads with the latest workforce data.',
        articles: ['6.4'],
        tags: ['dashboard', 'ai-insights', 'ollama', 'executive-summary', 'mat-card'],
        useFor: 'Hero image for Article 6.4; shows AI card in context above the metric cards.',
      });

      const box = await aiCard.boundingBox();
      if (box) {
        await shot(page, 'series-6-ai-app-features', 'dashboard-ai-insights-card-closeup.png', {
          description:
            'Close-up of the AI Insights mat-card — smart_toy icon, title, and generated executive summary text.',
          narration:
            'The AI insights card uses the smart toy Material icon, a card title, and the generated summary text. The summary is typically three to four sentences and references the actual numbers from the database.',
          articles: ['6.4'],
          tags: ['dashboard', 'ai-insights', 'mat-card', 'closeup', 'smart-toy-icon'],
          useFor: 'Inline image for the Article 6.4 step-by-step walkthrough showing the finished card.',
        }, { clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 300) } });
      }
    } else {
      await shot(page, 'series-6-ai-app-features', 'dashboard-ai-disabled-state.png', {
        description:
          'Dashboard without AI insights card — state when aiEnabled is false. Original dashboard is completely unaffected.',
        narration:
          'When the AI feature flag is disabled, the dashboard looks identical to the pre-Series 6 version. No empty card, no spinner, no trace of the AI feature — the original tutorial experience is fully preserved.',
        articles: ['6.4'],
        tags: ['dashboard', 'ai-disabled', 'feature-flag', 'graceful-degradation'],
        useFor: 'Show the before state (AI disabled) before the after state (AI enabled) in Article 6.4.',
      });
    }
  });

  test('AI chat widget — full page', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/ai-chat');
    await settle(page, 1500);

    await shot(page, 'series-6-ai-app-features', 'ai-chat-page-full.png', {
      description:
        'Full AI Assistant page at /ai-chat — two-tab chat UI when aiEnabled is true, or an info banner when false.',
      narration:
        'The AI Assistant page is accessible from the sidebar using the robot toy icon. When AI is enabled it shows two tabs: General Chat and H R Insights. When disabled, an informational banner explains what to enable.',
      articles: ['6.3'],
      tags: ['ai-chat', 'mat-tab-group', 'feature-flag', 'angular-material'],
      useFor: 'Hero image for Article 6.3 showing the complete chat page layout.',
    }, { fullPage: true });
  });

  test('AI chat — Tab 1 general chat with reply', async ({ page }) => {
    await loginAsRole(page, 'manager');
    await page.goto('/ai-chat');
    await settle(page, 1500);

    const tabGroup = page.locator('mat-tab-group').first();
    if (await tabGroup.count() === 0) {
      await shot(page, 'series-6-ai-app-features', 'ai-chat-disabled-banner.png', {
        description:
          'AI Assistant page showing info banner when aiEnabled is false — explains Ollama must be running and AiEnabled set to true.',
        narration:
          'When the AI flag is off, a friendly info banner explains what to enable. This is the experience for developers following the original tutorial without Ollama installed.',
        articles: ['6.3'],
        tags: ['ai-chat', 'disabled-state', 'feature-flag', 'info-banner'],
        useFor: 'Show the graceful disabled state in Article 6.3 before enabling the feature.',
      });
      return;
    }

    await shot(page, 'series-6-ai-app-features', 'ai-chat-tab1-general-empty.png', {
      description:
        'AI Assistant Tab 1 (General Chat) — empty state before any messages are sent.',
      narration:
        'Tab 1 is General Chat — a free-form conversation with Ollama running locally. Type any question and press Enter to send. The conversation history accumulates in the session.',
      articles: ['6.3'],
      tags: ['ai-chat', 'general-chat', 'tab1', 'empty-state'],
      useFor: 'Show the initial empty chat state at the start of Article 6.3.',
    });

    const input = page.locator('mat-tab-body textarea, mat-tab-body input[type="text"]').first();
    if (await input.count() > 0) {
      await input.fill('What is OAuth 2.0 and how does it differ from OpenID Connect?');
      await page.keyboard.press('Enter');

      await page.waitForSelector('[class*="assistant"], .message-assistant', { timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(2000);

      await shot(page, 'series-6-ai-app-features', 'ai-chat-tab1-with-reply.png', {
        description:
          'AI Assistant Tab 1 with a user question about OAuth 2.0 vs OIDC and Ollama\'s reply — conversation history with user/assistant message bubbles.',
        narration:
          'Ollama responds with a detailed explanation of OAuth 2.0 versus OpenID Connect. The user message appears on the right, the assistant reply on the left — a familiar chat bubble layout using Angular Material components.',
        articles: ['6.3'],
        tags: ['ai-chat', 'general-chat', 'tab1', 'ollama-reply', 'conversation'],
        useFor: 'Show the live general chat in action in Article 6.3.',
      });
    }
  });

  test('AI chat — Tab 2 HR insights with answer', async ({ page }) => {
    test.setTimeout(90000); // Ollama inference can take 30-60s; allow extra buffer
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
        'AI Assistant Tab 2 (HR Insights) — empty state showing four pre-filled suggestion buttons and text input.',
      narration:
        'Tab 2 is H R Insights — questions answered using live workforce data from the database. Four suggestion buttons pre-fill common H R questions. You can also type your own.',
      articles: ['6.3'],
      tags: ['ai-chat', 'hr-insights', 'tab2', 'suggestion-buttons', 'empty-state'],
      useFor: 'Show the HR Insights tab layout and suggestion buttons in Article 6.3.',
    });

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

    await page.waitForTimeout(30000).catch(() => {});
    await page.waitForTimeout(1000);

    await shot(page, 'series-6-ai-app-features', 'ai-chat-tab2-hr-insights-with-answer.png', {
      description:
        'HR Insights Tab 2 showing a data-grounded Ollama answer — references actual department headcounts from the live database. Execution time shown below reply.',
      narration:
        'The H R Insights answer references real numbers from the database — no hallucination. You can see the execution time below the reply, which includes both the database query time and the Ollama inference time. This is Retrieval Augmented Generation without a vector store.',
      articles: ['6.2', '6.3'],
      tags: ['ai-chat', 'hr-insights', 'tab2', 'rag', 'grounded-answer', 'execution-time', 'ollama'],
      useFor: 'Key proof-of-concept image for Articles 6.2 and 6.3 — shows AI grounded in real data.',
    });
  });
});

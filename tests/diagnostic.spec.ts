import { test, expect } from '@playwright/test';

test('Diagnostic: Check Angular app behavior', async ({ page }) => {
  console.log('\n=== DIAGNOSTIC TEST ===');

  // Navigate to Angular
  await page.goto('http://localhost:4200');
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Check if we're on IdentityServer or Angular
  if (currentUrl.includes('sts.skoruba.local')) {
    console.log('✅ Redirected to IdentityServer (AUTH ENABLED)');
  } else if (currentUrl.includes('localhost:4200')) {
    console.log('❌ Stayed on Angular app (AUTH DISABLED)');
  }

  // Check page title
  const title = await page.title();
  console.log('Page Title:', title);

  // Check for login elements
  const hasUsernameInput = await page.locator('input[name="Username"]').isVisible().catch(() => false);
  const hasDashboard = await page.locator('text=Dashboard').isVisible().catch(() => false);

  console.log('Has Login Form:', hasUsernameInput);
  console.log('Has Dashboard:', hasDashboard);

  // Check localStorage for tokens
  const storage = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    return keys.filter(k => k.includes('token') || k.includes('oidc') || k.includes('auth'));
  });
  console.log('Auth keys in localStorage:', storage.length > 0 ? storage : 'None');

  // Take screenshot
  await page.screenshot({ path: 'diagnostic-screenshot.png', fullPage: true });
  console.log('Screenshot saved: diagnostic-screenshot.png');

  console.log('======================\n');
});

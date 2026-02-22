import { test, expect } from '@playwright/test';
import { loginAsRole, getStoredToken, getTokenFromProfile } from '../fixtures/auth.fixtures';

/**
 * Diagnostic test to compare token extraction methods
 */
test('Compare token extraction: localStorage vs Profile page', async ({ page }) => {
  // Login
  await loginAsRole(page, 'manager');

  // Wait for authentication to complete
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n=== Checking localStorage ===');
  const localStorageKeys = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const data: Record<string, any> = {};
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      data[key] = value ? value.substring(0, 100) + '...' : null;
    });
    return data;
  });
  console.log('localStorage keys:', Object.keys(localStorageKeys));
  console.log('localStorage data:', JSON.stringify(localStorageKeys, null, 2));

  console.log('\n=== Checking sessionStorage ===');
  const sessionStorageKeys = await page.evaluate(() => {
    const keys = Object.keys(sessionStorage);
    const data: Record<string, any> = {};
    keys.forEach(key => {
      const value = sessionStorage.getItem(key);
      data[key] = value ? value.substring(0, 100) + '...' : null;
    });
    return data;
  });
  console.log('sessionStorage keys:', Object.keys(sessionStorageKeys));
  console.log('sessionStorage data:', JSON.stringify(sessionStorageKeys, null, 2));

  console.log('\n=== Testing getStoredToken() ===');
  const storedToken = await getStoredToken(page);
  console.log('getStoredToken() result:', storedToken ? storedToken.substring(0, 50) + '...' : 'null');

  console.log('\n=== Testing getTokenFromProfile() ===');
  const profileToken = await getTokenFromProfile(page);
  console.log('getTokenFromProfile() result:', profileToken ? profileToken.substring(0, 50) + '...' : 'null');

  console.log('\n=== Comparison ===');
  console.log('Both methods returned tokens:', !!storedToken && !!profileToken);
  console.log('Tokens are the same:', storedToken === profileToken);

  // At least one method should work
  expect(storedToken || profileToken).toBeTruthy();
});

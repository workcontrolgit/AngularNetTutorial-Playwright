import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper function to speak text (blocking - waits for speech to complete)
async function speak(text: string) {
  try {
    // Use PowerShell's speech synthesis on Windows
    await execAsync(`powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${text}')"`);
  } catch (error) {
    console.log(`Voice: ${text}`); // Fallback to console if speech fails
  }
}

test('test', async ({ page }) => {
  // Increase timeout to allow for voice narration
  test.setTimeout(120000); // 2 minutes
  await speak('Navigating to dashboard');
  await page.goto('http://localhost:4200/dashboard');

  await speak('Opening Employees menu');
  await page.getByRole('button', { name: 'Employees' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Viewing Employees List');
  await page.getByRole('link', { name: 'L List' }).click();

  await speak('Opening Departments menu');
  await page.getByRole('button', { name: 'Departments' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Viewing Departments List');
  await page.getByRole('link', { name: 'L List' }).click();

  await speak('Opening Positions menu');
  await page.getByRole('button', { name: 'Positions' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Viewing Positions List');
  await page.getByRole('link', { name: 'L List' }).click();

  await speak('Opening Salary Ranges menu');
  await page.getByRole('button', { name: 'Salary Ranges' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Viewing Salary Ranges List');
  await page.getByRole('link', { name: 'L List' }).click();

  await speak('Opening account menu');
  await page.getByRole('button').filter({ hasText: 'account_circle' }).click();
  await speak('Clicking Login');
  await page.getByRole('menuitem', { name: 'Login' }).click();
  await speak('Entering username');
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('ashtyn1');
  await speak('Entering password');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('Pa$$word123');
  await speak('Logging in');
  await page.getByRole('button', { name: 'Login' }).click();

  await speak('Opening Employees menu to create');
  await page.getByRole('button', { name: 'Employees' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Creating new Employee');
  await page.getByRole('link', { name: 'C Create' }).click();

  await speak('Opening Departments menu to create');
  await page.getByRole('button', { name: 'Departments' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Creating new Department');
  await page.getByRole('link', { name: 'C Create' }).click();

  await speak('Opening Positions menu to create');
  await page.getByRole('button', { name: 'Positions' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Creating new Position');
  await page.getByRole('link', { name: 'C Create' }).click();

  await speak('Opening Salary Ranges menu to create');
  await page.getByRole('button', { name: 'Salary Ranges' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Creating new Salary Range');
  await page.getByRole('link', { name: 'C Create' }).click();

  await speak('Opening account menu');
  await page.getByRole('button').filter({ hasText: 'account_circle' }).click();
  await speak('Logging out');
  await page.getByRole('menuitem', { name: 'logout' }).click();
  await speak('Test complete');
  await page.getByRole('link', { name: 'here' }).click();
});
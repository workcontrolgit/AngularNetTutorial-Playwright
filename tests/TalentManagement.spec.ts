import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper function to speak text (blocking - waits for speech to complete)
async function speak(text: string) {
  try {
    // Use PowerShell's speech synthesis on Windows with female voice (Microsoft Zira)
    await execAsync(`powershell -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.SelectVoice('Microsoft Zira Desktop'); $synth.Volume = 100; $synth.Speak('${text}')"`);
  } catch (error) {
    console.log(`Voice: ${text}`); // Fallback to console if speech fails
  }
}

test('test', async ({ page }) => {
  // Increase timeout to allow for voice narration
  test.setTimeout(300000); // 5 minutes

  // CRITICAL: Wait for recording software to fully start capturing
  await page.waitForTimeout(2000); // Initial delay

  // Prime the audio system with a test sound
  await speak('Hello'); // This primes the audio capture
  await page.waitForTimeout(2000); // Wait after test sound

  // Open GitHub repository page after introduction
  await page.goto('https://github.com/workcontrolgit/AngularNetTutorial');
  await page.waitForTimeout(2000); // Show GitHub main page briefly

  
  // INTRODUCTION - Now the real introduction begins
  await speak('Welcome to the Angular .NET Tutorial demonstration');
  await speak('This project is available on GitHub at github.com/workcontrolgit/AngularNetTutorial');
  await speak('Building Modern Web Applications with Angular, .NET, and OAuth 2.0');
  await speak('This is a complete tutorial series showing how to build secure, scalable enterprise applications');
  await speak('The stack includes Angular 20, .NET 10, and Duende IdentityServer');
  await speak('Learn the CAT Pattern: Client, API Resource, and Token Service architecture');
  await speak('This is a free tutorial with complete source code available on GitHub');
  await speak('For full stack developers looking to master modern web development');
  await speak('Now let us begin a quick walkthrough of the application user interface');


  // Navigate to the tutorial page with slow scrolling
  await page.goto('https://github.com/workcontrolgit/AngularNetTutorial/blob/master/docs/TUTORIAL.md');
  await page.waitForTimeout(1500);

  // Scroll through tutorial page slowly
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(1000);

  await speak('Navigating to dashboard');
  await page.goto('http://localhost:4200/dashboard');
  await speak('Dashboard loaded. Main navigation menu visible with Employees, Departments, Positions, and Salary Ranges options');

  await speak('Opening Employees menu');
  await page.getByRole('button', { name: 'Employees' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Employee submenu expanded. Showing List and Create options');
  await speak('Clicking on List to view all employees');
  await page.getByRole('link', { name: 'L List' }).click();
  await speak('Employee list page displayed. Showing table with all employee records');

  await speak('Opening Departments menu');
  await page.getByRole('button', { name: 'Departments' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Departments submenu expanded. Showing List and Create options');
  await speak('Clicking on List to view all departments');
  await page.getByRole('link', { name: 'L List' }).click();
  await speak('Departments list page displayed. Showing all department records in a table');

  await speak('Opening Positions menu');
  await page.getByRole('button', { name: 'Positions' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Positions submenu expanded. Showing List and Create options');
  await speak('Clicking on List to view all positions');
  await page.getByRole('link', { name: 'L List' }).click();
  await speak('Positions list page displayed. Showing all available positions');

  await speak('Opening Salary Ranges menu');
  await page.getByRole('button', { name: 'Salary Ranges' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Salary Ranges submenu expanded. Showing List and Create options');
  await speak('Clicking on List to view all salary ranges');
  await page.getByRole('link', { name: 'L List' }).click();
  await speak('Salary ranges list page displayed. Showing all configured salary ranges');

  await speak('Opening account menu');
  await page.getByRole('button').filter({ hasText: 'account_circle' }).click();
  await speak('Account menu opened. Showing login option');
  await speak('Clicking Login');
  await page.getByRole('menuitem', { name: 'Login' }).click();
  await speak('Login page displayed. Form with username and password fields visible');
  await speak('Entering username ashtyn1');
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('ashtyn1');
  await speak('Entering password');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('Pa$$word123');
  await speak('Submitting login credentials');
  await page.getByRole('button', { name: 'Login' }).click();
  await speak('Login successful. Now authenticated with create permissions');

  await speak('Opening Employees menu to create a new employee');
  await page.getByRole('button', { name: 'Employees' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Employee submenu opened. Create option now available');
  await speak('Clicking Create to add a new employee');
  await page.getByRole('link', { name: 'C Create' }).click();
  await speak('Employee creation form displayed. Ready to enter new employee details');

  await speak('Opening Departments menu to create a new department');
  await page.getByRole('button', { name: 'Departments' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Departments submenu opened. Create option visible');
  await speak('Clicking Create to add a new department');
  await page.getByRole('link', { name: 'C Create' }).click();
  await speak('Department creation form displayed. Ready to enter new department information');

  await speak('Opening Positions menu to create a new position');
  await page.getByRole('button', { name: 'Positions' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Positions submenu opened. Create option available');
  await speak('Clicking Create to add a new position');
  await page.getByRole('link', { name: 'C Create' }).click();
  await speak('Position creation form displayed. Ready to define new position');

  await speak('Opening Salary Ranges menu to create a new range');
  await page.getByRole('button', { name: 'Salary Ranges' }).click();
  await page.waitForTimeout(500); // Wait for menu to expand
  await speak('Salary Ranges submenu opened. Create option visible');
  await speak('Clicking Create to add a new salary range');
  await page.getByRole('link', { name: 'C Create' }).click();
  await speak('Salary range creation form displayed. Ready to configure new salary range');

  await speak('Opening account menu to logout');
  await page.getByRole('button').filter({ hasText: 'account_circle' }).click();
  await speak('Account menu opened. Logout option visible');
  await speak('Clicking logout to end session');
  await page.getByRole('menuitem', { name: 'logout' }).click();
  await speak('Logged out successfully. Returned to public view');
  await speak('Clicking here link to return to home');
  await page.getByRole('link', { name: 'here' }).click();
  await speak('Walk Thru complete. All navigation and authentication flows verified successfully');
});
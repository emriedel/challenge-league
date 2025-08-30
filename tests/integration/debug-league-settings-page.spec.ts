import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb } from '../utils/database';
import { 
  createTestUser, 
  registerUser, 
  createLeague,
  cleanupTestFiles
} from '../utils/test-helpers';

test.describe('Debug League Settings Page', () => {
  test.beforeEach(async () => {
    await resetTestDb();
  });

  test.afterEach(async () => {
    await cleanupTestDb();
    cleanupTestFiles();
  });

  test('Navigate to League Settings and examine form elements', async ({ page }) => {
    test.setTimeout(60000);

    // Create admin user and league
    const adminUser = createTestUser('admin');
    await registerUser(page, adminUser);
    
    const leagueName = `Debug League ${Date.now()}`;
    const leagueId = await createLeague(page, leagueName);
    
    // Close profile overlay
    const closeButton = page.locator('button:has(img)').first();
    if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Navigate to League Settings
    console.log('🔧 Navigating to League Settings...');
    const settingsLink = page.getByRole('link', { name: 'League Settings' });
    await settingsLink.click();
    await page.waitForLoadState('networkidle');
    
    console.log(`📍 Current URL: ${page.url()}`);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-league-settings-page.png' });
    
    // Look for all form elements
    console.log('📝 Form elements on page:');
    
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    console.log(`  Textareas found: ${textareaCount}`);
    
    for (let i = 0; i < textareaCount; i++) {
      const textarea = textareas.nth(i);
      const name = await textarea.getAttribute('name');
      const placeholder = await textarea.getAttribute('placeholder');
      const id = await textarea.getAttribute('id');
      console.log(`    Textarea ${i}: name="${name}", placeholder="${placeholder}", id="${id}"`);
    }
    
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log(`  Inputs found: ${inputCount}`);
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) { // Limit to first 5 inputs
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`    Input ${i}: type="${type}", name="${name}", placeholder="${placeholder}"`);
    }
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`  Buttons found: ${buttonCount}`);
    
    for (let i = 0; i < Math.min(buttonCount, 8); i++) { // Limit to first 8 buttons
      const button = buttons.nth(i);
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      console.log(`    Button ${i}: text="${text}", type="${type}"`);
    }
    
    // Look for specific prompt-related elements
    const promptElements = page.locator('*:has-text("prompt"), *:has-text("challenge"), *:has-text("task")');
    const promptCount = await promptElements.count();
    console.log(`  Elements containing "prompt/challenge/task": ${promptCount}`);
    
    // Check the page content structure
    const headings = page.locator('h1, h2, h3, h4');
    const headingCount = await headings.count();
    console.log(`  Headings found: ${headingCount}`);
    
    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const text = await heading.textContent();
      const tag = await heading.evaluate(el => el.tagName);
      console.log(`    ${tag}: "${text}"`);
    }
    
    console.log('🎉 League Settings page debug completed!');
  });
});
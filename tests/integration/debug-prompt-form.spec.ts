import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb } from '../utils/database';
import { 
  createTestUser, 
  registerUser, 
  createLeague,
  cleanupTestFiles
} from '../utils/test-helpers';

test.describe('Debug Prompt Form', () => {
  test.beforeEach(async () => {
    await resetTestDb();
  });

  test.afterEach(async () => {
    await cleanupTestDb();
    cleanupTestFiles();
  });

  test('Navigate to League Settings and examine the Add Challenge form', async ({ page }) => {
    test.setTimeout(60000);

    // Create admin user and league
    const adminUser = createTestUser('admin');
    await registerUser(page, adminUser);
    
    const leagueName = `Debug League ${Date.now()}`;
    const leagueId = await createLeague(page, leagueName);
    
    // Close profile overlay and go to settings
    const closeButton = page.locator('button:has(img)').first();
    if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }
    
    const settingsLink = page.getByRole('link', { name: 'League Settings' });
    await settingsLink.click();
    await page.waitForLoadState('networkidle');
    
    // Click Edit Settings
    const editButton = page.locator('button:has-text("Edit Settings")');
    if (await editButton.isVisible({ timeout: 3000 })) {
      console.log('📝 Clicking Edit Settings button...');
      await editButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Take screenshot after clicking Edit Settings
    await page.screenshot({ path: 'debug-prompt-form.png' });
    
    // Now examine all form elements after Edit Settings is clicked
    console.log('📝 Form elements after clicking Edit Settings:');
    
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    console.log(`  Textareas found: ${textareaCount}`);
    
    for (let i = 0; i < textareaCount; i++) {
      const textarea = textareas.nth(i);
      const name = await textarea.getAttribute('name');
      const placeholder = await textarea.getAttribute('placeholder');
      const required = await textarea.getAttribute('required');
      const value = await textarea.inputValue();
      console.log(`    Textarea ${i}: name="${name}", placeholder="${placeholder}", required="${required}", value="${value}"`);
    }
    
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log(`  Inputs found: ${inputCount}`);
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      const required = await input.getAttribute('required');
      const value = await input.inputValue();
      console.log(`    Input ${i}: type="${type}", name="${name}", placeholder="${placeholder}", required="${required}", value="${value}"`);
    }
    
    // Check submit buttons
    const submitButtons = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Submit")');
    const submitCount = await submitButtons.count();
    console.log(`  Submit buttons found: ${submitCount}`);
    
    for (let i = 0; i < submitCount; i++) {
      const button = submitButtons.nth(i);
      const text = await button.textContent();
      const disabled = await button.getAttribute('disabled');
      const classes = await button.getAttribute('class');
      console.log(`    Submit button ${i}: text="${text}", disabled="${disabled}", classes="${classes}"`);
    }
    
    // Fill the textarea with test content and see if button becomes enabled
    console.log('📝 Testing form validation...');
    const textarea = textareas.first();
    if (await textarea.isVisible()) {
      await textarea.fill('Test prompt for validation');
      await page.waitForTimeout(1000);
      
      // Check button state again
      const button = submitButtons.first();
      const disabledAfter = await button.getAttribute('disabled');
      console.log(`    Button disabled after filling textarea: "${disabledAfter}"`);
      
      // Try filling other required fields if they exist
      const requiredInputs = page.locator('input[required], textarea[required]');
      const requiredCount = await requiredInputs.count();
      console.log(`    Required fields found: ${requiredCount}`);
      
      for (let i = 0; i < requiredCount; i++) {
        const field = requiredInputs.nth(i);
        const tagName = await field.evaluate(el => el.tagName);
        const type = await field.getAttribute('type');
        const name = await field.getAttribute('name');
        
        console.log(`    Filling required ${tagName} field: name="${name}", type="${type}"`);
        
        if (tagName === 'TEXTAREA') {
          await field.fill('Test content');
        } else if (type === 'number') {
          await field.fill('1');
        } else {
          await field.fill('test');
        }
        
        await page.waitForTimeout(500);
      }
      
      // Check button state after filling all required fields
      const finalDisabled = await button.getAttribute('disabled');
      console.log(`    Button disabled after filling all required fields: "${finalDisabled}"`);
    }
    
    console.log('🎉 Prompt form debug completed!');
  });
});
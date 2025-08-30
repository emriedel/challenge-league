import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb } from '../utils/database';
import { 
  createTestUser, 
  registerUser, 
  createLeague,
  cleanupTestFiles
} from '../utils/test-helpers';

test.describe('Debug League Settings Access', () => {
  test.beforeEach(async () => {
    await resetTestDb();
    console.log('🧹 Test database reset for debug test');
  });

  test.afterEach(async () => {
    await cleanupTestDb();
    cleanupTestFiles();
    console.log('🗑️ Test cleanup completed');
  });

  test('Create league and check for League Settings access', async ({ page }) => {
    test.setTimeout(60000);

    // Step 1: Register user (who will be league admin)
    console.log('👤 Creating league admin user...');
    const adminUser = createTestUser('admin');
    await registerUser(page, adminUser);
    
    // Step 2: Create league (user becomes admin)
    console.log('🏆 Creating league...');
    const leagueName = `Debug League ${Date.now()}`;
    const leagueId = await createLeague(page, leagueName);
    
    console.log(`✅ League created successfully: ${leagueId}`);
    console.log(`Current URL: ${page.url()}`);
    
    // Step 3: Close any overlays or modals that might be open
    console.log('🔄 Checking for and closing any open modals/overlays...');
    
    // Look for close buttons or click outside to close profile overlay
    const closeButtons = page.locator('button:has(img)', { hasText: '' }).first(); // Close button with image
    if (await closeButtons.isVisible({ timeout: 2000 })) {
      console.log('Found close button, clicking...');
      await closeButtons.click();
      await page.waitForTimeout(1000);
    }
    
    // Also try clicking on the main content area to close any overlay
    const mainContent = page.locator('main');
    if (await mainContent.isVisible()) {
      await mainContent.click();
      await page.waitForTimeout(1000);
    }
    
    // Step 4: Take screenshot after closing overlays
    await page.screenshot({ path: 'debug-league-page.png' });
    
    // Step 5: Navigate through league tabs to see if League Settings appears
    console.log('📋 Checking all league tabs...');
    
    const tabs = ['Current Challenge', 'Challenge Results', 'Standings'];
    for (const tabName of tabs) {
      console.log(`Clicking on "${tabName}" tab...`);
      const tabLink = page.locator(`text="${tabName}"`);
      if (await tabLink.isVisible({ timeout: 2000 })) {
        await tabLink.click();
        await page.waitForTimeout(1000);
        
        // Check if League Settings appears in this tab
        const leagueSettingsHere = page.locator('text=League Settings, text=Settings, a[href*="settings"]');
        const settingsCount = await leagueSettingsHere.count();
        console.log(`  League Settings elements in "${tabName}": ${settingsCount}`);
        
        // Check for admin-specific elements
        const adminElements = page.locator('text=Admin, text=Manage, button:has-text("Transition"), button:has-text("Add Prompt")');
        const adminCount = await adminElements.count();
        console.log(`  Admin elements in "${tabName}": ${adminCount}`);
      }
    }
    
    // Step 6: Look for League Settings elements
    console.log('🔍 Final search for League Settings elements...');
    
    // Check for various possible League Settings selectors
    const possibleSelectors = [
      'text=League Settings',
      'text=Settings',
      'a[href*="settings"]',
      'a[href*="league-settings"]', 
      'button:has-text("Settings")',
      'button:has-text("League Settings")',
      '[data-testid*="settings"]',
      'text=Admin',
      'text=Manage'
    ];
    
    for (const selector of possibleSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible({ timeout: 1000 });
      const count = await element.count();
      console.log(`Selector "${selector}": visible=${isVisible}, count=${count}`);
      
      if (count > 0) {
        try {
          const text = await element.first().textContent();
          console.log(`  Text content: "${text}"`);
        } catch (error) {
          console.log(`  Could not get text content`);
        }
      }
    }
    
    // Step 5: Get all links and buttons on the page
    console.log('🔗 All links on page:');
    const allLinks = page.locator('a');
    const linkCount = await allLinks.count();
    for (let i = 0; i < Math.min(linkCount, 10); i++) { // Limit to first 10 links
      try {
        const href = await allLinks.nth(i).getAttribute('href');
        const text = await allLinks.nth(i).textContent();
        console.log(`  Link ${i}: href="${href}", text="${text}"`);
      } catch (error) {
        console.log(`  Link ${i}: Could not get attributes`);
      }
    }
    
    console.log('🔘 All buttons on page:');
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Limit to first 10 buttons
      try {
        const text = await allButtons.nth(i).textContent();
        const classes = await allButtons.nth(i).getAttribute('class');
        console.log(`  Button ${i}: text="${text}", classes="${classes}"`);
      } catch (error) {
        console.log(`  Button ${i}: Could not get attributes`);
      }
    }
    
    // Step 6: Check if we're actually on the league page
    expect(page.url()).toContain(`/league/${leagueId}`);
    
    console.log('🎉 Debug test completed - check console output for League Settings elements');
  });
});
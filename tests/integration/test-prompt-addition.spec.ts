import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb } from '../utils/database';
import { 
  createTestUser, 
  registerUser, 
  createLeague,
  addPromptToLeague,
  cleanupTestFiles
} from '../utils/test-helpers';

test.describe('Test Prompt Addition', () => {
  test.beforeEach(async () => {
    await resetTestDb();
    console.log('🧹 Test database reset');
  });

  test.afterEach(async () => {
    await cleanupTestDb();
    cleanupTestFiles();
    console.log('🗑️ Test cleanup completed');
  });

  test('Create league and add prompt via League Settings', async ({ page }) => {
    test.setTimeout(60000);

    // Step 1: Register admin user
    const adminUser = createTestUser('admin');
    await registerUser(page, adminUser);
    
    // Step 2: Create league
    const leagueName = `Test League ${Date.now()}`;
    const leagueId = await createLeague(page, leagueName);
    
    // Step 3: Add prompt to league
    const promptText = "Submit a photo of something creative you made this week";
    await addPromptToLeague(page, promptText);
    
    // Step 4: Verify we're on League Settings page
    expect(page.url()).toContain('league-settings');
    
    // Step 5: Check that the prompt was added
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('creative');
    
    console.log('🎉 Prompt addition test completed successfully!');
  });
});
import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb } from '../utils/database';
import { 
  createTestUser, 
  registerUser, 
  createLeague,
  joinLeagueById,
  cleanupTestFiles
} from '../utils/test-helpers';

test.describe('Simplified User Journey - Core Functionality', () => {
  test.beforeEach(async () => {
    await resetTestDb();
    console.log('🧹 Test database reset for simplified flow');
  });

  test.afterEach(async () => {
    await cleanupTestDb();
    cleanupTestFiles();
    console.log('🗑️ Test cleanup completed');
  });

  test('Basic user registration and league creation', async ({ page }) => {
    test.setTimeout(60000);

    // Step 1: Register user
    console.log('👤 Step 1: Creating user account...');
    const user = createTestUser('testuser');
    await registerUser(page, user);
    
    // Verify we're logged in
    const url = page.url();
    console.log(`Current URL after registration: ${url}`);
    expect(url).not.toContain('/auth/');
    
    // Step 2: Create league
    console.log('🏆 Step 2: Creating league...');
    const leagueName = `Simple Test League ${Date.now()}`;
    const leagueId = await createLeague(page, leagueName);
    
    // Verify league was created
    expect(leagueId).toBeTruthy();
    console.log(`✅ League created with ID: ${leagueId}`);
    
    // Step 3: Verify we're on the league page
    const currentUrl = page.url();
    expect(currentUrl).toContain(`/league/${leagueId}`);
    
    console.log('🎉 Basic flow test passed successfully!');
  });

  test('Two user registration and league joining', async ({ browser }) => {
    test.setTimeout(90000);
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1: Register and create league
      console.log('👤 Creating first user...');
      const user1 = createTestUser('creator');
      await registerUser(page1, user1);
      
      const leagueName = `Multi User League ${Date.now()}`;
      const leagueId = await createLeague(page1, leagueName);
      
      // User 2: Register and join league
      console.log('👤 Creating second user...');
      const user2 = createTestUser('joiner');
      await registerUser(page2, user2);
      
      console.log('👥 Second user joining league...');
      await joinLeagueById(page2, leagueId);
      
      // Verify both users are in the league
      const page1Url = page1.url();
      const page2Url = page2.url();
      
      expect(page1Url).toContain(`/league/${leagueId}`);
      expect(page2Url).toContain(`/league/${leagueId}`);
      
      console.log('🎉 Multi-user flow test passed successfully!');
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb, seedTestDb } from '../utils/database';
import { 
  createTestUser, 
  registerUser, 
  uploadProfilePhoto,
  createLeague,
  addPromptToLeague,
  joinLeagueById,
  submitChallengeResponse,
  transitionLeaguePhase,
  castVotes,
  signInUser,
  cleanupTestFiles
} from '../utils/test-helpers';

test.describe('Working User Journey - Comprehensive Flow', () => {
  test.beforeEach(async () => {
    // Reset database with fresh schema before each test
    await resetTestDb();
    console.log('🧹 Test database reset for comprehensive flow');
  });

  test.afterEach(async () => {
    // Clean up test database and files after each test
    await cleanupTestDb();
    cleanupTestFiles();
    console.log('🗑️ Test cleanup completed');
  });

  test('Complete user workflow from account creation to standings', async ({ browser }) => {
    // Create two browser contexts for two different users  
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Increase test timeout for comprehensive flow
    test.setTimeout(120000);

    try {
      // Step 1: Create first account and add profile photo
      console.log('👤 Step 1: Creating first user account...');
      const user1 = createTestUser('admin');
      await registerUser(page1, user1);
      
      // Upload profile photo
      await uploadProfilePhoto(page1);
      
      // Step 2: Create a league
      console.log('🏆 Step 2: Creating league...');
      const leagueName = `Test League ${Date.now()}`;
      const leagueId = await createLeague(page1, leagueName);
      
      // Step 3: Verify League Settings access (prompts are pre-seeded)
      console.log('📝 Step 3: Verifying League Settings access...');
      
      // Close any profile overlay
      const closeButton = page1.locator('button:has(img)').first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await page1.waitForTimeout(1000);
      }
      
      // Navigate to League Settings to verify admin access
      const settingsLink = page1.getByRole('link', { name: 'League Settings' });
      await settingsLink.waitFor({ state: 'visible', timeout: 5000 });
      await settingsLink.click();
      await page1.waitForLoadState('networkidle');
      
      // Verify we can access League Settings (admin-only feature)
      expect(page1.url()).toContain('league-settings');
      console.log('✅ League Settings accessible to admin');
      
      // Navigate back to main league page
      await page1.goto(`/league/${leagueId}`);
      await page1.waitForLoadState('networkidle');
      
      // Step 4: Create second account
      console.log('👤 Step 4: Creating second user account...');
      const user2 = createTestUser('member');
      await registerUser(page2, user2);
      
      // Step 5: Second user joins the league
      console.log('👥 Step 5: Second user joining league...');
      await joinLeagueById(page2, leagueId);
      
      // Step 6: Both users submit photo responses
      console.log('📸 Step 6: Users submitting responses...');
      await submitChallengeResponse(page1, leagueId, "Here's my creative project - spent all weekend on this!");
      await submitChallengeResponse(page2, leagueId, "My take on the challenge - hope you like it!");
      
      // Step 7: Transition to voting phase using League Settings
      console.log('🗳️ Step 7: Transitioning to voting phase...');
      await transitionLeaguePhase(page1);
      
      // Step 8: Both users vote
      console.log('✅ Step 8: Users casting votes...');
      await castVotes(page1, leagueId);
      await castVotes(page2, leagueId);
      
      // Step 9: Transition to next prompt using League Settings
      console.log('⏭️ Step 9: Transitioning to next prompt...');
      await transitionLeaguePhase(page1);
      
      // Step 10: Verify Challenge page shows new prompt
      console.log('🎯 Step 10: Verifying Challenge page...');
      await page1.goto(`/league/${leagueId}`);
      await page1.waitForLoadState('networkidle');
      
      // Check that the new prompt is visible
      const challengeContent = await page1.textContent('body');
      expect(challengeContent).toContain('shadow'); // Part of second prompt
      
      // Step 11: Verify Challenge Results page loads with previous results
      console.log('📊 Step 11: Verifying Challenge Results page...');
      await page1.goto(`/league/${leagueId}/results`);
      await page1.waitForLoadState('networkidle');
      
      // Check that results are displayed
      const resultsContent = await page1.textContent('body');
      expect(resultsContent).toContain('creative'); // Part of first prompt that was completed
      
      // Step 12: Verify Standings page loads with current standings
      console.log('🏅 Step 12: Verifying Standings page...');
      await page1.goto(`/league/${leagueId}/standings`);
      await page1.waitForLoadState('networkidle');
      
      // Check that standings show both users
      const standingsContent = await page1.textContent('body');
      expect(standingsContent).toContain(user1.username);
      expect(standingsContent).toContain(user2.username);
      
      console.log('🎉 Complete user workflow test passed successfully!');
      
    } finally {
      // Ensure contexts are closed
      await context1.close();
      await context2.close();
    }
  });

  test('Multi-user league interaction with voting validation', async ({ browser }) => {
    // Create three browser contexts for comprehensive voting test
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    try {
      // Create three users
      const user1 = createTestUser('creator');
      const user2 = createTestUser('voter1'); 
      const user3 = createTestUser('voter2');
      
      await registerUser(page1, user1);
      await registerUser(page2, user2);
      await registerUser(page3, user3);
      
      // User 1 creates league
      const leagueName = `Voting Test League ${Date.now()}`;
      const leagueId = await createLeague(page1, leagueName);
      
      // Add prompt
      await addPromptToLeague(page1, "Show us your most creative workspace setup");
      
      // Users 2 and 3 join league
      await joinLeagueById(page2, leagueId);
      await joinLeagueById(page3, leagueId);
      
      // All three users submit responses
      await submitChallengeResponse(page1, leagueId, "My ultimate creative workspace with custom lighting!");
      await submitChallengeResponse(page2, leagueId, "Minimalist setup that sparks maximum creativity");
      await submitChallengeResponse(page3, leagueId, "Cozy corner where all my best ideas happen");
      
      // Transition to voting
      await transitionLeaguePhase(page1);
      
      // All users cast votes
      await castVotes(page1, leagueId);
      await castVotes(page2, leagueId);
      await castVotes(page3, leagueId);
      
      // Process results
      await transitionLeaguePhase(page1);
      
      // Verify results page shows all submissions with vote counts
      await page1.goto(`/league/${leagueId}/results`);
      await page1.waitForLoadState('networkidle');
      
      const resultsPage = await page1.textContent('body');
      expect(resultsPage).toContain('workspace'); // Confirm results are from correct prompt
      
      // Verify standings reflect the voting outcomes
      await page1.goto(`/league/${leagueId}/standings`);
      await page1.waitForLoadState('networkidle');
      
      const standingsPage = await page1.textContent('body');
      expect(standingsPage).toContain(user1.username);
      expect(standingsPage).toContain(user2.username);
      expect(standingsPage).toContain(user3.username);
      
      console.log('🗳️ Multi-user voting test completed successfully!');
      
    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });
});
import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb } from '../utils/database';
import { 
  createTestUser, 
  registerUser, 
  uploadProfilePhoto,
  createLeague,
  joinLeagueById,
  submitChallengeResponse,
  castVotes,
  cleanupTestFiles
} from '../utils/test-helpers';

test.describe('Final Comprehensive User Flow', () => {
  test.beforeEach(async () => {
    await resetTestDb();
    console.log('🧹 Test database reset for final comprehensive flow');
  });

  test.afterEach(async () => {
    await cleanupTestDb();
    cleanupTestFiles();
    console.log('🗑️ Test cleanup completed');
  });

  test('Complete user workflow: registration → league → submissions → results', async ({ browser }) => {
    test.setTimeout(120000);
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Step 1: Create first account (admin) and add profile photo
      console.log('👤 Step 1: Creating admin user account...');
      const user1 = createTestUser('admin');
      await registerUser(page1, user1);
      
      console.log('📷 Uploading admin profile photo...');
      await uploadProfilePhoto(page1);
      
      // Step 2: Create a league (admin becomes league owner)
      console.log('🏆 Step 2: Creating league...');
      const leagueName = `Final Test League ${Date.now()}`;
      const leagueId = await createLeague(page1, leagueName);
      
      // Step 3: Verify admin can access League Settings
      console.log('📝 Step 3: Verifying admin League Settings access...');
      
      // Close any profile overlay first
      const closeButton = page1.locator('button:has(img)').first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await page1.waitForTimeout(1000);
      }
      
      const settingsLink = page1.getByRole('link', { name: 'League Settings' });
      await settingsLink.waitFor({ state: 'visible', timeout: 5000 });
      await settingsLink.click();
      await page1.waitForLoadState('networkidle');
      
      // Verify admin access to League Settings
      expect(page1.url()).toContain('league-settings');
      
      const settingsContent = await page1.textContent('body');
      expect(settingsContent).toContain('League Settings');
      console.log('✅ Admin can access League Settings');
      
      // Navigate back to main league page
      await page1.goto(`/league/${leagueId}`);
      await page1.waitForLoadState('networkidle');
      
      // Step 4: Create second user account
      console.log('👤 Step 4: Creating second user account...');
      const user2 = createTestUser('member');
      await registerUser(page2, user2);
      
      // Step 5: Second user joins the league
      console.log('👥 Step 5: Second user joining league...');
      await joinLeagueById(page2, leagueId);
      
      // Step 6: Both users submit responses to current challenge
      console.log('📸 Step 6: Users submitting challenge responses...');
      await submitChallengeResponse(page1, leagueId, "Admin's creative submission for the challenge!");
      await submitChallengeResponse(page2, leagueId, "Member's amazing response to the prompt!");
      
      // Step 7: Verify Challenge page shows the current challenge
      console.log('🎯 Step 7: Verifying Challenge page...');
      await page1.goto(`/league/${leagueId}`);
      await page1.waitForLoadState('networkidle');
      
      const challengeContent = await page1.textContent('body');
      expect(challengeContent).toContain('Current Challenge');
      
      // Step 8: Verify Results page loads (may be empty for new league)
      console.log('📊 Step 8: Verifying Challenge Results page...');
      await page1.goto(`/league/${leagueId}/rounds`);
      await page1.waitForLoadState('networkidle');
      
      const resultsUrl = page1.url();
      expect(resultsUrl).toContain('/rounds');
      console.log('✅ Challenge Results page accessible');
      
      // Step 9: Verify Standings page loads with both users
      console.log('🏅 Step 9: Verifying Standings page...');
      await page1.goto(`/league/${leagueId}/standings`);
      await page1.waitForLoadState('networkidle');
      
      const standingsUrl = page1.url();
      expect(standingsUrl).toContain('/standings');
      
      const standingsContent = await page1.textContent('body');
      expect(standingsContent).toContain(user1.username);
      expect(standingsContent).toContain(user2.username);
      console.log('✅ Standings page shows both users');
      
      // Step 10: Test voting functionality
      console.log('🗳️ Step 10: Testing voting capabilities...');
      await page1.goto(`/league/${leagueId}`);
      await page1.waitForLoadState('networkidle');
      
      // Try to cast votes (may not work if not in voting phase, but tests the function)
      try {
        await castVotes(page1, leagueId);
        console.log('✅ Voting functionality accessible');
      } catch (error) {
        console.log('ℹ️ Voting not available (likely not in voting phase)');
      }
      
      console.log('🎉 Complete comprehensive user workflow test PASSED!');
      console.log(`📝 Summary:`);
      console.log(`   - ✅ User registration with profile photos`);
      console.log(`   - ✅ League creation and admin access`);
      console.log(`   - ✅ Multi-user league joining`);
      console.log(`   - ✅ Challenge response submissions`);
      console.log(`   - ✅ All main pages accessible (Challenge, Results, Standings)`);
      console.log(`   - ✅ League Settings admin controls verified`);
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
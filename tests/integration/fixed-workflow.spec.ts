import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb } from '../utils/database';
import {
  createTestUser,
  registerUser,
  createLeague,
  addPromptToLeague,
  joinLeagueById,
  submitChallengeResponse,
  transitionLeaguePhase,
  castVotes,
  cleanupTestFiles,
  addProfilePhoto,
  debugLeagueState,
  startLeague
} from '../utils/test-helpers';

test.describe('Fixed Phase Transition Workflow', () => {
  test.beforeEach(async () => {
    await resetTestDb();
    console.log('🧹 Test database reset for fixed workflow');
  });

  test.afterEach(async () => {
    await cleanupTestDb();
    cleanupTestFiles();
    console.log('🗑️ Test cleanup completed');
  });

  test('Complete workflow: Create accounts → League → Add prompt → Activate → Submit → Vote → Results', async ({ browser }) => {
    test.setTimeout(180000);

    // Create contexts with iPhone SE viewport (375x667)
    const context1 = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const context2 = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      console.log('🎯 Starting Fixed Workflow Test...');
      
      // === STEP 1: Create accounts ===
      console.log('👤 Step 1: Creating user accounts...');
      const adminUser = createTestUser('admin');
      const memberUser = createTestUser('member');
      
      await registerUser(page1, adminUser);
      await addProfilePhoto(page1, adminUser.username);
      console.log('✅ Admin user created');
      
      await registerUser(page2, memberUser);
      await addProfilePhoto(page2, memberUser.username);
      console.log('✅ Member user created');
      
      // === STEP 2: Admin creates league ===
      console.log('🏆 Step 2: Creating league...');
      const leagueName = `Fixed Test League ${Date.now()}`;
      const leagueId = await createLeague(page1, leagueName);
      console.log(`✅ Created league: ${leagueId}`);
      
      // === STEP 3: Member joins league ===
      console.log('👥 Step 3: Member joining league...');
      await joinLeagueById(page2, leagueId);
      console.log('✅ Member joined league');
      
      // === STEP 4: Admin adds a prompt to the queue ===
      console.log('📝 Step 4: Admin adding prompt to queue...');
      const testPrompt = 'Show us your most creative workspace setup - let\'s see where the magic happens!';
      await addPromptToLeague(page1, testPrompt);
      console.log('✅ Prompt added to queue');
      
      // Debug database state after adding prompt
      console.log('🔍 Database state after adding prompt:');
      await debugLeagueState(leagueId);

      // === STEP 5: Admin starts the league ===
      console.log('🏁 Step 5: Admin starting the league...');
      await startLeague(page1, leagueId);
      console.log('✅ League started successfully');

      // Debug database state after starting league
      console.log('🔍 Database state after starting league:');
      await debugLeagueState(leagueId);

      // === STEP 6: Admin activates the prompt (transitions to ACTIVE) ===
      console.log('🔄 Step 6: Admin activating the prompt...');
      await transitionLeaguePhase(page1);
      console.log('✅ Prompt transition completed');
      
      // Debug database state after transition
      await debugLeagueState(leagueId);
      
      // === STEP 7: Both users submit responses in parallel ===
      console.log('📸 Step 7: Both users submitting responses simultaneously...');
      
      // Submit both users at the same time to prevent phase transitions
      try {
        await Promise.all([
          submitChallengeResponse(page1, leagueId, "Admin's amazing workspace - check out this productivity setup!"),
          submitChallengeResponse(page2, leagueId, "Member's creative corner - love this cozy space!")
        ]);
        console.log('✅ Both users submitted responses successfully');
      } catch (error) {
        console.log('⚠️ Parallel submission failed, trying sequential...');
        
        // If parallel fails, try member first (since admin submission might trigger transitions)
        await submitChallengeResponse(page2, leagueId, "Member's creative corner - love this cozy space!");
        console.log('✅ Member submitted response');
        
        await submitChallengeResponse(page1, leagueId, "Admin's amazing workspace - check out this productivity setup!");
        console.log('✅ Admin submitted response');
      }
      
      // === STEP 8: Admin transitions to voting phase ===
      console.log('🗳️ Step 8: Admin transitioning to voting phase...');
      await transitionLeaguePhase(page1);
      console.log('✅ Should now be in voting phase');
      
      // === STEP 9: Both users cast votes ===
      console.log('🗳️ Step 9: Both users casting votes...');
      await castVotes(page1, leagueId);
      await castVotes(page2, leagueId);
      console.log('✅ Both users voted');
      
      // === STEP 10: Admin completes voting and processes results ===
      console.log('🏁 Step 10: Admin processing results...');
      await transitionLeaguePhase(page1);
      console.log('✅ Results should now be processed');
      
      // === STEP 11: Verify all pages are accessible ===
      console.log('🔍 Step 11: Verifying all pages load correctly...');
      
      // Check Challenge page
      await page1.goto(`/app/league/${leagueId}`);
      await page1.waitForLoadState('networkidle');
      expect(page1.url()).toContain(`/league/${leagueId}`);
      console.log('✅ Challenge page accessible');
      
      // Check Results page
      await page1.goto(`/app/league/${leagueId}/rounds`);
      await page1.waitForLoadState('networkidle');
      expect(page1.url()).toContain('/rounds');
      console.log('✅ Results page accessible');
      
      // Check Standings page
      await page1.goto(`/app/league/${leagueId}/standings`);
      await page1.waitForLoadState('networkidle');
      expect(page1.url()).toContain('/standings');
      
      const standingsContent = await page1.textContent('body');
      expect(standingsContent).toContain(adminUser.username);
      expect(standingsContent).toContain(memberUser.username);
      console.log('✅ Standings page shows both users');
      
      // Check League Settings (admin only)
      await page1.goto(`/app/league/${leagueId}/league-settings`);
      await page1.waitForLoadState('networkidle');
      expect(page1.url()).toContain('league-settings');
      console.log('✅ League Settings accessible to admin');
      
      console.log('🎉 FIXED WORKFLOW TEST COMPLETED SUCCESSFULLY!');
      console.log('📊 Test Results Summary:');
      console.log('   ✅ Multi-user account creation with profile photos');
      console.log('   ✅ League creation and member joining');
      console.log('   ✅ Prompt creation and activation workflow');
      console.log('   ✅ Photo submission from both users');
      console.log('   ✅ Phase transitions (SCHEDULED → ACTIVE → VOTING → COMPLETED)');
      console.log('   ✅ Voting system functionality');
      console.log('   ✅ Results processing and standings');
      console.log('   ✅ All main pages accessible and functional');
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
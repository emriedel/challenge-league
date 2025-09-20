import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb } from '../utils/database';

test.describe('Simple UI Flow Test', () => {
  test.beforeEach(async () => {
    await resetTestDb();
    console.log('🧹 Test database reset for simple UI test');
  });

  test.afterEach(async () => {
    await cleanupTestDb();
    console.log('🗑️ Test cleanup completed');
  });

  test('Simple flow: Create account → Create league → Navigate to Challenge tab', async ({ browser }) => {
    test.setTimeout(120000);

    // Create context with iPhone SE viewport (375x667)
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const page = await context.newPage();

    try {
      console.log('🎯 Starting Simple UI Flow Test...');

      // Step 1: Start at root site
      console.log('🏠 Step 1: Navigating to root site (/)');
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Take initial screenshot
      await page.screenshot({
        path: 'tests/temp/01-root-page.png',
        fullPage: true
      });
      console.log('📸 Screenshot: Root page');

      // Step 2: Navigate to create account (look for sign up button/link)
      console.log('👤 Step 2: Creating account via UI');

      // Look for sign up or get started buttons
      const signUpSelectors = [
        'a:has-text("Sign Up")',
        'a:has-text("Get Started")',
        'a:has-text("Create Account")',
        'button:has-text("Sign Up")',
        'button:has-text("Get Started")',
        '[href*="signup"]',
        '[href*="auth"]'
      ];

      let signUpFound = false;
      for (const selector of signUpSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`📍 Found sign up element: ${selector}`);
          await element.click();
          await page.waitForLoadState('networkidle');
          signUpFound = true;
          break;
        }
      }

      if (!signUpFound) {
        // Try navigating to /app/auth/signup directly as fallback
        console.log('⚠️ No sign up button found, trying direct navigation');
        await page.goto('/app/auth/signup');
        await page.waitForLoadState('networkidle');
      }

      // Take screenshot of signup page
      await page.screenshot({
        path: 'tests/temp/02-signup-page.png',
        fullPage: true
      });
      console.log('📸 Screenshot: Signup page');

      // Fill out signup form
      const timestamp = Date.now().toString().slice(-6);
      const testUser = {
        email: `simpletest${timestamp}@example.com`,
        password: 'password123',
        username: `simpletest${timestamp}`
      };

      console.log(`📝 Filling signup form for: ${testUser.email}`);

      // Fill email using reliable selector
      await page.fill('[data-testid="signup-email-input"]', testUser.email);

      // Fill username using reliable selector
      await page.fill('[data-testid="signup-username-input"]', testUser.username);

      // Fill password using reliable selector
      await page.fill('[data-testid="signup-password-input"]', testUser.password);

      // Submit form using reliable selector
      await page.click('[data-testid="signup-submit-button"]');

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('✅ Signup form submitted');

      // Take screenshot after signup
      await page.screenshot({
        path: 'tests/temp/03-after-signup.png',
        fullPage: true
      });
      console.log('📸 Screenshot: After signup');

      // Step 3: Handle profile photo upload step
      console.log('📷 Step 3: Handling profile photo upload');

      // Use reliable selector for profile setup buttons
      const skipButton = page.locator('[data-testid="profile-skip-button"]');
      const continueButton = page.locator('[data-testid="profile-continue-button"]');

      if (await skipButton.isVisible({ timeout: 3000 })) {
        console.log('📷 Found "Skip for now" button, clicking it');
        await skipButton.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Clicked "Skip for now"');
      } else if (await continueButton.isVisible({ timeout: 2000 })) {
        console.log('📷 Found "Continue to Challenge League" button, clicking it');
        await continueButton.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Clicked "Continue to Challenge League"');
      } else {
        console.log('⚠️ No profile setup buttons found');
      }

      // Step 4: Check if we're on the main page (skip onboarding for now)
      console.log('🎯 Step 4: Checking if we reached the main page');

      // Close TanStack devtools if it's open (interfering with other elements)
      const devtoolsClose = page.locator('button[aria-label="Close tanstack query devtools"]');
      if (await devtoolsClose.isVisible({ timeout: 2000 })) {
        await devtoolsClose.click();
        console.log('🔧 Closed TanStack devtools');
      }

      // Take screenshot after onboarding
      await page.screenshot({
        path: 'tests/temp/04-after-onboarding.png',
        fullPage: true
      });
      console.log('📸 Screenshot: After onboarding');

      // Step 5: Create a league
      console.log('🏆 Step 5: Creating a league');

      // Look for create league button using reliable selectors
      // Try welcome state button first, then dashboard button
      const createLeagueWelcome = page.locator('[data-testid="create-league-button-welcome"]');
      const createLeagueDashboard = page.locator('[data-testid="create-league-button-dashboard"]');

      let createLeagueFound = false;

      if (await createLeagueWelcome.isVisible({ timeout: 3000 })) {
        console.log('🏆 Found create league button (welcome state)');
        await createLeagueWelcome.click();
        await page.waitForLoadState('networkidle');
        createLeagueFound = true;
      } else if (await createLeagueDashboard.isVisible({ timeout: 3000 })) {
        console.log('🏆 Found create league button (dashboard state)');
        await createLeagueDashboard.click();
        await page.waitForLoadState('networkidle');
        createLeagueFound = true;
      }

      if (!createLeagueFound) {
        console.log('⚠️ No create league button found, trying direct navigation to /app/new');
        await page.goto('/app/new');
        await page.waitForLoadState('networkidle');
      }

      // Take screenshot of create league page
      await page.screenshot({
        path: 'tests/temp/05-create-league-page.png',
        fullPage: true
      });
      console.log('📸 Screenshot: Create league page');

      // Fill out league creation form using reliable selectors
      const leagueName = `Simple Test League ${timestamp}`;
      const leagueDescription = 'A simple test league for UI testing purposes';
      console.log(`🏆 Creating league: ${leagueName}`);

      // Fill league name (required field)
      await page.fill('[data-testid="league-name-input"]', leagueName);

      // Fill league description (required field - this was the missing piece!)
      await page.fill('[data-testid="league-description-input"]', leagueDescription);

      // Submit league creation using reliable selector
      await page.click('[data-testid="create-league-button"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('✅ League creation form submitted');

      // Take screenshot after league creation
      await page.screenshot({
        path: 'tests/temp/06-after-league-creation.png',
        fullPage: true
      });
      console.log('📸 Screenshot: After league creation');

      // Step 6: Navigate to the created league to see the Challenge page
      console.log('🎯 Step 6: Navigating to the created league');

      // After league creation, we should be redirected to the league page
      // If not, we can try navigating to the Challenge tab via /app

      // Wait a moment for any redirects to complete
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`🔍 Current URL after league creation: ${currentUrl}`);

      // If we're not already on a league page, navigate to /app to see the league
      if (!currentUrl.includes('/league/')) {
        console.log('⚠️ Not on league page, navigating to /app to find our league');
        await page.goto('/app');
        await page.waitForLoadState('networkidle');

        // Try to click on our newly created league if it's visible
        const leagueLink = page.locator(`a:has-text("${leagueName}")`).first();
        if (await leagueLink.isVisible({ timeout: 5000 })) {
          console.log('🎯 Found our league in the list, clicking it');
          await leagueLink.click();
          await page.waitForLoadState('networkidle');
        }
      }

      // Take final screenshot of what we see on the Challenge page
      await page.screenshot({
        path: 'tests/temp/07-final-challenge-page.png',
        fullPage: true
      });
      console.log('📸 Screenshot: Final Challenge page');

      // Log final state and check for WaitingToStartState component
      console.log('🔍 Final page URL:', page.url());
      console.log('📄 Final page title:', await page.title());

      // Check for the Start League button using our reliable selector
      const startLeagueButton = page.locator('[data-testid="start-league-button"]');
      const startLeagueButtonVisible = await startLeagueButton.isVisible({ timeout: 3000 });

      console.log('🎯 Start League button visible:', startLeagueButtonVisible);

      if (startLeagueButtonVisible) {
        console.log('✅ SUCCESS: WaitingToStartState component is rendering!');
        console.log('🎯 This means league was created with isStarted: false');
        console.log('🎉 We can now test the Start League functionality!');
      } else {
        console.log('❌ Start League button not found');

        // Check what we do see on the page
        const bodyText = await page.textContent('body');
        console.log('📄 Page contains "Start League" text:', bodyText?.includes('Start League') || false);
        console.log('📄 Page contains "Current Challenge":', bodyText?.includes('Current Challenge') || false);
        console.log('📄 Page contains "Waiting":', bodyText?.includes('Waiting') || false);
        console.log('📄 Page text preview:', bodyText?.substring(0, 200) + '...');
      }

      console.log('🎉 Simple UI Flow Test completed successfully!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);

      // Take error screenshot
      await page.screenshot({
        path: 'tests/temp/error-screenshot.png',
        fullPage: true
      });
      console.log('📸 Error screenshot saved');

      throw error;
    } finally {
      await context.close();
    }
  });
});
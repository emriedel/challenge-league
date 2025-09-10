const { chromium } = require('playwright');
const path = require('path');

async function testJoinLeagueFlow() {
  console.log('🎯 Testing Join League Flow and Member Journey...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for better visibility
  });
  
  const adminContext = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const memberContext = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const adminPage = await adminContext.newPage();
  const memberPage = await memberContext.newPage();
  
  try {
    // === ADMIN SETUP ===
    console.log('👤 Creating admin account...');
    await adminPage.goto('http://localhost:3000/app/auth/signup');
    await adminPage.waitForLoadState('networkidle');
    
    // Fill admin signup
    const adminUsername = `admin_${Date.now()}`;
    await adminPage.fill('input[name="username"]', adminUsername);
    await adminPage.fill('input[name="email"]', `${adminUsername}@test.com`);
    await adminPage.fill('input[name="password"]', 'password123');
    await adminPage.click('button[type="submit"]');
    
    // Handle profile setup
    await adminPage.waitForURL(/\/app\/profile\/setup/, { timeout: 10000 });
    console.log('✅ Admin redirected to profile setup');
    
    // Skip profile photo for now
    await adminPage.click('button:has-text("Skip for now"), button:has-text("Get Started")');
    
    await adminPage.waitForURL(/\/app/, { timeout: 10000 });
    console.log('✅ Admin in main app');
    
    // === MEMBER SETUP ===  
    console.log('👥 Creating member account...');
    await memberPage.goto('http://localhost:3000/app/auth/signup');
    await memberPage.waitForLoadState('networkidle');
    
    // Fill member signup
    const memberUsername = `member_${Date.now()}`;
    await memberPage.fill('input[name="username"]', memberUsername);
    await memberPage.fill('input[name="email"]', `${memberUsername}@test.com`);
    await memberPage.fill('input[name="password"]', 'password123');
    await memberPage.click('button[type="submit"]');
    
    // Handle member profile setup
    await memberPage.waitForURL(/\/app\/profile\/setup/, { timeout: 10000 });
    console.log('✅ Member redirected to profile setup');
    
    // Take screenshot of member profile setup
    await memberPage.screenshot({ 
      path: './test-screenshots/member-profile-setup.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: member-profile-setup.png');
    
    // Skip profile photo 
    await memberPage.click('button:has-text("Skip for now"), button:has-text("Get Started")');
    
    await memberPage.waitForURL(/\/app/, { timeout: 10000 });
    console.log('✅ Member in main app');
    
    // Take screenshot of member main app
    await memberPage.screenshot({ 
      path: './test-screenshots/member-main-app.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: member-main-app.png');
    
    // === TEST JOIN LEAGUE FUNCTIONALITY ===
    console.log('🔗 Testing join league functionality...');
    
    // Navigate to join league page
    await memberPage.goto('http://localhost:3000/app/join');
    await memberPage.waitForLoadState('networkidle');
    await memberPage.waitForTimeout(2000); // Wait for leagues to load
    
    // Take screenshot of join league page
    await memberPage.screenshot({ 
      path: './test-screenshots/member-join-league-page.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: member-join-league-page.png');
    
    // Check if any leagues are available
    const leagueCards = await memberPage.locator('.bg-app-surface .font-semibold').count();
    console.log(`📊 Found ${leagueCards} available leagues to join`);
    
    if (leagueCards > 0) {
      console.log('🎯 Testing one-click join functionality...');
      
      // Get the first league name
      const firstLeagueName = await memberPage.locator('.bg-app-surface .font-semibold').first().textContent();
      console.log(`🎯 Attempting to join league: "${firstLeagueName}"`);
      
      // Click the first "Join League" button
      await memberPage.locator('button:has-text("Join League")').first().click();
      
      // Wait for either redirect or error
      await memberPage.waitForTimeout(3000);
      
      // Take screenshot of result
      await memberPage.screenshot({ 
        path: './test-screenshots/member-after-join-attempt.png',
        fullPage: true 
      });
      console.log('📸 Screenshot: member-after-join-attempt.png');
      
      // Check current URL
      const currentUrl = memberPage.url();
      console.log(`📍 Member current URL after join attempt: ${currentUrl}`);
      
      if (currentUrl.includes('/app/league/')) {
        console.log('✅ Successfully joined league and redirected!');
        
        // Take screenshot of league page
        await memberPage.screenshot({ 
          path: './test-screenshots/member-in-league.png',
          fullPage: true 
        });
        console.log('📸 Screenshot: member-in-league.png');
        
      } else {
        console.log('⚠️ Join attempt did not redirect to league page');
        const pageContent = await memberPage.textContent('body');
        console.log('📄 Page content contains error:', pageContent.includes('error') || pageContent.includes('Error'));
      }
    } else {
      console.log('ℹ️ No available leagues found - testing manual join functionality...');
      
      // Click "Join by ID" button
      await memberPage.click('button:has-text("Join by ID")');
      await memberPage.waitForTimeout(1000);
      
      // Take screenshot of manual join form
      await memberPage.screenshot({ 
        path: './test-screenshots/member-manual-join-form.png',
        fullPage: true 
      });
      console.log('📸 Screenshot: member-manual-join-form.png');
    }
    
    console.log('🎉 Join league flow testing completed!');
    
    // Wait a moment for final actions to complete
    await memberPage.waitForTimeout(2000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    await memberPage.screenshot({ 
      path: './test-screenshots/member-error-state.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: member-error-state.png');
    
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('./test-screenshots')) {
  fs.mkdirSync('./test-screenshots');
}

testJoinLeagueFlow().catch(console.error);
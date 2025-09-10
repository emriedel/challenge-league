const { chromium } = require('playwright');

async function debugAdminView() {
  console.log('🔍 Debugging: What does admin see after login?');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Create admin account
    console.log('👤 Creating admin account...');
    await page.goto('http://localhost:3000/app/auth/signup');
    await page.waitForLoadState('networkidle');
    
    const adminUsername = `debug_admin_${Date.now()}`;
    await page.fill('input[name="username"]', adminUsername);
    await page.fill('input[name="email"]', `${adminUsername}@test.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Handle profile setup
    await page.waitForURL(/\/app\/profile\/setup/, { timeout: 10000 });
    console.log('✅ Admin at profile setup');
    
    // Take screenshot of profile setup
    await page.screenshot({ 
      path: './test-screenshots/debug-profile-setup.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: debug-profile-setup.png');
    
    // Skip profile setup
    await page.click('button:has-text("Skip for now"), button:has-text("Continue to Challenge League")');
    
    await page.waitForURL(/\/app/, { timeout: 10000 });
    console.log('✅ Admin reached main app');
    
    // Take screenshot of main app page
    await page.screenshot({ 
      path: './test-screenshots/debug-main-app.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: debug-main-app.png');
    
    // Check what elements are available
    const pageContent = await page.textContent('body');
    console.log('📄 Page contains "Create":', pageContent.includes('Create'));
    console.log('📄 Page contains "League":', pageContent.includes('League'));
    console.log('📄 Page contains "Join":', pageContent.includes('Join'));
    
    // Look for all buttons and links
    const buttons = await page.locator('button').allTextContents();
    console.log('🔘 All buttons found:', buttons);
    
    const links = await page.locator('a').allTextContents();
    console.log('🔗 All links found:', links);
    
    // Check current URL
    console.log('📍 Current URL:', page.url());
    
    // Wait for manual inspection
    console.log('🔍 Browser left open for manual inspection...');
    console.log('Check the debug screenshots to see what the admin sees!');
    
    // Keep browser open
    await new Promise(resolve => {
      setTimeout(() => {
        console.log('👋 Closing browser...');
        browser.close().then(resolve);
      }, 10000); // Auto-close after 10 seconds
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: './test-screenshots/debug-error.png',
      fullPage: true 
    });
    console.log('📸 Screenshot: debug-error.png');
    
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('./test-screenshots')) {
  fs.mkdirSync('./test-screenshots');
}

debugAdminView().catch(console.error);
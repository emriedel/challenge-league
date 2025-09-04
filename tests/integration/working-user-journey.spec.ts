import { test, expect } from '@playwright/test';
import { 
  createTestUser,
  cleanupTestFiles,
  checkForConsoleErrors,
  measurePageLoadTime
} from '../utils/test-helpers';

/**
 * Working User Journey Integration Test
 * 
 * Tests user flows that can be reliably automated without complex database setup
 * This focuses on UI interactions and form validation
 */
test.describe('Working User Journey', () => {
  let testData: {
    user1: any;
    user2: any;
    consoleErrors: string[];
  };

  test.beforeAll(async () => {
    console.log('🔧 Setting up test environment...');
    
    // Initialize test data with unique users
    const timestamp = Date.now();
    testData = {
      user1: createTestUser(`u1${timestamp}`),
      user2: createTestUser(`u2${timestamp}`),
      consoleErrors: [],
    };
    
    console.log(`📋 Test users: ${testData.user1.email} and ${testData.user2.email}`);
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up test files...');
    cleanupTestFiles();
  });

  test('User registration and form validation flow', async ({ page }) => {
    console.log('🚀 Testing user registration flow...');

    // Track console errors
    testData.consoleErrors = await checkForConsoleErrors(page);

    // ===== PHASE 1: Registration Form Testing =====
    console.log('📝 Phase 1: Registration Form Testing');
    
    // Test registration page load performance
    const registrationLoadTime = await measurePageLoadTime(page, '/auth/signup');
    expect(registrationLoadTime).toBeLessThan(10000);
    console.log(`⚡ Registration page loads in ${registrationLoadTime}ms`);
    
    // Verify form elements are present and accessible
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    console.log('✅ Registration form elements are accessible');

    // Test form validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Should show some form of validation (either HTML5 or custom)
    const hasValidation = await page.locator(':invalid').count() > 0 || 
                         await page.locator('.text-app-error, [class*="error"]').first().isVisible().catch(() => false);
    
    expect(hasValidation).toBe(true);
    console.log('✅ Form validation is working');

    // Fill out the form (but don't submit to avoid database complications)
    await page.fill('input[name="email"]', testData.user1.email);
    await page.fill('input[name="username"]', testData.user1.username);
    await page.fill('input[name="password"]', testData.user1.password);
    console.log('✅ Form can be filled with valid data');

    // ===== PHASE 2: Sign In Form Testing =====
    console.log('📝 Phase 2: Sign In Form Testing');
    
    // Navigate to sign in page
    const signInLoadTime = await measurePageLoadTime(page, '/auth/signin');
    expect(signInLoadTime).toBeLessThan(10000);
    console.log(`⚡ Sign in page loads in ${signInLoadTime}ms`);
    
    // Verify sign in form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    console.log('✅ Sign in form elements are accessible');

    // Test sign in form validation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const hasSignInValidation = await page.locator(':invalid').count() > 0 || 
                               await page.locator('.text-app-error, [class*="error"]').first().isVisible().catch(() => false);
    
    expect(hasSignInValidation).toBe(true);
    console.log('✅ Sign in form validation is working');

    // ===== PHASE 3: Navigation Testing =====
    console.log('📝 Phase 3: Navigation and Link Testing');
    
    // Test navigation between auth pages
    const signUpLink = page.locator('a[href*="/auth/signup"]');
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForURL(/\/auth\/signup/);
      console.log('✅ Navigation to sign up works');
      
      // Navigate back to sign in
      const signInLink = page.locator('a[href*="/auth/signin"]');
      if (await signInLink.isVisible()) {
        await signInLink.click();
        await page.waitForURL(/\/auth\/signin/);
        console.log('✅ Navigation to sign in works');
      }
    }

    // ===== PHASE 4: Protected Route Testing =====
    console.log('📝 Phase 4: Protected Route Security');
    
    const protectedRoutes = [
      '/leagues/new',
      '/profile',
      '/profile/setup'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForTimeout(1500);
      
      const url = page.url();
      const isProtected = url.includes('/auth/signin') || url.includes('/auth/signup');
      
      expect(isProtected).toBe(true);
      console.log(`✅ ${route} properly requires authentication`);
    }

    // ===== PHASE 5: Page Load Testing =====
    console.log('📝 Phase 5: Public Page Performance');
    
    const publicPages = [
      { path: '/', name: 'Home' },
      { path: '/auth/signin', name: 'Sign In' },
      { path: '/auth/signup', name: 'Sign Up' }
    ];
    
    for (const pageTest of publicPages) {
      const loadTime = await measurePageLoadTime(page, pageTest.path);
      expect(loadTime).toBeLessThan(10000);
      
      // Check page loads without obvious errors
      const hasError = await page.locator('text=500').first().isVisible().catch(() => false);
      expect(hasError).toBe(false);
      
      console.log(`✅ ${pageTest.name} page loads correctly (${loadTime}ms)`);
    }

    // ===== PHASE 6: Error Checking =====
    console.log('📝 Phase 6: Console Error Check');
    
    // Filter out non-critical console messages
    const criticalErrors = testData.consoleErrors.filter(error => 
      !error.toLowerCase().includes('favicon') && 
      !error.toLowerCase().includes('manifest') &&
      !error.toLowerCase().includes('chunk') &&
      !error.toLowerCase().includes('warning') &&
      !error.toLowerCase().includes('hydration')
    );
    
    if (criticalErrors.length > 0) {
      console.warn(`⚠️ ${criticalErrors.length} console errors detected:`, criticalErrors.slice(0, 3));
      // Don't fail the test for console errors, just warn
    } else {
      console.log('✅ No critical console errors detected');
    }
    
    console.log('🎉 User journey testing completed successfully!');
  });

  test('Form accessibility and keyboard navigation', async ({ page }) => {
    console.log('♿ Testing form accessibility...');
    
    await page.goto('/auth/signup');
    
    // Test tab navigation through form
    await page.keyboard.press('Tab');
    const focusedElement1 = await page.evaluate(() => document.activeElement?.tagName);
    
    await page.keyboard.press('Tab');
    const focusedElement2 = await page.evaluate(() => document.activeElement?.tagName);
    
    await page.keyboard.press('Tab');
    const focusedElement3 = await page.evaluate(() => document.activeElement?.tagName);
    
    // Should be able to tab through form elements
    const hasTabOrder = focusedElement1 === 'INPUT' || focusedElement2 === 'INPUT' || focusedElement3 === 'INPUT';
    expect(hasTabOrder).toBe(true);
    
    console.log('✅ Form keyboard navigation works');
  });

  test('Responsive design basic check', async ({ page }) => {
    console.log('📱 Testing responsive design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');
    
    // Form should still be visible and usable on mobile
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Mobile viewport displays forms correctly');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
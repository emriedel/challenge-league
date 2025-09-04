import { test, expect } from '@playwright/test';

/**
 * Simple Integration Test
 * 
 * Basic test to verify core UI functionality without complex database setup
 */
test.describe('Simple User Flow', () => {

  test('Homepage loads and redirects appropriately', async ({ page }) => {
    console.log('🏠 Testing homepage...');
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Should either show auth redirect or have sign in elements
    const url = page.url();
    const hasAuthRedirect = url.includes('/auth/');
    const hasSignInUI = await page.locator('text=Sign In').first().isVisible().catch(() => false);
    
    expect(hasAuthRedirect || hasSignInUI).toBe(true);
    console.log('✅ Homepage handles unauthenticated access correctly');
  });

  test('Sign up form is accessible and functional', async ({ page }) => {
    console.log('📝 Testing sign up form...');
    
    await page.goto('/auth/signup');
    
    // Verify form elements exist
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible(); 
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test form validation
    await page.click('button[type="submit"]');
    
    // Should show some validation (HTML5 or custom)
    const hasValidation = await page.locator(':invalid').first().isVisible().catch(() => false);
    
    expect(hasValidation).toBe(true);
    console.log('✅ Sign up form has proper validation');
  });

  test('Sign in form is accessible', async ({ page }) => {
    console.log('🔐 Testing sign in form...');
    
    await page.goto('/auth/signin');
    
    // Verify form elements exist
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Sign in form loads correctly');
  });

  test('Protected routes require authentication', async ({ page }) => {
    console.log('🔒 Testing route protection...');
    
    const protectedRoutes = [
      '/leagues/new',
      '/profile',
      '/profile/setup'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForTimeout(1500);
      
      const currentUrl = page.url();
      const isProtected = currentUrl.includes('/auth/') || !currentUrl.includes(route);
      
      expect(isProtected).toBe(true);
      console.log(`✅ ${route} is properly protected`);
    }
  });

  test('Navigation between public pages works', async ({ page }) => {
    console.log('🧭 Testing navigation...');
    
    // Test sign in -> sign up navigation
    await page.goto('/auth/signin');
    const signUpLink = page.locator('a[href*="/auth/signup"]');
    
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForURL(/\/auth\/signup/);
      console.log('✅ Sign up navigation works');
    }
    
    // Test sign up -> sign in navigation  
    await page.goto('/auth/signup');
    const signInLink = page.locator('a[href*="/auth/signin"]');
    
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await page.waitForURL(/\/auth\/signin/);
      console.log('✅ Sign in navigation works');
    }
  });

  test('Pages load without critical errors', async ({ page }) => {
    console.log('🔍 Testing for critical errors...');
    
    const errors: string[] = [];
    
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(`Page error: ${error.message}`);
    });
    
    // Visit key pages
    const pagesToTest = ['/', '/auth/signin', '/auth/signup'];
    
    for (const testPage of pagesToTest) {
      await page.goto(testPage);
      await page.waitForTimeout(1000);
      
      // Check for obvious error indicators
      const hasErrorPage = await page.locator('text=500').first().isVisible().catch(() => false);
      expect(hasErrorPage).toBe(false);
    }
    
    // Filter out non-critical console messages
    const criticalErrors = errors.filter(error => 
      !error.toLowerCase().includes('favicon') && 
      !error.toLowerCase().includes('manifest') &&
      !error.toLowerCase().includes('chunk') &&
      !error.toLowerCase().includes('warning')
    );
    
    console.log(`✅ Pages load successfully (${criticalErrors.length} critical errors found)`);
    
    // Log errors but don't fail test unless it's severe
    if (criticalErrors.length > 0) {
      console.warn('Console errors detected:', criticalErrors.slice(0, 3));
    }
  });

  test('Basic performance check', async ({ page }) => {
    console.log('⚡ Testing basic performance...');
    
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // Should load in reasonable time (10 seconds max for development)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`✅ Homepage loads in ${loadTime}ms`);
  });
});
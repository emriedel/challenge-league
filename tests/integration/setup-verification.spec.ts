import { test, expect } from '@playwright/test';
import { 
  resetTestDb, 
  seedTestDb, 
  cleanupTestDb 
} from '../utils/database';

/**
 * Simple setup verification test to ensure the testing infrastructure works
 */
test.describe('Setup Verification', () => {
  test.beforeAll(async () => {
    console.log('🔧 Setting up test environment...');
    await resetTestDb();
    await seedTestDb();
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up test environment...');
    await cleanupTestDb();
  });

  test('Homepage loads correctly', async ({ page }) => {
    console.log('🏠 Testing homepage load...');
    
    await page.goto('/');
    
    // Check that we can reach the homepage
    await expect(page).toHaveURL('/');
    
    // Should either show sign in prompt or redirect to auth
    const hasSignIn = await page.locator('text=Sign In').isVisible().catch(() => false);
    const isAuthPage = page.url().includes('/auth/');
    
    expect(hasSignIn || isAuthPage).toBe(true);
    
    console.log('✅ Homepage loads correctly');
  });

  test('Database utilities work correctly', async () => {
    console.log('🗄️ Testing database utilities...');
    
    // Test database operations don't throw errors
    await resetTestDb();
    const { mainLeague } = await seedTestDb();
    
    expect(mainLeague).toBeTruthy();
    expect(mainLeague.name).toBe('Main League');
    
    console.log('✅ Database utilities work correctly');
  });
});
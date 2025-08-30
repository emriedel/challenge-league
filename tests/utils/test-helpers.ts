import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Test helper utilities for Playwright tests
 */

export interface TestUser {
  email: string;
  password: string;
  username: string;
}

/**
 * Generate unique test user data
 */
export function createTestUser(suffix?: string): TestUser {
  const id = suffix || Math.random().toString(36).slice(2, 8);
  return {
    email: `testuser${id}@example.com`,
    password: 'password123',
    username: `testuser${id}`,
  };
}

/**
 * Register a new user account
 */
export async function registerUser(page: Page, user: TestUser): Promise<void> {
  console.log(`📝 Registering user: ${user.email}`);
  
  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');
  
  // Fill form fields
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="username"]', user.username);
  await page.fill('input[name="password"]', user.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for either profile setup or success state
  await page.waitForTimeout(3000);
  
  // Check if we're at profile setup or home page (successful registration)
  const url = page.url();
  const isSuccess = url.includes('/profile/setup') || url.endsWith('/') || !url.includes('/auth/');
  
  if (!isSuccess) {
    // Check for error messages
    const errorMessage = await page.locator('.bg-app-error-bg, .text-app-error, [class*="error"]').first().textContent().catch(() => null);
    if (errorMessage) {
      throw new Error(`Registration failed: ${errorMessage}`);
    }
    throw new Error(`Registration failed: unexpected redirect to ${url}`);
  }
  
  console.log(`✅ User registered successfully: ${user.email}`);
}

/**
 * Sign in an existing user
 */
export async function signInUser(page: Page, user: TestUser): Promise<void> {
  console.log(`🔐 Signing in user: ${user.email}`);
  
  await page.goto('/auth/signin');
  await page.waitForLoadState('networkidle');
  
  // Fill form fields
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForTimeout(3000);
  
  // Check if we're no longer on sign in page
  const url = page.url();
  if (url.includes('/auth/signin')) {
    // Check for error messages
    const errorMessage = await page.locator('.bg-app-error-bg, .text-app-error, [class*="error"]').first().textContent().catch(() => null);
    if (errorMessage) {
      throw new Error(`Sign in failed: ${errorMessage}`);
    }
    throw new Error(`Sign in failed: still on sign in page`);
  }
  
  console.log(`✅ User signed in successfully: ${user.email}`);
}

/**
 * Upload a profile photo for the current user
 */
export async function uploadProfilePhoto(page: Page): Promise<void> {
  // Create a temporary test image file
  const testImagePath = await createTestImage();
  
  try {
    // Go to profile setup page
    await page.goto('/profile/setup');
    
    // Upload the profile photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for upload to complete and save
    await page.click('button[type="submit"]');
    
    // Wait for redirect to home or profile page
    await expect(page).not.toHaveURL(/\/profile\/setup/);
  } finally {
    // Clean up test image file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

/**
 * Create a test league with the current user as admin
 */
export async function createLeague(page: Page, leagueName: string): Promise<void> {
  await page.goto('/leagues/new');
  
  await page.fill('input[name="name"]', leagueName);
  await page.fill('textarea[name="description"]', `Test league: ${leagueName}`);
  
  await page.click('button[type="submit"]');
  
  // Wait for successful creation (should redirect to league page)
  await page.waitForURL(/\/league\/[^\/]+$/);
}

/**
 * Add a prompt to a league via League Settings
 */
export async function addPromptToLeague(page: Page, promptText: string): Promise<void> {
  // Navigate to League Settings
  await page.click('text=League Settings');
  await page.waitForURL(/\/league\/[^\/]+\/league-settings/);
  
  // Add new prompt
  await page.fill('textarea[name="text"]', promptText);
  await page.selectOption('select[name="category"]', 'GENERAL');
  await page.selectOption('select[name="difficulty"]', '1');
  
  await page.click('button:has-text("Add Prompt")');
  
  // Wait for prompt to be added
  await expect(page.locator(`text=${promptText}`)).toBeVisible();
}

/**
 * Join an existing league by ID
 */
export async function joinLeague(page: Page, leagueId: string): Promise<void> {
  await page.goto(`/leagues/join?id=${leagueId}`);
  
  await page.click('button:has-text("Join League")');
  
  // Wait for successful join (should redirect to league page)
  await page.waitForURL(/\/league\/[^\/]+$/);
}

/**
 * Submit a photo response to the current challenge
 */
export async function submitChallengeResponse(page: Page, caption: string): Promise<void> {
  // Create a temporary test image file
  const testImagePath = await createTestImage();
  
  try {
    // Go to league home page (where challenge should be visible)
    await page.goto('/');
    
    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Add caption
    await page.fill('textarea[name="caption"]', caption);
    
    // Submit response
    await page.click('button:has-text("Submit Response")');
    
    // Wait for successful submission
    await expect(page.locator('text=Response submitted successfully')).toBeVisible();
  } finally {
    // Clean up test image file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

/**
 * Transition league phase using League Settings button
 */
export async function transitionLeaguePhase(page: Page): Promise<void> {
  // Navigate to League Settings
  await page.click('text=League Settings');
  await page.waitForURL(/\/league\/[^\/]+\/league-settings/);
  
  // Look for phase transition button (could be "Start Voting" or "Process Results")
  const transitionButton = page.locator('button:has-text("Start Voting"), button:has-text("Process Results")').first();
  
  if (await transitionButton.isVisible()) {
    await transitionButton.click();
    
    // Wait for transition to complete
    await page.waitForTimeout(2000);
    
    // Refresh to see new state
    await page.reload();
  }
}

/**
 * Vote for photos in the voting phase
 */
export async function castVotes(page: Page, numberOfVotes: number = 3): Promise<void> {
  // Go to league home page where voting should be visible
  await page.goto('/');
  
  // Find photo items and cast votes
  const photoItems = page.locator('[data-testid="photo-item"]');
  const count = await photoItems.count();
  
  const votesToCast = Math.min(numberOfVotes, count);
  
  for (let i = 0; i < votesToCast; i++) {
    const photoItem = photoItems.nth(i);
    
    // Double-tap or click vote button
    const voteButton = photoItem.locator('button:has-text("Vote")');
    if (await voteButton.isVisible()) {
      await voteButton.click();
    } else {
      // Try double-tap
      await photoItem.dblclick();
    }
    
    await page.waitForTimeout(500); // Small delay between votes
  }
}

/**
 * Create a temporary test image file
 */
async function createTestImage(): Promise<string> {
  const testDir = path.join(process.cwd(), 'tests', 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const fileName = `test-image-${Date.now()}.png`;
  const filePath = path.join(testDir, fileName);
  
  // Create a simple 100x100 PNG file (minimal valid PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64, // 100x100 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x70, 0xE2, 0x95, // RGBA, compression, filter, interlace
    0x25, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk start
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // Minimal image data
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(filePath, pngData);
  
  return filePath;
}

/**
 * Clean up temporary test files
 */
export function cleanupTestFiles(): void {
  const testDir = path.join(process.cwd(), 'tests', 'temp');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

/**
 * Wait for element to be visible with timeout
 */
export async function waitForVisible(page: Page, selector: string, timeout: number = 10000): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Check for console errors and log them
 */
export async function checkForConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(`Page error: ${error.message}`);
  });
  
  return errors;
}

/**
 * Basic performance check - measure page load time
 */
export async function measurePageLoadTime(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  const endTime = Date.now();
  
  return endTime - startTime;
}
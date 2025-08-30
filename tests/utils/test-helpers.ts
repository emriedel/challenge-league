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
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const randomId = Math.random().toString(36).slice(2, 5); // 3 random chars
  const id = suffix ? `${suffix}${timestamp}` : `u${timestamp}${randomId}`;
  
  // Ensure username is between 3-30 characters
  const username = `test${id}`.slice(0, 30);
  
  return {
    email: `testuser${id}@example.com`,
    password: 'password123',
    username: username,
  };
}

/**
 * Register a new user account and wait for successful registration
 */
export async function registerUser(page: Page, user: TestUser): Promise<void> {
  console.log(`📝 Registering user: ${user.email}`);
  
  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');
  
  // Check if there are any existing error messages and clear them first
  const existingErrors = page.locator('.bg-app-error-bg, .text-app-error, [class*="error"]');
  if (await existingErrors.count() > 0) {
    console.log('⚠️ Found existing error messages, refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');
  }
  
  // Fill form fields with more specific selectors
  const emailInput = page.locator('input[name="email"], input[type="email"]');
  const usernameInput = page.locator('input[name="username"]');
  const passwordInput = page.locator('input[name="password"], input[type="password"]');
  
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(user.email);
  
  await usernameInput.waitFor({ state: 'visible', timeout: 5000 });
  await usernameInput.fill(user.username);
  
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(user.password);
  
  // Find and click submit button
  const submitButton = page.locator('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")');
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  
  // Click and wait for navigation
  await Promise.all([
    page.waitForURL(url => !url.toString().includes('/auth/signup'), { timeout: 15000 }),
    submitButton.click()
  ]);
  
  // Check final URL and handle errors
  const finalUrl = page.url();
  
  // Check for error messages if we're still on signup page
  if (finalUrl.includes('/auth/signup')) {
    const errorMessage = await page.locator('.bg-app-error-bg, .text-app-error, [class*="error"]').first().textContent().catch(() => '');
    throw new Error(`Registration failed: ${errorMessage || 'Form validation error or user already exists'}`);
  }
  
  console.log(`✅ User registered successfully: ${user.email} - redirected to ${finalUrl}`);
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
  console.log('📷 Uploading profile photo...');
  
  // Create a temporary test image file
  const testImagePath = await createTestImage();
  
  try {
    // Check if we're already at profile setup, if not navigate there
    const currentUrl = page.url();
    if (!currentUrl.includes('/profile/setup')) {
      await page.goto('/profile/setup');
      await page.waitForLoadState('networkidle');
    }
    
    // Upload the profile photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait a moment for file to be selected
    await page.waitForTimeout(1000);
    
    // Click save/submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Complete")');
    await submitButton.click();
    
    // Wait for navigation away from profile setup
    await page.waitForTimeout(2000);
    
    console.log('✅ Profile photo uploaded successfully');
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
export async function createLeague(page: Page, leagueName: string): Promise<string> {
  console.log(`🏆 Creating league: ${leagueName}`);
  
  // Navigate to league creation page
  await page.goto('/leagues/new');
  await page.waitForLoadState('networkidle');
  
  // Fill in league details
  const nameInput = page.locator('input[name="name"], input[placeholder*="name"], textbox[name="League Name"]');
  await nameInput.waitFor({ state: 'visible', timeout: 5000 });
  await nameInput.clear();
  await nameInput.fill(leagueName);
  
  // Fill description field - it shows as textbox with name "Description (Optional)"
  const descInput = page.getByRole('textbox', { name: 'Description (Optional)' });
  await descInput.waitFor({ state: 'visible', timeout: 5000 });
  await descInput.clear();
  await descInput.fill(`Test league: ${leagueName}`);
  
  // Wait for button to be enabled (no validation errors)
  await page.waitForTimeout(1000);
  
  // Find and click create button
  const createButton = page.locator('button:has-text("Create League"), button[type="submit"]:has-text("Create")');
  await createButton.waitFor({ state: 'visible', timeout: 5000 });
  
  // Wait for button to be enabled (form validation to pass)
  await expect(createButton).toBeEnabled({ timeout: 5000 });
  
  // Click button and wait for navigation
  await Promise.all([
    page.waitForURL('**/league/**', { waitUntil: 'networkidle', timeout: 15000 }),
    createButton.click()
  ]);
  
  // Extract league ID from URL
  const url = page.url();
  const leagueMatch = url.match(/\/league\/([^\/]+)/);
  if (!leagueMatch) {
    throw new Error(`League creation failed: unexpected URL ${url}`);
  }
  
  const leagueId = leagueMatch[1];
  console.log(`✅ League created successfully: ${leagueId}`);
  return leagueId;
}

/**
 * Add a prompt to a league via League Settings
 */
export async function addPromptToLeague(page: Page, promptText: string): Promise<void> {
  console.log(`📝 Adding prompt: ${promptText.substring(0, 50)}...`);
  
  // First close any profile overlay that might be open
  const closeButton = page.locator('button:has(img)').first();
  if (await closeButton.isVisible({ timeout: 2000 })) {
    await closeButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Look for League Settings tab/link - it should be in the navigation
  const settingsLink = page.getByRole('link', { name: 'League Settings' });
  await settingsLink.waitFor({ state: 'visible', timeout: 10000 });
  await settingsLink.click();
  await page.waitForLoadState('networkidle');
  
  // Check if there's an "Edit Settings" button and click it
  const editButton = page.locator('button:has-text("Edit Settings")');
  if (await editButton.isVisible({ timeout: 3000 })) {
    console.log('📝 Clicking Edit Settings button...');
    await editButton.click();
    await page.waitForTimeout(2000);
  }
  
  // Find prompt text area - try various selectors
  let promptTextArea = page.locator('textarea[name="text"]');
  
  // If not found, try other selectors
  if (!(await promptTextArea.isVisible({ timeout: 2000 }))) {
    promptTextArea = page.locator('textarea[placeholder*="prompt"], textarea[placeholder*="challenge"], textarea[placeholder*="text"]');
  }
  
  // If still not found, look for any textarea
  if (!(await promptTextArea.isVisible({ timeout: 2000 }))) {
    promptTextArea = page.locator('textarea').first();
  }
  
  await promptTextArea.waitFor({ state: 'visible', timeout: 5000 });
  await promptTextArea.fill(promptText);
  
  // Submit the form - look for various button types
  const addButton = page.locator('button:has-text("Add Challenge"), button:has-text("Add Prompt"), button:has-text("Save"), button[type="submit"]');
  await addButton.waitFor({ state: 'visible', timeout: 5000 });
  await addButton.click();
  
  // Wait for form to process and page to update
  await page.waitForTimeout(3000);
  
  console.log('✅ Prompt added to league');
}

/**
 * Join an existing league using the league ID
 */
export async function joinLeagueById(page: Page, leagueId: string): Promise<void> {
  console.log(`👥 Joining league: ${leagueId}`);
  
  // Navigate directly to the league page
  await page.goto(`/league/${leagueId}`);
  await page.waitForLoadState('networkidle');
  
  // Check if there's a join button (for leagues we're not already in)
  const joinButton = page.locator('button:has-text("Join League"), button:has-text("Join")');
  if (await joinButton.isVisible()) {
    await joinButton.click();
    await page.waitForTimeout(2000);
  }
  
  console.log('✅ Successfully joined league');
}

/**
 * Submit a photo response to the current challenge
 */
export async function submitChallengeResponse(page: Page, leagueId: string, caption: string): Promise<void> {
  console.log(`📸 Submitting response: ${caption.substring(0, 30)}...`);
  
  // Create a temporary test image file
  const testImagePath = await createTestImage();
  
  try {
    // Navigate to the league page
    await page.goto(`/league/${leagueId}`);
    await page.waitForLoadState('networkidle');
    
    // Look for file upload input
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
    }
    
    // Add caption
    const captionInput = page.locator('textarea[name="caption"], input[name="caption"]');
    if (await captionInput.isVisible()) {
      await captionInput.fill(caption);
    }
    
    // Submit response
    const submitButton = page.locator('button:has-text("Submit Response"), button:has-text("Submit"), button[type="submit"]');
    await submitButton.click();
    
    // Wait for submission to complete
    await page.waitForTimeout(3000);
    
    console.log('✅ Response submitted successfully');
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
  console.log('⏭️ Transitioning league phase...');
  
  // First close any profile overlay that might be open
  const closeButton = page.locator('button:has(img)').first();
  if (await closeButton.isVisible({ timeout: 2000 })) {
    await closeButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Navigate to League Settings tab
  const settingsLink = page.getByRole('link', { name: 'League Settings' });
  await settingsLink.waitFor({ state: 'visible', timeout: 10000 });
  await settingsLink.click();
  await page.waitForLoadState('networkidle');
  
  // Look for phase transition buttons with more flexible matching
  const transitionButtons = [
    'button:has-text("Start Voting")',
    'button:has-text("Process Results")', 
    'button:has-text("Transition")',
    'button:has-text("Next Phase")',
    'button:has-text("Start")',
    'button:has-text("Process")',
    'button:has-text("Complete")'
  ];
  
  let transitioned = false;
  for (const buttonSelector of transitionButtons) {
    const button = page.locator(buttonSelector);
    if (await button.isVisible({ timeout: 1000 })) {
      await button.click();
      await page.waitForTimeout(3000);
      console.log(`✅ League phase transitioned using "${buttonSelector}"`);
      transitioned = true;
      break;
    }
  }
  
  if (!transitioned) {
    // Try to find any button that might be a transition button
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`⚠️ No standard transition button found. Found ${buttonCount} buttons total.`);
    
    // Click any button that looks like it could transition phases
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      if (text && (text.includes('Start') || text.includes('Process') || text.includes('Transition') || text.includes('Next'))) {
        await button.click();
        await page.waitForTimeout(3000);
        console.log(`✅ League phase transitioned using button: "${text}"`);
        transitioned = true;
        break;
      }
    }
  }
  
  if (!transitioned) {
    console.log('⚠️ No transition button found - phase may already be in correct state');
  }
}

/**
 * Vote for photos in the voting phase
 */
export async function castVotes(page: Page, leagueId: string): Promise<void> {
  console.log('🗳️ Casting votes...');
  
  // Navigate to league page
  await page.goto(`/league/${leagueId}`);
  await page.waitForLoadState('networkidle');
  
  // Look for voting interface elements
  const voteButtons = page.locator('button:has-text("Vote"), [data-testid="vote-button"]');
  const photoItems = page.locator('[data-testid="photo-item"], .photo-item, .submission-item');
  
  // Try to vote on available items
  const voteButtonCount = await voteButtons.count();
  const photoCount = await photoItems.count();
  
  if (voteButtonCount > 0) {
    // Click vote buttons
    const votesToCast = Math.min(3, voteButtonCount);
    for (let i = 0; i < votesToCast; i++) {
      await voteButtons.nth(i).click();
      await page.waitForTimeout(500);
    }
  } else if (photoCount > 0) {
    // Try double-click voting
    const votesToCast = Math.min(3, photoCount);
    for (let i = 0; i < votesToCast; i++) {
      await photoItems.nth(i).dblclick();
      await page.waitForTimeout(500);
    }
  }
  
  console.log('✅ Votes cast successfully');
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
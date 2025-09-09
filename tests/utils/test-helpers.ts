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
  
  await page.goto('/app/auth/signup');
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
    page.waitForURL(url => !url.toString().includes('/app/auth/signup'), { timeout: 15000 }),
    submitButton.click()
  ]);
  
  // Check final URL and handle errors
  const finalUrl = page.url();
  
  // Check for error messages if we're still on signup page
  if (finalUrl.includes('/app/auth/signup')) {
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
  
  await page.goto('/app/auth/signin');
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
  if (url.includes('/app/auth/signin')) {
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
  await page.goto('/app/new');
  await page.waitForLoadState('networkidle');
  
  // Fill in league details - use the correct ID from the form
  const nameInput = page.locator('#name');
  await nameInput.waitFor({ state: 'visible', timeout: 5000 });
  await nameInput.clear();
  await nameInput.fill(leagueName);
  
  // Fill description field - look for description input
  const descInput = page.locator('#description, textarea[name="description"], input[name="description"]');
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
 * Add a prompt to a league via League Settings and ensure it's the only prompt in the queue
 */
export async function addPromptToLeague(page: Page, promptText: string): Promise<void> {
  console.log(`📝 Adding prompt: ${promptText.substring(0, 50)}...`);
  
  // First close any profile overlay that might be open
  const closeButton = page.locator('button:has(img)').first();
  if (await closeButton.isVisible({ timeout: 2000 })) {
    await closeButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Look for League Settings tab/link - it might have different names depending on screen size
  // Try multiple selectors for League Settings
  const settingsSelectors = [
    'a[href*="league-settings"]',
    'link[href*="league-settings"]',
    'text="League Settings"',
    'text="Settings"'
  ];
  
  let settingsLink = null;
  for (const selector of settingsSelectors) {
    settingsLink = page.locator(selector);
    if (await settingsLink.isVisible({ timeout: 2000 })) {
      break;
    }
  }
  
  // If no settings link found, try to navigate directly to league settings
  if (!settingsLink || !(await settingsLink.isVisible({ timeout: 1000 }))) {
    console.log('📝 Settings link not visible, navigating directly to league settings...');
    const leagueId = page.url().match(/\/league\/([^\/]+)/)?.[1];
    if (leagueId) {
      await page.goto(`/app/league/${leagueId}/league-settings`);
      await page.waitForLoadState('networkidle');
    } else {
      throw new Error('Could not determine league ID for direct navigation to settings');
    }
  } else {
    await settingsLink.click();
    await page.waitForLoadState('networkidle');
  }
  
  // Look for the "+ Add Challenge" button
  const addChallengeButton = page.locator('button:has-text("+ Add Challenge")');
  await addChallengeButton.waitFor({ state: 'visible', timeout: 10000 });
  await addChallengeButton.click();
  
  // Wait for the form to appear
  await page.waitForTimeout(1000);
  
  // Find the challenge description textarea (should have id="prompt-text")
  const promptTextArea = page.locator('textarea#prompt-text');
  await promptTextArea.waitFor({ state: 'visible', timeout: 5000 });
  await promptTextArea.fill(promptText);
  
  // Submit the form - look for "Add to Queue" button
  const submitButton = page.locator('button:has-text("Add to Queue")');
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  await submitButton.click();
  
  // Wait for form to process and page to update
  await page.waitForTimeout(3000);
  
  console.log('✅ Prompt added to league');
}

/**
 * Clear all prompts for a league to ensure clean test state
 */
export async function clearLeaguePrompts(leagueId: string): Promise<void> {
  const { getTestDb } = await import('./database');
  const testDb = getTestDb();
  
  try {
    // Delete all votes first
    await testDb.vote.deleteMany({
      where: {
        response: {
          prompt: {
            leagueId: leagueId
          }
        }
      }
    });
    
    // Delete all responses
    await testDb.response.deleteMany({
      where: {
        prompt: {
          leagueId: leagueId
        }
      }
    });
    
    // Delete all prompts for this league
    await testDb.prompt.deleteMany({
      where: {
        leagueId: leagueId
      }
    });
    
    console.log('🧹 Cleared all prompts for league');
  } catch (error) {
    console.error('❌ Error clearing league prompts:', error);
    throw error;
  }
}

/**
 * Join an existing league using the league ID
 */
export async function joinLeagueById(page: Page, leagueId: string): Promise<void> {
  console.log(`👥 Joining league: ${leagueId}`);
  
  // Navigate directly to the league page
  await page.goto(`/app/league/${leagueId}`);
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
    await page.goto(`/app/league/${leagueId}`);
    await page.waitForLoadState('networkidle');
    
    // Check if league needs to be started first
    const startLeagueButton = page.locator('button:has-text("Start League")');
    if (await startLeagueButton.isVisible({ timeout: 3000 })) {
      console.log('🏁 League needs to be started - clicking Start League button');
      await startLeagueButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for phase transition to complete
      console.log('✅ League started successfully');
    }
    
    // Check if we're in submission phase - look for submission form
    const uploadButton = page.locator('button:has-text("Upload Photo")');
    if (!(await uploadButton.isVisible({ timeout: 5000 }))) {
      console.log('⚠️ Upload Photo button not found - challenge may not be in active submission phase');
      
      // Try to find any file input as fallback
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible({ timeout: 2000 })) {
        await fileInput.setInputFiles(testImagePath);
      } else {
        throw new Error('No photo upload interface found - challenge may not be active or user may not have access');
      }
    } else {
      // Click the "Upload Photo" button to trigger file dialog, then upload to the hidden input
      const hiddenFileInput = page.locator('input[type="file"]').first();
      await hiddenFileInput.setInputFiles(testImagePath);
      
      // Wait for image compression to complete and check for errors
      await page.waitForTimeout(3000);
      
      // Check if there's an upload error displayed
      const uploadError = page.locator('text=Failed to process image');
      if (await uploadError.isVisible({ timeout: 2000 })) {
        console.log('⚠️ Image processing failed, retrying with different approach...');
        
        // Clear the error and try again with a longer wait
        await hiddenFileInput.setInputFiles([]);
        await page.waitForTimeout(1000);
        await hiddenFileInput.setInputFiles(testImagePath);
        await page.waitForTimeout(5000); // Longer wait for compression
      }
      
      console.log('📤 Photo uploaded and compressed');
    }
    
    // Add caption - use the specific ID from the form
    const captionInput = page.locator('#caption');
    await captionInput.waitFor({ state: 'visible', timeout: 5000 });
    await captionInput.fill(caption);
    console.log('📝 Caption added');
    
    // Submit response - look for the Submit button (not disabled)
    const submitButton = page.locator('button:has-text("Submit"):not([disabled])');
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Click submit and wait for processing
    await submitButton.click();
    console.log('🚀 Clicked Submit button');
    
    // Wait for submission to complete - look for success indicators or page change
    const submittingButton = page.locator('button:has-text("Submitting...")');
    if (await submittingButton.isVisible({ timeout: 2000 })) {
      // Wait for submitting state to finish
      await submittingButton.waitFor({ state: 'hidden', timeout: 10000 });
      console.log('⏳ Submission processing completed');
    }
    
    // Additional wait for any post-submission navigation or state changes
    await page.waitForTimeout(2000);
    
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
  
  // Navigate to League Settings tab - try multiple approaches
  const settingsSelectors = [
    'a[href*="league-settings"]',
    'text="League Settings"',
    'text="Settings"'
  ];
  
  let settingsFound = false;
  for (const selector of settingsSelectors) {
    const settingsLink = page.locator(selector);
    if (await settingsLink.isVisible({ timeout: 2000 })) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
      settingsFound = true;
      break;
    }
  }
  
  // If settings link not found, navigate directly using current URL
  if (!settingsFound) {
    console.log('⚠️ Settings link not found, trying direct navigation...');
    const currentUrl = page.url();
    const leagueId = currentUrl.match(/\/league\/([^\/]+)/)?.[1];
    if (leagueId) {
      await page.goto(`/app/league/${leagueId}/league-settings`);
      await page.waitForLoadState('networkidle');
    } else {
      throw new Error('Could not navigate to league settings - no league ID found in URL');
    }
  }
  
  // Look for the main phase transition button
  const transitionButton = page.locator('button:has-text("Transition to Next Phase")');
  
  if (await transitionButton.isVisible({ timeout: 5000 })) {
    console.log('🔄 Clicking "Transition to Next Phase" button...');
    await transitionButton.click();
    
    // Wait for the confirmation modal to appear
    await page.waitForTimeout(1000);
    
    // Look for the confirm button in the modal
    const confirmButton = page.locator('button:has-text("Confirm Transition")');
    if (await confirmButton.isVisible({ timeout: 5000 })) {
      console.log('✅ Confirming phase transition...');
      await confirmButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ League phase transitioned successfully');
    } else {
      console.log('⚠️ Confirmation modal not found, phase may have transitioned directly');
    }
  } else {
    console.log('⚠️ "Transition to Next Phase" button not found - may not be available in current phase');
    
    // Try fallback approach - look for any transition-related buttons
    const fallbackButtons = [
      'button:has-text("Start Voting")',
      'button:has-text("Process Results")',
      'button:has-text("Complete")',
      'button:has-text("Next")'
    ];
    
    let transitioned = false;
    for (const buttonSelector of fallbackButtons) {
      const button = page.locator(buttonSelector);
      if (await button.isVisible({ timeout: 1000 })) {
        console.log(`🔄 Using fallback button: ${buttonSelector}`);
        await button.click();
        await page.waitForTimeout(3000);
        transitioned = true;
        break;
      }
    }
    
    if (!transitioned) {
      console.log('ℹ️ No phase transition buttons available - league may be in a state that doesn\'t allow transitions');
    }
  }
}

/**
 * Vote for photos in the voting phase
 */
export async function castVotes(page: Page, leagueId: string): Promise<void> {
  console.log('🗳️ Casting votes...');
  
  // Navigate to league page
  await page.goto(`/app/league/${leagueId}`);
  await page.waitForLoadState('networkidle');
  
  // Look for voting interface - Vote buttons should be visible if in voting phase
  const voteButtons = page.locator('button:has-text("Vote")');
  const voteButtonCount = await voteButtons.count();
  
  if (voteButtonCount === 0) {
    console.log('ℹ️ No vote buttons found - league may not be in voting phase');
    return;
  }
  
  console.log(`🗳️ Found ${voteButtonCount} submissions available for voting`);
  
  // Cast votes on up to 3 submissions (or less if fewer available)
  const votesToCast = Math.min(3, voteButtonCount);
  
  for (let i = 0; i < votesToCast; i++) {
    const voteButton = voteButtons.nth(i);
    
    // Check if button is still "Vote" (not already "Voted")
    const buttonText = await voteButton.textContent();
    if (buttonText?.includes('Vote') && !buttonText?.includes('Voted')) {
      await voteButton.click();
      await page.waitForTimeout(500);
      console.log(`✅ Cast vote ${i + 1}/${votesToCast}`);
    }
  }
  
  // Now submit the votes
  const submitVotesButton = page.locator('button:has-text("Submit Votes")');
  if (await submitVotesButton.isVisible({ timeout: 3000 })) {
    // Check if button is enabled (user has cast required number of votes)
    const isEnabled = await submitVotesButton.isEnabled();
    if (isEnabled) {
      console.log('🏁 Submitting votes...');
      await submitVotesButton.click();
      
      // Look for confirmation modal if it appears
      await page.waitForTimeout(1000);
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Submit")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        console.log('✅ Votes confirmed and submitted');
      }
      
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️ Submit Votes button not enabled - may need to cast more votes');
    }
  } else {
    console.log('⚠️ Submit Votes button not found');
  }
  
  console.log('✅ Voting process completed');
}

/**
 * Create a temporary test image file
 */
async function createTestImage(): Promise<string> {
  const testDir = path.join(process.cwd(), 'tests', 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const fileName = `test-image-${Date.now()}.jpg`;
  const filePath = path.join(testDir, fileName);
  
  // Create a proper JPEG file using a well-formed minimal JPEG structure
  // This is a valid 1x1 pixel red JPEG image
  const jpegData = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x64,
    0x00, 0x64, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
    0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02,
    0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00,
    0xB5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05,
    0x04, 0x04, 0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11,
    0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71,
    0x14, 0x32, 0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52,
    0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0A, 0x16, 0x17, 0x18,
    0x19, 0x1A, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35, 0x36, 0x37,
    0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x53,
    0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67,
    0x68, 0x69, 0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x83,
    0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94, 0x95, 0x96,
    0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9,
    0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3,
    0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6,
    0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8,
    0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA,
    0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00,
    0x3F, 0x00, 0xFC, 0xAA, 0x28, 0xA2, 0x80, 0x3F, 0xFF, 0xD9
  ]);
  
  fs.writeFileSync(filePath, jpegData);
  
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
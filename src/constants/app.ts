/**
 * Application-wide constants
 * 
 * This file contains all magic numbers and hardcoded values used throughout
 * the Challenge League application to ensure consistency and easy maintenance.
 */

// =============================================================================
// FILE SIZE LIMITS (in bytes)
// =============================================================================

export const FILE_LIMITS = {
  /** Maximum size for photo uploads in submissions (10MB) */
  PHOTO_MAX_SIZE: 10 * 1024 * 1024,
  /** Maximum size for profile photo uploads (5MB) */
  PROFILE_PHOTO_MAX_SIZE: 5 * 1024 * 1024,
} as const;

// =============================================================================
// TEXT LENGTH LIMITS
// =============================================================================

export const CONTENT_LIMITS = {
  /** Maximum length for photo captions */
  CAPTION_MAX_LENGTH: 500,
  /** Maximum length for league names */
  LEAGUE_NAME_MAX_LENGTH: 50,
  /** Maximum length for league descriptions */
  LEAGUE_DESCRIPTION_MAX_LENGTH: 500,
  /** Minimum username length */
  USERNAME_MIN_LENGTH: 3,
  /** Maximum username length */
  USERNAME_MAX_LENGTH: 30,
  /** Minimum password length */
  PASSWORD_MIN_LENGTH: 8,
  /** Required invite code length */
  INVITE_CODE_LENGTH: 6,
} as const;

// =============================================================================
// VOTING SYSTEM (Moved to phases.ts)
// =============================================================================

// NOTE: Voting configuration has been moved to @/constants/phases
// for better organization with other phase-related settings.

// =============================================================================
// UI TIMEOUTS (in milliseconds)
// =============================================================================

export const UI_TIMEOUTS = {
  /** Auto-clear time for success messages */
  MESSAGE_AUTO_CLEAR_MS: 5000,
  /** Delay before redirecting after successful actions */
  REDIRECT_DELAY_MS: 1500,
} as const;

// =============================================================================
// COMPETITION TIMING (Moved to phases.ts)
// =============================================================================

// NOTE: Competition timing configuration has been moved to @/constants/phases
// to consolidate all phase-related settings in one location. This includes
// cron execution timing, phase durations, and processing schedules.

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const API_CONFIG = {
  /** Default number of retries for failed API requests */
  DEFAULT_RETRIES: 2,
  /** Default delay between API retry attempts (in milliseconds) */
  DEFAULT_RETRY_DELAY_MS: 1000,
} as const;

// =============================================================================
// UI DIMENSIONS
// =============================================================================

export const UI_DIMENSIONS = {
  /** Minimum touch target size for mobile accessibility (44px) */
  MIN_TOUCH_TARGET: 44,
  /** Vote button size (maps to w-11 h-11 in Tailwind) */
  VOTE_BUTTON_SIZE: 44,
  /** Photo preview width in pixels */
  PHOTO_PREVIEW_WIDTH: 400,
  /** Photo preview height in pixels */
  PHOTO_PREVIEW_HEIGHT: 256,
} as const;

// =============================================================================
// GRID LAYOUT
// =============================================================================

export const GRID_LAYOUT = {
  /** Responsive grid columns for galleries */
  GALLERY_COLS: {
    SM: 1,
    MD: 2,
    LG: 3,
  },
} as const;

// =============================================================================
// AVATAR SIZES (maps to Tailwind CSS classes)
// =============================================================================

export const AVATAR_SIZES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10', 
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
} as const;

// =============================================================================
// TYPE EXPORTS (for better TypeScript support)
// =============================================================================

export type AvatarSize = keyof typeof AVATAR_SIZES;
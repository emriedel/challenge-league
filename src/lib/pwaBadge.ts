/**
 * Centralized PWA badge management utilities
 *
 * Badge logic: Count leagues where the user needs to take action (submit or vote)
 * and the league has been started. This matches the dropdown notification indicator.
 */

import type { League } from '@/types/league';

declare global {
  interface Navigator {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

// Check if PWA badge API is supported
export function isPWABadgeSupported(): boolean {
  return typeof navigator !== 'undefined' &&
         'setAppBadge' in navigator &&
         'clearAppBadge' in navigator;
}

/**
 * Calculate badge count from leagues data
 * Only count leagues where:
 * - needsAction is true (user needs to submit or vote)
 * - isStarted is true (league has been officially started)
 */
export function calculateBadgeCount(leagues: League[]): number {
  return leagues.filter(league => league.needsAction && league.isStarted).length;
}

/**
 * Set PWA badge with count
 * Automatically clears badge if count is 0
 */
export function setPWABadge(count: number): void {
  if (!isPWABadgeSupported()) return;

  try {
    if (count > 0) {
      navigator.setAppBadge?.(count);
    } else {
      navigator.clearAppBadge?.();
    }
  } catch (error) {
    console.warn('Failed to set PWA badge:', error);
  }
}

/**
 * Update PWA badge from leagues data
 * This is the primary function to use when you have league data
 */
export function updatePWABadgeFromLeagues(leagues: League[]): void {
  if (!isPWABadgeSupported()) return;

  const count = calculateBadgeCount(leagues);
  setPWABadge(count);
}

/**
 * Clear PWA badge
 */
export function clearPWABadge(): void {
  if (!isPWABadgeSupported()) return;

  try {
    navigator.clearAppBadge?.();
  } catch (error) {
    console.warn('Failed to clear PWA badge:', error);
  }
}

/**
 * Refresh PWA badge by fetching current action count from API
 * Use this when you don't have league data already loaded
 */
export async function refreshPWABadge(): Promise<void> {
  if (!isPWABadgeSupported()) return;

  try {
    const response = await fetch('/api/leagues/actions');
    const data = await response.json();

    if (response.ok && data.leagues) {
      updatePWABadgeFromLeagues(data.leagues);
    }
  } catch (error) {
    console.warn('Failed to refresh PWA badge:', error);
  }
}
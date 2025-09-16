/**
 * Utility functions for managing PWA badge notifications
 */

declare global {
  interface Navigator {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

// Check if PWA badge API is supported
export function isPWABadgeSupported(): boolean {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

// Set PWA badge with count
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

// Clear PWA badge
export function clearPWABadge(): void {
  if (!isPWABadgeSupported()) return;

  try {
    navigator.clearAppBadge?.();
  } catch (error) {
    console.warn('Failed to clear PWA badge:', error);
  }
}

// Refresh PWA badge by fetching current action count
export async function refreshPWABadge(): Promise<void> {
  if (!isPWABadgeSupported()) return;

  try {
    const response = await fetch('/api/leagues/actions');
    const data = await response.json();

    if (response.ok && data.leagues) {
      const actionCount = data.leagues.filter((league: any) => league.needsAction).length;
      setPWABadge(actionCount);
    }
  } catch (error) {
    console.warn('Failed to refresh PWA badge:', error);
  }
}
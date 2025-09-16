import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

declare global {
  interface Navigator {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

interface UsePWABadgeReturn {
  setBadge: (count: number) => void;
  clearBadge: () => void;
  updateBadgeFromActions: () => Promise<void>;
}

export function usePWABadge(): UsePWABadgeReturn {
  const { data: session, status } = useSession();

  // Check if PWA badge API is supported
  const isSupported = useCallback(() => {
    return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
  }, []);

  // Set badge with count
  const setBadge = useCallback((count: number) => {
    if (!isSupported()) return;

    try {
      if (count > 0) {
        navigator.setAppBadge?.(count);
      } else {
        navigator.clearAppBadge?.();
      }
    } catch (error) {
      console.warn('Failed to set PWA badge:', error);
    }
  }, [isSupported]);

  // Clear badge
  const clearBadge = useCallback(() => {
    if (!isSupported()) return;

    try {
      navigator.clearAppBadge?.();
    } catch (error) {
      console.warn('Failed to clear PWA badge:', error);
    }
  }, [isSupported]);

  // Fetch current action count and update badge
  const updateBadgeFromActions = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user || !isSupported()) {
      return;
    }

    try {
      const response = await fetch('/api/leagues/actions');
      const data = await response.json();

      if (response.ok && data.leagues) {
        const actionCount = data.leagues.filter((league: any) => league.needsAction).length;
        setBadge(actionCount);
      }
    } catch (error) {
      console.warn('Failed to update PWA badge from actions:', error);
    }
  }, [status, session, isSupported, setBadge]);

  // Initial badge update when user becomes authenticated
  useEffect(() => {
    updateBadgeFromActions();
  }, [updateBadgeFromActions]);

  // Clear badge when user signs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      clearBadge();
    }
  }, [status, clearBadge]);

  return {
    setBadge,
    clearBadge,
    updateBadgeFromActions
  };
}
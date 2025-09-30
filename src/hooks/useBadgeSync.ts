'use client';

import { useEffect } from 'react';
import { refreshPWABadge } from '@/lib/pwaBadge';

/**
 * Hook to sync PWA badge when app comes into focus
 * This helps recover from iOS PWA badge state issues where the badge
 * might get out of sync after the app is backgrounded or iOS does weird things
 */
export function useBadgeSync() {
  useEffect(() => {
    // Sync badge when window regains focus (app comes to foreground)
    const handleFocus = () => {
      refreshPWABadge();
    };

    // Sync badge when page becomes visible (handles iOS PWA resume)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshPWABadge();
      }
    };

    // Add event listeners
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial sync on mount
    refreshPWABadge();

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

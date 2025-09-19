/**
 * Global navigation refresh management
 * Handles communication between BottomNavigation and page-level pull-to-refresh
 */

type NavigationRefreshHandler = () => Promise<void> | void;

interface NavigationRefreshEvents {
  scrollToTop: (page: string) => void;
  refresh: (page: string) => void;
}

class NavigationRefreshManager {
  private scrollHandlers = new Map<string, () => void>();
  private refreshHandlers = new Map<string, NavigationRefreshHandler>();

  // Register handlers for a specific page
  registerPage(page: string, scrollToTop: () => void, refresh: NavigationRefreshHandler) {
    this.scrollHandlers.set(page, scrollToTop);
    this.refreshHandlers.set(page, refresh);
  }

  // Unregister handlers when page unmounts
  unregisterPage(page: string) {
    this.scrollHandlers.delete(page);
    this.refreshHandlers.delete(page);
  }

  // Handle navigation tap for a specific page
  async handleNavigationTap(page: string): Promise<'scrolled' | 'refreshed' | 'navigated'> {
    // Check if we're at the top by seeing if there's minimal scroll
    const isAtTop = window.pageYOffset <= 10;

    if (!isAtTop) {
      // First tap: scroll to top
      const scrollHandler = this.scrollHandlers.get(page);
      if (scrollHandler) {
        scrollHandler();
      } else {
        // Fallback to window scroll
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }

      // Trigger haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }

      return 'scrolled';
    } else {
      // Second tap: trigger refresh when already at top
      const refreshHandler = this.refreshHandlers.get(page);
      if (refreshHandler) {
        // Trigger haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        await refreshHandler();
        return 'refreshed';
      }
      return 'scrolled';
    }
  }
}

// Global instance
export const navigationRefreshManager = new NavigationRefreshManager();

/**
 * Hook for pages to register their scroll/refresh handlers
 */
import { useEffect } from 'react';

export function useNavigationRefreshHandlers(
  page: string,
  scrollToTop: () => void,
  refresh: () => Promise<void> | void
) {
  useEffect(() => {
    navigationRefreshManager.registerPage(page, scrollToTop, refresh);

    return () => {
      navigationRefreshManager.unregisterPage(page);
    };
  }, [page, scrollToTop, refresh]);
}
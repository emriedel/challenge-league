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
    // For pages with pull-to-refresh containers, we need to check their scroll position
    // Otherwise fall back to window scroll position
    let isAtTop = false;

    // Try to find a pull-to-refresh container on the page
    const pullToRefreshContainer = document.querySelector('[data-pull-to-refresh-container]') as HTMLElement;

    if (pullToRefreshContainer) {
      isAtTop = pullToRefreshContainer.scrollTop <= 10;
    } else {
      // Fallback to window scroll for pages without pull-to-refresh
      isAtTop = window.pageYOffset <= 10;
    }

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

      // Add a small delay to ensure scroll operation completes
      // before allowing new touch interactions
      setTimeout(() => {
        // Force a slight UI update to ensure touch handlers are properly reset
        document.body.style.touchAction = 'pan-y';
        requestAnimationFrame(() => {
          document.body.style.touchAction = '';
        });
      }, 100);

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
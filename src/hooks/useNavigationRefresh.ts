'use client';

import { useCallback, useEffect, useState } from 'react';

interface UseNavigationRefreshOptions {
  onRefresh?: () => Promise<void> | void;
}

/**
 * Hook for handling navigation tap behavior:
 * - First tap: scroll to top
 * - Second tap (when already at top): trigger refresh
 */
export function useNavigationRefresh({ onRefresh }: UseNavigationRefreshOptions = {}) {
  const [isAtTop, setIsAtTop] = useState(true);

  // Monitor scroll position to know if we're at the top
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Debounce scroll events for performance
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setIsAtTop(scrollTop <= 10); // Consider "at top" if within 10px
      }, 100);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle navigation tap with scroll-to-top and refresh logic
  const handleNavigationTap = useCallback(async (): Promise<'scrolled' | 'refreshed'> => {
    if (!isAtTop) {
      // First tap: scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }

      return 'scrolled';
    } else {
      // Second tap: trigger refresh when already at top
      if (onRefresh) {
        // Trigger haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        await onRefresh();
        return 'refreshed';
      }
      return 'scrolled';
    }
  }, [isAtTop, onRefresh]);

  return {
    isAtTop,
    handleNavigationTap
  };
}


'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDocumentPullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPullDistance?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  shouldShowSpinner: boolean;
  pullProgress: number; // 0-1 for animation
}

/**
 * Document-level pull-to-refresh that enhances natural scrolling
 * Works with window scroll position, doesn't interfere with scroll containers
 */
export function useDocumentPullToRefresh({
  onRefresh,
  threshold = 60,
  maxPullDistance = 100,
  disabled = false
}: UseDocumentPullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    shouldShowSpinner: false,
    pullProgress: 0
  });

  const touchStartY = useRef<number | null>(null);
  const scrollTopOnStart = useRef<number>(0);

  // Check if we're at the top of the document
  const isAtDocumentTop = useCallback(() => {
    return window.scrollY <= 5; // Small threshold for touch variations
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Don't start pull-to-refresh if modal is open or pinch-zoom is active
    if (disabled || !isAtDocumentTop() || document.body.hasAttribute('data-modal-open') || document.body.hasAttribute('data-pinch-zoom-active')) return;

    // Check if the touch target is part of any navigation
    const target = e.target as HTMLElement;
    const isBottomNavTouch = target.closest('nav') && target.closest('[class*="bottom"]');
    const isTopNavTouch = target.closest('header') || target.closest('.nav-fixed-mobile');

    // Don't track touches that start on navigation elements
    if (isBottomNavTouch || isTopNavTouch) return;

    touchStartY.current = e.touches[0].clientY;
    scrollTopOnStart.current = window.scrollY;
  }, [disabled, isAtDocumentTop]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Don't handle touch move if modal is open or pinch-zoom is active
    if (disabled || touchStartY.current === null || document.body.hasAttribute('data-modal-open') || document.body.hasAttribute('data-pinch-zoom-active')) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Only handle downward pulls when at the top
    if (deltaY <= 0 || scrollTopOnStart.current > 5) return;

    // Double-check we're still at the top before preventing default
    if (!isAtDocumentTop()) return;

    // Check if the touch target is part of any navigation
    const target = e.target as HTMLElement;
    const isBottomNavTouch = target.closest('nav') && target.closest('[class*="bottom"]');
    const isTopNavTouch = target.closest('header') || target.closest('.nav-fixed-mobile');

    // Don't interfere with navigation touches
    if (isBottomNavTouch || isTopNavTouch) return;

    // Only prevent default if we have a significant pull to avoid interfering with taps
    if (deltaY > 10) {
      e.preventDefault();
    }

    // Calculate pull distance with elastic resistance
    const elasticDeltaY = Math.min(
      deltaY * 0.5, // Add resistance
      maxPullDistance
    );

    const progress = Math.min(elasticDeltaY / threshold, 1);

    setState(prev => ({
      ...prev,
      isPulling: true,
      pullDistance: elasticDeltaY,
      pullProgress: progress,
      shouldShowSpinner: elasticDeltaY > 15 // Show spinner after small pull
    }));
  }, [disabled, threshold, maxPullDistance, isAtDocumentTop]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    // Always reset touchStartY to ensure clean state
    const wasActive = touchStartY.current !== null;
    touchStartY.current = null;

    if (!state.isPulling) return;

    const shouldTriggerRefresh = state.pullDistance >= threshold;

    if (shouldTriggerRefresh && !state.isRefreshing) {
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: 0
      }));

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          shouldShowSpinner: false,
          pullProgress: 0
        }));
      }
    } else {
      // Reset state if threshold not met
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        shouldShowSpinner: false,
        pullProgress: 0
      }));
    }
  }, [state.isPulling, state.pullDistance, state.isRefreshing, threshold, onRefresh]);

  // Trigger refresh programmatically (for double-tap nav)
  const triggerRefresh = useCallback(async () => {
    if (state.isRefreshing || disabled) return;

    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    setState(prev => ({
      ...prev,
      isRefreshing: true,
      shouldShowSpinner: true,
      isPulling: false,
      pullDistance: 0,
      pullProgress: 0
    }));

    try {
      await onRefresh();
    } catch (error) {
      console.error('Programmatic refresh error:', error);
    } finally {
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        shouldShowSpinner: false,
        pullProgress: 0
      }));
    }
  }, [state.isRefreshing, disabled, onRefresh]);

  // Set up document-level touch event listeners
  useEffect(() => {
    if (disabled) return;

    const options: AddEventListenerOptions = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);
    // Also listen for touchcancel to handle interrupted gestures
    document.addEventListener('touchcancel', handleTouchEnd, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return {
    // State for UI rendering
    isPulling: state.isPulling,
    isRefreshing: state.isRefreshing,
    pullDistance: state.pullDistance,
    shouldShowSpinner: state.shouldShowSpinner,
    pullProgress: state.pullProgress,

    // Programmatic trigger for double-tap nav
    triggerRefresh,

    // Transform style for page content during pull
    contentTransform: state.isPulling ? `translateY(${state.pullDistance}px)` : 'translateY(0)',

    // Opacity for spinner based on pull progress
    spinnerOpacity: Math.min(state.pullProgress, 1)
  };
}
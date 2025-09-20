'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
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
 * Hook for implementing pull-to-refresh functionality
 * Handles touch events and provides state for UI animations
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 60,
  maxPullDistance = 100,
  disabled = false
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    shouldShowSpinner: false,
    pullProgress: 0
  });

  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTopOnStart = useRef<number>(0);

  // Check if we should allow pull-to-refresh
  const canPull = useCallback(() => {
    if (disabled) return false;

    // Only allow pull if we're at the top of the scroll container
    const container = containerRef.current;
    if (!container) return false;

    return container.scrollTop === 0;
  }, [disabled]);

  // Handle touch start
  const handleTouchStart = useCallback((e: Event) => {
    const touchEvent = e as TouchEvent;
    if (!canPull()) return;

    touchStartY.current = touchEvent.touches[0].clientY;
    scrollTopOnStart.current = containerRef.current?.scrollTop || 0;
  }, [canPull]);

  // Handle touch move
  const handleTouchMove = useCallback((e: Event) => {
    const touchEvent = e as TouchEvent;
    if (touchStartY.current === null || !canPull()) return;

    const currentY = touchEvent.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Only handle downward pulls when at the top
    if (deltaY <= 0 || scrollTopOnStart.current > 0) return;

    // Prevent default scrolling when pulling
    e.preventDefault();

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
  }, [canPull, threshold, maxPullDistance]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
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

    touchStartY.current = null;
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

  // Set up touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options: AddEventListenerOptions = { passive: false };

    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart, options);
      container.removeEventListener('touchmove', handleTouchMove, options);
      container.removeEventListener('touchend', handleTouchEnd, options);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    // Ref to attach to the scrollable container
    containerRef,

    // State for UI rendering
    isPulling: state.isPulling,
    isRefreshing: state.isRefreshing,
    pullDistance: state.pullDistance,
    shouldShowSpinner: state.shouldShowSpinner,
    pullProgress: state.pullProgress,

    // Programmatic trigger for double-tap nav
    triggerRefresh,

    // Transform style for content during pull
    contentTransform: state.isPulling ? `translateY(${state.pullDistance}px)` : 'translateY(0)',

    // Opacity for spinner based on pull progress
    spinnerOpacity: Math.min(state.pullProgress, 1)
  };
}
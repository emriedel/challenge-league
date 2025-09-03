import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPullDistance?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  enabled = true
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false
  });
  
  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;
    
    const container = containerRef.current;
    if (!container) return;

    const isMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    };

    if (!isMobile()) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop > 0) return;
      
      startY.current = e.touches[0].clientY;
      isDragging.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (container.scrollTop > 0) return;
      if (state.isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;

      if (deltaY > 0 && container.scrollTop === 0) {
        isDragging.current = true;
        e.preventDefault();
        
        const pullDistance = Math.min(deltaY * 0.5, maxPullDistance);
        
        setState(prev => ({
          ...prev,
          isPulling: true,
          pullDistance
        }));
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging.current || state.isRefreshing) return;

      const shouldRefresh = state.pullDistance >= threshold;
      
      if (shouldRefresh) {
        setState(prev => ({
          ...prev,
          isRefreshing: true,
          pullDistance: threshold
        }));
        
        try {
          await onRefresh();
        } finally {
          setState(prev => ({
            ...prev,
            isPulling: false,
            pullDistance: 0,
            isRefreshing: false
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0
        }));
      }
      
      isDragging.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onRefresh, threshold, maxPullDistance, state.isRefreshing, state.pullDistance]);

  return {
    containerRef,
    ...state,
    threshold
  };
}
'use client';

import { ReactNode, forwardRef } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshSpinner from './PullToRefreshSpinner';

interface PullToRefreshContainerProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}

interface PullToRefreshHandle {
  triggerRefresh: () => Promise<void>;
  scrollToTop: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Container component that wraps page content with pull-to-refresh functionality
 * Provides smooth animations and Instagram-style loading feedback
 */
const PullToRefreshContainer = forwardRef<PullToRefreshHandle, PullToRefreshContainerProps>(
  ({ children, onRefresh, disabled = false, className = '' }, ref) => {
    const {
      containerRef,
      isPulling,
      isRefreshing,
      shouldShowSpinner,
      pullProgress,
      triggerRefresh,
      contentTransform,
      spinnerOpacity
    } = usePullToRefresh({
      onRefresh,
      disabled
    });

    // Expose methods to parent via ref
    if (ref && typeof ref === 'object') {
      ref.current = {
        triggerRefresh,
        scrollToTop: () => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }
        },
        containerRef
      };
    }

    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Pull-to-refresh spinner */}
        <div
          className="absolute top-0 left-0 right-0 z-10 bg-app-bg flex justify-center"
          style={{
            transform: isPulling ? `translateY(${Math.max(0, pullProgress * 40 - 40)}px)` : 'translateY(-40px)',
            transition: isPulling ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <PullToRefreshSpinner
            isVisible={shouldShowSpinner || isRefreshing}
            isSpinning={isRefreshing}
            opacity={isRefreshing ? 1 : spinnerOpacity}
          />
        </div>

        {/* Scrollable content container */}
        <div
          ref={containerRef}
          className="h-full overflow-y-auto overscroll-y-none"
          style={{
            transform: contentTransform,
            transition: isPulling ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

PullToRefreshContainer.displayName = 'PullToRefreshContainer';

export default PullToRefreshContainer;
export type { PullToRefreshHandle };
'use client';

import { ReactNode } from 'react';
import { useDocumentPullToRefresh } from '@/hooks/useDocumentPullToRefresh';
import PullToRefreshSpinner from './PullToRefreshSpinner';

interface DocumentPullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

/**
 * Document-level pull-to-refresh that enhances natural scrolling
 * Provides a fixed overlay spinner and transforms page content
 */
export default function DocumentPullToRefresh({
  children,
  onRefresh,
  disabled = false
}: DocumentPullToRefreshProps) {
  const {
    isPulling,
    isRefreshing,
    shouldShowSpinner,
    pullProgress,
    triggerRefresh,
    contentTransform,
    spinnerOpacity
  } = useDocumentPullToRefresh({
    onRefresh,
    disabled
  });

  return (
    <>
      {/* Fixed overlay spinner positioned below navigation */}
      <div
        className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none"
        style={{
          top: '65px', // Position below navigation bar
          transform: isPulling ? `translateY(${Math.max(0, pullProgress * 60 - 60)}px)` : isRefreshing ? 'translateY(0px)' : 'translateY(-60px)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <PullToRefreshSpinner
          isVisible={shouldShowSpinner || isRefreshing}
          isSpinning={isRefreshing}
          opacity={isRefreshing ? 1 : spinnerOpacity}
          pullProgress={pullProgress}
        />
      </div>

      {/* Page content with pull transform */}
      <div
        style={{
          transform: contentTransform,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </>
  );
}

// Export the trigger function for external use
export { useDocumentPullToRefresh };
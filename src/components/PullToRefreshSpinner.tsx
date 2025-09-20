'use client';

interface PullToRefreshSpinnerProps {
  isVisible: boolean;
  isSpinning: boolean;
  opacity?: number;
  pullProgress?: number; // 0-1 indicating pull progress
}

/**
 * Instagram-style loading spinner for pull-to-refresh
 * Shows a clean, rotating circle that appears during pull gesture
 * Provides visual feedback about pull threshold
 */
export default function PullToRefreshSpinner({
  isVisible,
  isSpinning,
  opacity = 1,
  pullProgress = 0
}: PullToRefreshSpinnerProps) {
  if (!isVisible) return null;

  // Determine if we've reached the threshold for refresh
  const hasReachedThreshold = pullProgress >= 1;

  return (
    <div
      className="flex justify-center items-center py-4 transition-opacity duration-200"
      style={{ opacity }}
    >
      <div className="relative">
        {/* Background circle */}
        <div className="w-8 h-8 border-2 border-app-border rounded-full"></div>

        {/* Progress circle - shows how close to threshold */}
        {!isSpinning && (
          <div
            className="absolute inset-0 w-8 h-8 border-2 border-transparent rounded-full transition-colors duration-150"
            style={{
              borderTopColor: hasReachedThreshold ? '#22c55e' : '#3a8e8c',
              transform: `rotate(${pullProgress * 360}deg)`,
              borderRightColor: pullProgress > 0.25 ? (hasReachedThreshold ? '#22c55e' : '#3a8e8c') : 'transparent',
              borderBottomColor: pullProgress > 0.5 ? (hasReachedThreshold ? '#22c55e' : '#3a8e8c') : 'transparent',
              borderLeftColor: pullProgress > 0.75 ? (hasReachedThreshold ? '#22c55e' : '#3a8e8c') : 'transparent'
            }}
          ></div>
        )}

        {/* Spinning circle when refreshing */}
        {isSpinning && (
          <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-app-text rounded-full animate-spin"></div>
        )}
      </div>
    </div>
  );
}
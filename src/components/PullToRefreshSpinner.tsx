'use client';

interface PullToRefreshSpinnerProps {
  isVisible: boolean;
  isSpinning: boolean;
  opacity?: number;
}

/**
 * Instagram-style loading spinner for pull-to-refresh
 * Shows a clean, rotating circle that appears during pull gesture
 */
export default function PullToRefreshSpinner({
  isVisible,
  isSpinning,
  opacity = 1
}: PullToRefreshSpinnerProps) {
  if (!isVisible) return null;

  return (
    <div
      className="flex justify-center items-center py-4 transition-opacity duration-200"
      style={{ opacity }}
    >
      <div className="relative">
        {/* Outer circle (static) */}
        <div className="w-6 h-6 border-2 border-app-border rounded-full"></div>

        {/* Inner spinning circle */}
        <div
          className={`absolute inset-0 w-6 h-6 border-2 border-transparent border-t-app-text rounded-full ${
            isSpinning ? 'animate-spin' : ''
          }`}
        ></div>
      </div>
    </div>
  );
}
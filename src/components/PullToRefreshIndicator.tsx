interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
  isPulling: boolean;
}

export default function PullToRefreshIndicator({
  pullDistance,
  threshold,
  isRefreshing,
  isPulling
}: PullToRefreshIndicatorProps) {
  if (!isPulling && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  
  return (
    <div 
      className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200 ease-out"
      style={{
        transform: `translate(-50%, ${Math.max(pullDistance - 40, 0)}px)`,
        opacity: isPulling || isRefreshing ? 1 : 0
      }}
    >
      <div className="bg-app-surface border border-app-border rounded-full p-3 shadow-lg">
        {isRefreshing ? (
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg 
            className="w-6 h-6 text-blue-600 transition-transform duration-100" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
      </div>
    </div>
  );
}
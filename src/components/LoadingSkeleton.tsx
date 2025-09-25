
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  const style = {
    ...(width && { width }),
    ...(height && { height }),
  };

  return (
    <div
      className={`animate-pulse bg-app-surface-light rounded ${className}`}
      style={style}
    />
  );
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          width={i === lines - 1 && lines > 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-app-surface border border-app-border rounded-lg p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <SkeletonAvatar />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-app-surface border border-app-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-app-surface-dark px-6 py-3 border-b border-app-border">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-app-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className="h-4" 
                  width={colIndex === 0 ? '60px' : colIndex === 1 ? '120px' : '80px'} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonLeaderboard() {
  return <SkeletonTable rows={6} columns={5} />;
}

export function SkeletonSubmissionGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonSubmissionFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-app-surface border border-app-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-3">
            <div className="flex items-center space-x-3">
              <SkeletonAvatar size="md" />
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
          
          {/* Image */}
          <Skeleton className="w-full h-96 aspect-square" />
          
          {/* Action buttons */}
          <div className="p-4 pb-2">
            <div className="flex space-x-4">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          </div>
          
          {/* Caption */}
          <div className="px-4 pb-4">
            <SkeletonText lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChallenge() {
  return (
    <div className="space-y-6">
      {/* Challenge Header */}
      <div className="text-center">
        {/* Challenge number badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-lg mb-6">
          <Skeleton className="h-6 w-6 mr-2" />
          <Skeleton className="h-6 w-24" />
        </div>

        {/* Main challenge text */}
        <div className="max-w-lg mx-auto">
          <SkeletonText lines={2} className="text-lg" />
        </div>
      </div>

      {/* Add Photo button */}
      <div className="flex justify-center">
        <Skeleton className="h-12 w-40 rounded-lg" />
      </div>

      {/* Submission deadline section */}
      <div className="bg-app-surface border border-app-border rounded-lg p-6">
        <div className="text-center space-y-4">
          {/* "SUBMISSION DEADLINE" label */}
          <Skeleton className="h-4 w-40 mx-auto" />

          {/* Countdown timer */}
          <div className="flex items-center justify-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>

          {/* Date */}
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonVotingCard() {
  return (
    <div className="bg-app-surface border border-app-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <SkeletonAvatar size="md" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      
      {/* Image */}
      <div className="relative">
        <Skeleton className="w-full h-96 aspect-square" />
        {/* Vote buttons overlay skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Caption */}
      <div className="p-4">
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

export function SkeletonUserSubmission() {
  return (
    <div className="bg-app-surface border border-app-border rounded-lg p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonAvatar size="md" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-16 rounded" />
        </div>
        
        {/* Image */}
        <Skeleton className="w-full h-64 rounded-lg" />
        
        {/* Caption */}
        <div className="space-y-2">
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonNavigation() {
  return (
    <div className="bg-app-bg border-b border-app-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo section */}
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-6 w-40 hidden sm:block" />
          </div>
          
          {/* Desktop Navigation - authenticated state */}
          <div className="hidden md:flex items-center space-x-8">
            {/* League selector */}
            <Skeleton className="h-6 w-32" />
            {/* Profile avatar */}
            <SkeletonAvatar size="sm" />
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-3">
            {/* League selector */}
            <Skeleton className="h-6 w-24" />
            {/* Profile avatar */}
            <SkeletonAvatar size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
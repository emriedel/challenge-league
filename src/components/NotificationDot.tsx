'use client';

import { memo } from 'react';

interface NotificationDotProps {
  show: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Small red notification dot for indicating pending actions or unread content
 * Positioned absolutely in top-right corner of parent element
 */
const NotificationDot = memo(function NotificationDot({ show, className = '', size = 'sm' }: NotificationDotProps) {
  if (!show) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-red-500 rounded-full absolute -top-1 -right-1 border-2 border-app-bg ${className}`}
      aria-hidden="true"
    />
  );
});

export default NotificationDot;
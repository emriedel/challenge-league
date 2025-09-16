interface NotificationDotProps {
  show: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function NotificationDot({ show, className = '', size = 'sm' }: NotificationDotProps) {
  if (!show) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-red-500 rounded-full absolute -top-1 -right-1 border border-app-bg ${className}`}
      aria-label="Action required"
    />
  );
}
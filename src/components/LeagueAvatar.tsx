'use client';

import { memo } from 'react';

interface LeagueAvatarProps {
  leagueName: string;
  leagueId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const LeagueAvatar = memo(function LeagueAvatar({
  leagueName,
  leagueId,
  size = 'md',
  className = ''
}: LeagueAvatarProps) {
  // Create a deterministic seed from the league ID (consistent across users and sessions)
  const seed = leagueId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-8 h-8', text: 'text-xs' },
    md: { container: 'w-12 h-12', text: 'text-sm' },
    lg: { container: 'w-16 h-16', text: 'text-lg' },
    xl: { container: 'w-24 h-24', text: 'text-xl' }
  };

  const config = sizeConfig[size];

  // Generate consistent colors based on seed
  const hue1 = (seed * 137.508) % 360; // Golden angle for good distribution
  const hue2 = (hue1 + 60) % 360; // Complementary color

  // Generate pattern elements using seed
  const pattern = seed % 4; // 4 different pattern types
  const rotation = (seed * 23) % 360; // Rotation angle

  // Get first letter from league name
  const initials = leagueName.charAt(0).toUpperCase();

  const renderPattern = () => {
    const baseProps = {
      className: "absolute inset-0",
      style: { transform: `rotate(${rotation}deg)` }
    };

    switch (pattern) {
      case 0: // Gradient circles
        return (
          <div {...baseProps}>
            <div
              className="absolute top-0 left-0 w-3/4 h-3/4 rounded-full opacity-60"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 60%))`
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full opacity-40"
              style={{
                background: `linear-gradient(45deg, hsl(${hue2}, 80%, 70%), hsl(${hue1}, 80%, 70%))`
              }}
            />
          </div>
        );

      case 1: // Diamond pattern
        return (
          <div {...baseProps}>
            <div
              className="absolute top-1/2 left-1/2 w-3/4 h-3/4 transform -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-60"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 60%))`
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 w-1/2 h-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-40"
              style={{
                background: `linear-gradient(45deg, hsl(${hue2}, 80%, 70%), hsl(${hue1}, 80%, 70%))`
              }}
            />
          </div>
        );

      case 2: // Triangular sections
        return (
          <div {...baseProps}>
            <div
              className="absolute top-0 left-0 w-full h-full opacity-60"
              style={{
                background: `conic-gradient(from ${rotation}deg, hsl(${hue1}, 70%, 60%) 0deg, hsl(${hue2}, 70%, 60%) 120deg, hsl(${hue1}, 60%, 50%) 240deg, hsl(${hue2}, 60%, 50%) 360deg)`
              }}
            />
          </div>
        );

      case 3: // Overlapping rectangles
        return (
          <div {...baseProps}>
            <div
              className="absolute top-1/4 left-1/4 w-3/4 h-1/2 opacity-60"
              style={{
                background: `linear-gradient(90deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 60%))`
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 w-1/2 h-3/4 transform -translate-x-1/2 -translate-y-1/2 opacity-40"
              style={{
                background: `linear-gradient(0deg, hsl(${hue2}, 80%, 70%), hsl(${hue1}, 80%, 70%))`
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`${config.container} rounded-lg overflow-hidden relative flex items-center justify-center ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue1}, 60%, 25%), hsl(${hue2}, 60%, 30%))`
      }}
    >
      {/* Background pattern */}
      {renderPattern()}

      {/* Initials overlay */}
      <div className={`relative z-10 font-bold text-white ${config.text} drop-shadow-sm`}>
        {initials}
      </div>
    </div>
  );
});

export default LeagueAvatar;
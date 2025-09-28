'use client';

import { useEffect, useState } from 'react';

export default function FixedChallengeBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide the background when scrolled down more than the banner height
  const isVisible = scrollY < 100;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-0 h-40 overflow-hidden pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        // Position below the navigation bar
        top: '65px',
        height: '160px'
      }}
    >
      {/* Background with gradient and subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-app-surface via-app-surface via-app-surface/60 via-app-surface/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3a8e8c]/5 to-transparent" />
      {/* Extended teal background that goes behind the content */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#3a8e8c]/3 via-[#3a8e8c]/2 via-[#3a8e8c]/1 to-transparent" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#3a8e8c]/3 rounded-full blur-3xl" />
      <div className="absolute top-0 right-1/3 w-24 h-24 bg-[#3a8e8c]/2 rounded-full blur-2xl" />
    </div>
  );
}
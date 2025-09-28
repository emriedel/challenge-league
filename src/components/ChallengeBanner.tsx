'use client';

import { ReactNode } from 'react';

interface ChallengeBannerProps {
  challengeNumber: number | string;
  challengeText: string;
  children?: ReactNode;
  className?: string;
}

export default function ChallengeBanner({ challengeNumber, challengeText, children, className = '' }: ChallengeBannerProps) {
  return (
    <div className={`relative -mx-4 ${className}`}>
      {/* Main banner container - backgrounds now handled by FixedChallengeBackground */}
      <div className="relative overflow-hidden">

        {/* Content container */}
        <div className="relative px-4 py-6 pb-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {/* Challenge number with enhanced styling */}
            <div className="bg-[#3a8e8c]/10 border border-[#3a8e8c]/20 rounded-full px-4 py-2 inline-flex items-center gap-2">
              {/* Camera icon */}
              <svg className="w-4 h-4 text-[#3a8e8c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>

              {/* Challenge text */}
              <div className="text-lg font-medium text-[#3a8e8c] tracking-wide">
                Challenge #{challengeNumber}
              </div>
            </div>

            {/* Challenge description text */}
            <div>
              <p className="text-[1.4rem] text-app-text font-medium">{challengeText}</p>
            </div>

            {/* Additional content slot */}
            {children}
          </div>
        </div>

        {/* Bottom fade to blend with content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-app-bg" />
      </div>
    </div>
  );
}
'use client';

import React from 'react';

interface FloatingVoteCounterProps {
  votesCount: number;
  maxVotes: number;
  isVisible: boolean;
  hasSubmittedVotes?: boolean;
}

export default function FloatingVoteCounter({
  votesCount,
  maxVotes,
  isVisible,
  hasSubmittedVotes = false
}: FloatingVoteCounterProps) {
  // Don't show if user has already submitted votes
  if (hasSubmittedVotes) {
    return null;
  }
  const hasMaxVotes = votesCount === maxVotes;

  return (
    <div className={`fixed bottom-4 right-4 mb-20 md:mb-0 z-40 transition-all duration-300 ease-in-out transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'
    }`}>
      <div className={`bg-app-surface/85 backdrop-blur-md border border-app-border/50 shadow-lg ${
        hasMaxVotes ? 'rounded-lg px-3 py-2' : 'rounded-full px-3 py-1.5'
      }`}>
        <div className="text-xs font-medium text-app-text whitespace-nowrap text-center">
          <div>
            {votesCount}/{maxVotes} votes cast
          </div>
          {hasMaxVotes && (
            <div className="text-yellow-400 mt-1 font-semibold">
              Ready to submit!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
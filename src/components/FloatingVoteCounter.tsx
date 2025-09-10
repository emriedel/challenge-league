'use client';

import React from 'react';

interface FloatingVoteCounterProps {
  votesCount: number;
  maxVotes: number;
  isVisible: boolean;
}

export default function FloatingVoteCounter({ 
  votesCount, 
  maxVotes, 
  isVisible 
}: FloatingVoteCounterProps) {
  return (
    <div className={`fixed bottom-4 right-4 mb-20 md:mb-0 z-40 transition-all duration-300 ease-in-out transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'
    }`}>
      <div className="bg-app-surface/85 backdrop-blur-md border border-app-border/50 rounded-full px-3 py-1.5 shadow-lg">
        <span className="text-xs font-medium text-app-text whitespace-nowrap">
          {votesCount}/{maxVotes} votes cast
        </span>
      </div>
    </div>
  );
}
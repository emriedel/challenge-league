'use client';

import { useState } from 'react';
import { NoChallengeEmptyState } from './EmptyState';
import type { CurrentChallengeProps } from '@/types/components';
import { getRealisticPhaseEndTime } from '@/lib/phaseCalculations';


export default function CurrentChallenge({ 
  votingData, 
  promptData, 
  showVoting, 
  showSubmission, 
  showSubmitted,
  leagueSettings 
}: CurrentChallengeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="">
      {showVoting ? (
        <>
          <div className="text-center space-y-4 mb-4">
            <div>
              <p className="text-2xl text-app-text font-bold mb-3">Challenge #{promptData?.prompt?.challengeNumber || ''}</p>
              <p className="text-xl text-app-text font-medium">{votingData?.prompt?.text}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  votingData && votingData.existingVotes && votingData.existingVotes.length > 0
                    ? 'bg-app-surface-light text-app-text border border-app-border-light'
                    : 'bg-app-surface border border-app-border text-app-text-secondary'
                }`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  Vote by
                </span>
                <p className="text-sm text-app-text-muted mb-1">
                  {votingData?.voteEnd ? new Date(votingData.voteEnd).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  }) : 'TBD'}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (showSubmission || showSubmitted) && promptData?.prompt ? (
        <>
          <div className="text-center space-y-4">
            <div>
              <p className="text-2xl text-app-text font-bold mb-3">Challenge #{promptData.prompt.challengeNumber}</p>
              <p className="text-xl text-app-text font-medium">{promptData.prompt.text}</p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-app-text-muted">
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                showSubmitted
                  ? 'bg-app-surface-light text-app-text border border-app-border-light'
                  : 'bg-app-surface border border-app-border text-app-text-secondary'
              }`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                Submit by
              </span>
              <span>
              {(() => {
                const endTime = getRealisticPhaseEndTime({
                  id: promptData.prompt.id,
                  status: promptData.prompt.status,
                  phaseStartedAt: promptData.prompt.phaseStartedAt ? new Date(promptData.prompt.phaseStartedAt) : null,
                }, leagueSettings);
                return endTime ? endTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
                }) : 'TBD';
              })()}
              </span>
            </div>
          </div>
        </>
      ) : (
        <NoChallengeEmptyState />
      )}
    </div>
  );
}
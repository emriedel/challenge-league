'use client';

import { useState } from 'react';
import { NoChallengeEmptyState } from './EmptyState';
import type { CurrentChallengeProps } from '@/types/components';
import { getRealisticPhaseEndTime } from '@/lib/phaseCalculations';
import { VOTING_CONFIG } from '@/constants/phases';


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
          <div className="text-center space-y-4 mb-6">
            <div>
              <p className="text-2xl text-app-text font-bold mb-3">Challenge #{promptData?.prompt?.queueOrder ? promptData.prompt.queueOrder + 1 : ''}</p>
              <p className="text-xl text-app-text leading-relaxed">{votingData?.prompt?.text}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            
            <div className="text-center">
              <p className="text-sm text-app-text-muted mb-1">Voting deadline:&nbsp;
                {votingData?.voteEnd ? new Date(votingData.voteEnd).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }) : 'TBD'}
              </p>
            </div>
          </div>
        </>
      ) : (showSubmission || showSubmitted) && promptData?.prompt ? (
        <>
          <div className="text-center space-y-4">
            <div>
              <p className="text-2xl text-app-text font-bold mb-3">Challenge #{promptData.prompt.queueOrder + 1}</p>
              <p className="text-xl text-app-text leading-relaxed">{promptData.prompt.text}</p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-app-text-muted">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
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
                }) + ' PT' : 'TBD';
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
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
          <div className="">
            <div className="flex items-start space-x-3 mb-4">
              <svg className="w-8 h-8 text-app-text mt-1 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="m2.75 9.25 1.5 2.5 2 1.5m-4.5 0 1 1m1.5-2.5-1.5 1.5m3-1 8.5-8.5v-2h-2l-8.5 8.5"/>
                <path d="m10.25 12.25-2.25-2.25m2-2 2.25 2.25m1-1-1.5 2.5-2 1.5m4.5 0-1 1m-1.5-2.5 1.5 1.5m-7.25-5.25-4.25-4.25v-2h2l4.25 4.25"/>
              </svg>
              <div className="flex-1">
                <p className="text-xl font-bold text-app-text leading-tight">{votingData?.prompt?.text}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <p className="text-app-text font-medium">Voting Phase Active</p>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="w-5 h-5 min-w-[20px] min-h-[20px] rounded-full bg-app-surface-light text-app-text-secondary hover:bg-app-surface-dark transition-colors flex items-center justify-center text-xs font-bold flex-shrink-0"
                    title="Voting instructions"
                  >
                    ?
                  </button>
                  {showTooltip && (
                    <>
                      {/* Mobile overlay backdrop */}
                      <div className="sm:hidden fixed inset-0 z-20" onClick={() => setShowTooltip(false)} />
                      {/* Tooltip */}
                      <div className="fixed sm:absolute top-20 sm:top-6 left-4 right-4 sm:left-0 sm:right-auto z-30 sm:w-80 bg-app-surface-dark border border-app-border-light rounded-lg shadow-lg p-4">
                        <div className="space-y-2 text-sm text-app-text-secondary">
                          <p>• You must vote for {leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER} submissions, not including your own</p>
                          <p>• <strong className="text-app-text">Double tap</strong> any photo to vote, or use the vote button</p>
                        </div>
                        {/* Arrow pointing up - hidden on mobile since we're using fixed positioning */}
                        <div className="hidden sm:block absolute -top-2 left-2 w-4 h-4 bg-app-surface-dark border-l border-t border-app-border-light transform rotate-45"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-app-text-secondary text-sm">Cast your votes for the best submissions</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-app-text-muted mb-1">Voting deadline:</p>
              <p className="text-lg font-semibold text-app-text">
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
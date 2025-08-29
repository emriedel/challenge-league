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
    <div className="pb-4">
      {showVoting ? (
        <>
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-10 h-10 text-app-text" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="m2.75 9.25 1.5 2.5 2 1.5m-4.5 0 1 1m1.5-2.5-1.5 1.5m3-1 8.5-8.5v-2h-2l-8.5 8.5"/>
                <path d="m10.25 12.25-2.25-2.25m2-2 2.25 2.25m1-1-1.5 2.5-2 1.5m4.5 0-1 1m-1.5-2.5 1.5 1.5m-7.25-5.25-4.25-4.25v-2h2l4.25 4.25"/>
              </svg>
              <p className="text-lg text-app-text font-bold">{votingData?.prompt?.text}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <p className="text-gray-700 font-medium">Voting Phase Active</p>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="w-5 h-5 min-w-[20px] min-h-[20px] rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center text-xs font-bold flex-shrink-0"
                    title="Voting instructions"
                  >
                    ?
                  </button>
                  {showTooltip && (
                    <>
                      {/* Mobile overlay backdrop */}
                      <div className="sm:hidden fixed inset-0 z-20" onClick={() => setShowTooltip(false)} />
                      {/* Tooltip */}
                      <div className="fixed sm:absolute top-20 sm:top-6 left-4 right-4 sm:left-0 sm:right-auto z-30 sm:w-80 bg-app-surface-dark border border-app-border-light rounded-lg shadow-lg p-3">
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>• You must vote for {leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER} submissions, not including your own</p>
                          <p>• <strong>Double tap</strong> any photo to vote, or use the vote button</p>
                        </div>
                        {/* Arrow pointing up - hidden on mobile since we're using fixed positioning */}
                        <div className="hidden sm:block absolute -top-2 left-2 w-4 h-4 bg-app-surface-dark border-l border-t border-app-border-light transform rotate-45"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-app-text-secondary">Cast your votes for the best submissions</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-app-text-muted">Voting deadline:</p>
              <p className="text-lg font-semibold">
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
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-14 h-14 text-app-text mr-2" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="m2.75 9.25 1.5 2.5 2 1.5m-4.5 0 1 1m1.5-2.5-1.5 1.5m3-1 8.5-8.5v-2h-2l-8.5 8.5"/>
                <path d="m10.25 12.25-2.25-2.25m2-2 2.25 2.25m1-1-1.5 2.5-2 1.5m4.5 0-1 1m-1.5-2.5 1.5 1.5m-7.25-5.25-4.25-4.25v-2h2l4.25 4.25"/>
              </svg>
              <p className="text-lg text-app-text font-bold">{promptData.prompt.text}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-right text-sm text-app-text-muted flex items-center justify-end space-x-1">
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
            </p>
          </div>
        </>
      ) : (
        <NoChallengeEmptyState />
      )}
    </div>
  );
}
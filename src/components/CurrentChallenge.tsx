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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 mx-2 sm:mx-0">
      {showVoting ? (
        <>
          <div className="mb-4">
            <p className="text-lg text-gray-800 font-bold">{votingData?.prompt?.text}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <p className="text-blue-700 font-medium">Voting Phase Active</p>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="w-5 h-5 min-w-[20px] min-h-[20px] rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex items-center justify-center text-xs font-bold flex-shrink-0"
                    title="Voting instructions"
                  >
                    ?
                  </button>
                  {showTooltip && (
                    <>
                      {/* Mobile overlay backdrop */}
                      <div className="sm:hidden fixed inset-0 z-20" onClick={() => setShowTooltip(false)} />
                      {/* Tooltip */}
                      <div className="fixed sm:absolute top-20 sm:top-6 left-4 right-4 sm:left-0 sm:right-auto z-30 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <div className="space-y-1 text-sm text-blue-600">
                          <p>• You must vote for {leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER} submissions, not including your own</p>
                          <p>• <strong>Double tap</strong> any photo to vote, or use the vote button</p>
                        </div>
                        {/* Arrow pointing up - hidden on mobile since we're using fixed positioning */}
                        <div className="hidden sm:block absolute -top-2 left-2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-gray-600">Cast your votes for the best submissions</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500">Voting deadline:</p>
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
            <p className="text-lg text-gray-800 font-bold">{promptData.prompt.text}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-500">Submissions close:&nbsp;
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
            </p>
          </div>
        </>
      ) : (
        <NoChallengeEmptyState />
      )}
    </div>
  );
}
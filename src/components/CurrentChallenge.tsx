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
  showSubmitted 
}: CurrentChallengeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 mx-2 sm:mx-0">
      {showVoting ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Current Challenge</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-lg text-gray-800 font-medium">{votingData?.prompt?.text}</p>
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
                    className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex items-center justify-center text-xs font-bold"
                    title="Voting instructions"
                  >
                    ?
                  </button>
                  {showTooltip && (
                    <div className="absolute top-6 left-0 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <div className="space-y-1 text-sm text-blue-600">
                        <p>• You must vote for {VOTING_CONFIG.VOTES_PER_PLAYER} submissions, not including your own</p>
                        <p>• <strong>Double tap</strong> any photo to vote, or use the vote button</p>
                      </div>
                      {/* Arrow pointing up */}
                      <div className="absolute -top-2 left-2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                    </div>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Current Challenge</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-lg text-gray-800 font-medium">{promptData.prompt.text}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-500">Submissions close:&nbsp;
              {(() => {
                const endTime = getRealisticPhaseEndTime({
                  id: promptData.prompt.id,
                  status: promptData.prompt.status,
                  phaseStartedAt: promptData.prompt.phaseStartedAt ? new Date(promptData.prompt.phaseStartedAt) : null,
                });
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
'use client';

import { useState } from 'react';
import { NoChallengeEmptyState } from './EmptyState';
import CountdownTimer from './CountdownTimer';
import type { CurrentChallengeProps } from '@/types/components';
import { getRealisticPhaseEndTime } from '@/lib/phaseCalculations';
import { VOTING_CONFIG } from '@/constants/phases';

// Extracted reusable components
const ChallengeBadge = ({ challengeNumber }: { challengeNumber: number | string }) => (
  <div className="flex justify-center mb-3">
    <span className="bg-[#3a8e8c]/20 text-[#3a8e8c] border border-[#3a8e8c]/30 px-5 py-2 rounded-md text-base font-medium flex items-center gap-2">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Challenge #{challengeNumber}
    </span>
  </div>
);

const ClockIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

const DeadlineInfo = ({
  label,
  date,
  isActive
}: {
  label: string;
  date: string | null;
  isActive: boolean;
}) => (
  <div className="flex items-center justify-center gap-2">
    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
      isActive
        ? 'bg-app-surface-light text-app-text border border-app-border-light'
        : 'bg-app-surface border border-app-border text-app-text-secondary'
    }`}>
      <ClockIcon />
      {label}
    </span>
    <p className="text-sm text-app-text-muted mb-1">
      {date || 'TBD'}
    </p>
  </div>
);

export default function CurrentChallenge({
  votingData,
  promptData,
  showVoting,
  showSubmission,
  showSubmitted,
  leagueSettings
}: CurrentChallengeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Extract challenge data
  const challengeNumber = promptData?.prompt?.challengeNumber || votingData?.prompt?.challengeNumber || '';
  const challengeText = promptData?.prompt?.text || votingData?.prompt?.text || '';

  if (showVoting) {
    const votingDeadline = votingData?.voteEnd ? formatDate(new Date(votingData.voteEnd)) : null;
    const hasVoted = Boolean(votingData && votingData.existingVotes && votingData.existingVotes.length > 0);
    const maxVotes = leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER;

    return (
      <div className="">
        <div className="text-center space-y-4 mb-4">
          <div>
            <ChallengeBadge challengeNumber={challengeNumber} />
            <p className="text-[1.4rem] text-app-text font-medium my-6">{challengeText}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="text-center">
            <p className="text-app-text-secondary text-sm mb-3">Vote for your {maxVotes} favorites now!</p>
            <DeadlineInfo
              label="Deadline"
              date={votingDeadline}
              isActive={hasVoted}
            />
          </div>
        </div>
      </div>
    );
  }

  if ((showSubmission || showSubmitted) && promptData?.prompt) {
    const promptForTimer = {
      id: promptData.prompt.id,
      status: promptData.prompt.status,
      phaseStartedAt: promptData.prompt.phaseStartedAt ? new Date(promptData.prompt.phaseStartedAt) : null,
    };

    return (
      <div className="">
        <div className="text-center space-y-6">
          <div>
            <ChallengeBadge challengeNumber={challengeNumber} />
            <p className="text-[1.4rem] text-app-text font-medium my-6">{challengeText}</p>
          </div>
          {showSubmission && (
            <CountdownTimer
              prompt={promptForTimer}
              leagueSettings={leagueSettings}
              showDeadlineDate={true}
            />
          )}
          {showSubmitted && (
            <div className="bg-app-surface border border-app-border rounded-lg p-6 text-center">
              <div className="text-app-text-secondary text-sm font-medium mb-2 tracking-wider uppercase">
                SUBMITTED
              </div>
              <div className="text-[#3a8e8c] text-2xl font-bold mb-2">
                ✓ Response submitted
              </div>
              <div className="text-app-text-secondary text-sm">
                {(() => {
                  const endTime = getRealisticPhaseEndTime(promptForTimer, leagueSettings);
                  return endTime ? endTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  }) : 'TBD';
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <NoChallengeEmptyState />
    </div>
  );
}
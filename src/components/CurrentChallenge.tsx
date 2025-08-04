'use client';

import { NoChallengeEmptyState } from './EmptyState';

interface Prompt {
  text: string;
  weekEnd: string;
}

interface VotingPrompt {
  text: string;
}

interface VotingData {
  prompt?: VotingPrompt | null;
  voteEnd?: string;
}

interface CurrentChallengeProps {
  votingData?: VotingData;
  promptData?: {
    prompt: Prompt;
  };
  showVoting: boolean;
  showSubmission: boolean;
  showSubmitted: boolean;
}

export default function CurrentChallenge({ 
  votingData, 
  promptData, 
  showVoting, 
  showSubmission, 
  showSubmitted 
}: CurrentChallengeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
      {showVoting ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Current Challenge</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-lg text-gray-800 font-medium">{votingData?.prompt?.text}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-blue-700 font-medium">Voting Phase Active</p>
              <p className="text-gray-600">Cast your votes for the best submissions</p>
            </div>
            <div className="text-right">
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
          <div className="text-right">
            <p className="text-sm text-gray-500">Submission deadline:&nbsp;
              {new Date(promptData.prompt.weekEnd).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        </>
      ) : (
        <NoChallengeEmptyState />
      )}
    </div>
  );
}
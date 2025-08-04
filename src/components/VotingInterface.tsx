'use client';

import { useState } from 'react';
import Image from 'next/image';
import ProfileAvatar from './ProfileAvatar';
import { NoSubmissionsEmptyState } from './EmptyState';
import { VOTING } from '@/constants/app';

interface VotingResponse {
  id: string;
  imageUrl: string;
  caption: string;
  user: {
    username: string;
    profilePhoto?: string | null;
  };
}

interface VotingData {
  canVote: boolean;
  responses: VotingResponse[];
  prompt?: {
    text: string;
  };
  voteEnd?: string;
}

interface VotingInterfaceProps {
  votingData: VotingData;
  onSubmitVotes: (votes: { [responseId: string]: number }) => Promise<void>;
  isSubmitting: boolean;
  message?: { type: 'success' | 'error'; text: string } | null;
}

export default function VotingInterface({ 
  votingData, 
  onSubmitVotes, 
  isSubmitting, 
  message 
}: VotingInterfaceProps) {
  const [selectedVotes, setSelectedVotes] = useState<{ [responseId: string]: number }>({});

  const handleVoteSelection = (responseId: string, increment: boolean) => {
    const newVotes = { ...selectedVotes };
    const currentVotes = newVotes[responseId] || 0;
    
    if (increment && getTotalVotes() < VOTING.TOTAL_VOTES_PER_USER) {
      newVotes[responseId] = currentVotes + 1;
    } else if (!increment && currentVotes > 0) {
      if (currentVotes === 1) {
        delete newVotes[responseId];
      } else {
        newVotes[responseId] = currentVotes - 1;
      }
    }
    
    setSelectedVotes(newVotes);
  };

  const getTotalVotes = () => {
    return Object.values(selectedVotes).reduce((sum, votes) => sum + votes, 0);
  };

  const handleSubmitVotes = async () => {
    const totalVotes = getTotalVotes();
    if (totalVotes !== VOTING.TOTAL_VOTES_PER_USER) {
      return;
    }

    await onSubmitVotes(selectedVotes);
    setSelectedVotes({});
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Voting Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Cast Your Votes</h2>
        <div className="space-y-2 text-blue-700">
          <p className="font-medium">Challenge: {votingData.prompt?.text}</p>
        </div>
        <div className="mt-4 space-y-1 text-sm text-blue-600">
          <p>• You have {VOTING.TOTAL_VOTES_PER_USER} votes to distribute among submissions (each vote = 1 point)</p>
          <p>• You can give multiple votes to the same submission</p>
          <p>• You cannot vote for your own submission</p>
          <p>• Voting ends: {votingData.voteEnd ? new Date(votingData.voteEnd).toLocaleString() : 'TBD'}</p>
        </div>
      </div>

      {/* Voting Grid */}
      {votingData.responses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {votingData.responses.map((response) => {
            const voteCount = selectedVotes[response.id] || 0;
            return (
              <div
                key={response.id}
                className={`border-2 rounded-lg overflow-hidden transition-all ${
                  voteCount > 0
                    ? 'border-blue-500 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={response.imageUrl}
                  alt={response.caption}
                  width={400}
                  height={192}
                  className="w-full h-48 object-contain bg-gray-50"
                />
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ProfileAvatar 
                      username={response.user.username}
                      profilePhoto={response.user.profilePhoto}
                      size="sm"
                    />
                    <p className="text-sm text-gray-600">@{response.user.username}</p>
                  </div>
                  <p className="text-gray-800 text-sm mb-4">{response.caption}</p>
                  
                  {/* Vote Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVoteSelection(response.id, false)}
                        disabled={voteCount === 0}
                        className="w-11 h-11 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
                      >
                        −
                      </button>
                      <span className="text-lg font-semibold w-8 text-center">{voteCount}</span>
                      <button
                        onClick={() => handleVoteSelection(response.id, true)}
                        disabled={getTotalVotes() >= VOTING.TOTAL_VOTES_PER_USER}
                        className="w-11 h-11 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {voteCount === 1 ? '1 vote' : `${voteCount} votes`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <NoSubmissionsEmptyState />
      )}

      {/* Submit Votes */}
      <div className="text-center">
        <div className="mb-4">
          <span className="text-lg font-medium">
            Votes used: {getTotalVotes()}/{VOTING.TOTAL_VOTES_PER_USER}
          </span>
        </div>
        <button
          onClick={handleSubmitVotes}
          disabled={getTotalVotes() !== VOTING.TOTAL_VOTES_PER_USER || isSubmitting}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Votes'}
        </button>
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
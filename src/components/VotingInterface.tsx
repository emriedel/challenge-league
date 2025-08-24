'use client';

import { useState } from 'react';
import Image from 'next/image';
import ProfileAvatar from './ProfileAvatar';
import { NoSubmissionsEmptyState } from './EmptyState';
import { VOTING_CONFIG } from '@/constants/phases';
import type { VotingInterfaceProps } from '@/types/components';
import type { VoteMap } from '@/types/vote';


export default function VotingInterface({ 
  votingData, 
  onSubmitVotes, 
  isSubmitting, 
  message 
}: VotingInterfaceProps) {
  const [selectedVotes, setSelectedVotes] = useState<VoteMap>({});

  const handleVoteToggle = (responseId: string) => {
    const newVotes = { ...selectedVotes };
    const hasVoted = newVotes[responseId] === 1;
    
    if (hasVoted) {
      // Remove vote
      delete newVotes[responseId];
    } else if (getTotalVotes() < VOTING_CONFIG.VOTES_PER_PLAYER) {
      // Add vote (only 1 vote per submission allowed)
      newVotes[responseId] = 1;
    }
    
    setSelectedVotes(newVotes);
  };

  const getTotalVotes = () => {
    return Object.values(selectedVotes).reduce((sum, votes) => sum + votes, 0);
  };

  const handleSubmitVotes = async () => {
    const totalVotes = getTotalVotes();
    if (totalVotes !== VOTING_CONFIG.VOTES_PER_PLAYER) {
      return;
    }

    await onSubmitVotes(selectedVotes);
    setSelectedVotes({});
  };

  return (
    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
      {/* Voting Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mx-2 sm:mx-0">
        <h2 className="text-xl font-semibold mb-2">Cast Your Votes</h2>
        <div className="space-y-2 text-blue-700">
          <p className="font-medium">Challenge: {votingData.prompt?.text}</p>
        </div>
        <div className="mt-4 space-y-1 text-sm text-blue-600">
          <p>• You have {VOTING_CONFIG.VOTES_PER_PLAYER} votes to cast among submissions (each vote = {VOTING_CONFIG.POINTS_PER_VOTE} point)</p>
          <p>• You can vote for up to {VOTING_CONFIG.VOTES_PER_PLAYER} different submissions (one vote per submission)</p>
          <p>• You cannot vote for your own submission</p>
          <p>• Voting ends: {votingData.voteEnd ? new Date(votingData.voteEnd).toLocaleString() : 'TBD'}</p>
        </div>
      </div>

      {/* Instagram-style Voting Feed */}
      {votingData.responses.length > 0 ? (
        <div className="space-y-6 px-2 sm:px-0">
          {votingData.responses.map((response) => {
            const hasVoted = selectedVotes[response.id] === 1;
            return (
              <div
                key={response.id}
                className={`bg-white border rounded-lg overflow-hidden transition-all ${
                  hasVoted
                    ? 'border-blue-500 shadow-lg' 
                    : 'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ProfileAvatar 
                        username={response.user.username}
                        profilePhoto={response.user.profilePhoto}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-gray-900">@{response.user.username}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(response.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVoteToggle(response.id)}
                      disabled={!hasVoted && getTotalVotes() >= VOTING_CONFIG.VOTES_PER_PLAYER}
                      className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                        hasVoted 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {hasVoted ? '❤️ Voted' : '🤍 Vote'}
                    </button>
                  </div>
                </div>

                {/* Image */}
                <div className="relative">
                  <Image
                    src={response.imageUrl}
                    alt={response.caption}
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain bg-gray-50 max-h-[600px]"
                  />
                </div>

                {/* Caption */}
                <div className="p-4">
                  <p className="text-gray-800">{response.caption}</p>
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
            Votes cast: {getTotalVotes()}/{VOTING_CONFIG.VOTES_PER_PLAYER}
          </span>
        </div>
        <button
          onClick={handleSubmitVotes}
          disabled={getTotalVotes() !== VOTING_CONFIG.VOTES_PER_PLAYER || isSubmitting}
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
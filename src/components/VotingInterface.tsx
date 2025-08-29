'use client';

import { useState } from 'react';
import PhotoFeedItem from './PhotoFeedItem';
import { NoSubmissionsEmptyState } from './EmptyState';
import { VOTING_CONFIG } from '@/constants/phases';
import type { VotingInterfaceProps } from '@/types/components';
import type { VoteMap } from '@/types/vote';


export default function VotingInterface({ 
  votingData, 
  onSubmitVotes, 
  isSubmitting, 
  message,
  leagueSettings 
}: VotingInterfaceProps) {
  const [selectedVotes, setSelectedVotes] = useState<VoteMap>({});
  const [lastTap, setLastTap] = useState<{ responseId: string; time: number } | null>(null);
  const [heartAnimation, setHeartAnimation] = useState<string | null>(null);

  const handleVoteToggle = (responseId: string) => {
    const newVotes = { ...selectedVotes };
    const hasVoted = newVotes[responseId] === 1;
    
    if (hasVoted) {
      // Remove vote
      delete newVotes[responseId];
    } else if (getTotalVotes() < (leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER)) {
      // Add vote (only 1 vote per submission allowed)
      newVotes[responseId] = 1;
    }
    
    setSelectedVotes(newVotes);
  };

  const handleImageTap = (responseId: string) => {
    const now = Date.now();
    const doubleTapThreshold = 300; // milliseconds
    
    if (lastTap && lastTap.responseId === responseId && now - lastTap.time < doubleTapThreshold) {
      // Double tap detected - toggle vote
      handleVoteToggle(responseId);
      
      // Show heart animation
      setHeartAnimation(responseId);
      setTimeout(() => setHeartAnimation(null), 1000);
      
      setLastTap(null); // Reset to prevent triple-tap issues
    } else {
      // Single tap - just record the tap
      setLastTap({ responseId, time: now });
    }
  };

  const getTotalVotes = () => {
    return Object.values(selectedVotes).reduce((sum, votes) => sum + votes, 0);
  };

  const handleSubmitVotes = async () => {
    const totalVotes = getTotalVotes();
    const requiredVotes = leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER;
    if (totalVotes !== requiredVotes) {
      return;
    }

    await onSubmitVotes(selectedVotes);
    setSelectedVotes({});
  };

  return (
    <div className="bg-app-bg">
      <style jsx>{`
        @keyframes heartBeat {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
      
      {/* Full-width Voting Feed */}
      {votingData.responses.length > 0 ? (
        <div className="space-y-0">
          {votingData.responses.map((response) => {
            const hasVoted = selectedVotes[response.id] === 1;
            return (
              <PhotoFeedItem
                key={response.id}
                user={{
                  username: response.user.username,
                  profilePhoto: response.user.profilePhoto
                }}
                imageUrl={response.imageUrl}
                caption={response.caption}
                submittedAt={response.submittedAt}
                onImageClick={() => handleImageTap(response.id)}
                headerActions={
                  <button
                    onClick={() => handleVoteToggle(response.id)}
                    disabled={!hasVoted && getTotalVotes() >= (leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER)}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                      hasVoted 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-app-surface-light text-app-text hover:bg-app-surface disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {hasVoted ? '❤️ Voted' : '🤍 Vote'}
                  </button>
                }
                imageOverlay={
                  heartAnimation === response.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div 
                        className="text-red-500 transform scale-0 animate-bounce"
                        style={{
                          animation: 'heartBeat 0.8s ease-out forwards',
                          fontSize: '4rem'
                        }}
                      >
                        ❤️
                      </div>
                    </div>
                  )
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-app-bg min-h-[50vh] flex items-center justify-center">
          <NoSubmissionsEmptyState />
        </div>
      )}

      {/* Submit Votes */}
      <div className="bg-app-bg border-t border-app-border py-6">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="mb-4">
            <span className="text-lg font-medium">
              Votes cast: {getTotalVotes()}/{leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER}
            </span>
          </div>
          <button
            onClick={handleSubmitVotes}
            disabled={getTotalVotes() !== (leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER) || isSubmitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-app-surface-light disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
}
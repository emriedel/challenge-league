'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import PhotoFeedItem from './PhotoFeedItem';
import CommentSection from './CommentSection';
import { NoSubmissionsEmptyState } from './EmptyState';
import { VOTING_CONFIG } from '@/constants/phases';
import { getVotingOrder } from '@/lib/ordering';
import type { VotingInterfaceProps } from '@/types/components';
import type { VoteMap } from '@/types/vote';


export default function VotingInterface({ 
  votingData, 
  onSubmitVotes, 
  isSubmitting, 
  message,
  leagueSettings 
}: VotingInterfaceProps) {
  const { data: session } = useSession();
  const [selectedVotes, setSelectedVotes] = useState<VoteMap>({});
  const [lastTap, setLastTap] = useState<{ responseId: string; time: number } | null>(null);
  const [heartAnimation, setHeartAnimation] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasSubmittedVotes, setHasSubmittedVotes] = useState(false);
  
  // Create deterministic user-specific ordering for voting
  const orderedResponses = useMemo(() => {
    if (!session?.user?.id || !votingData.prompt) {
      // Fallback to original order if no session or prompt
      return votingData.responses;
    }
    
    // Create a unique identifier for this voting context
    // We'll use a combination of the prompt text and league context to ensure different orderings per round
    const promptId = votingData.prompt.text || 'default-prompt';
    
    return getVotingOrder(votingData.responses, session.user.id, promptId);
  }, [votingData.responses, votingData.prompt, session?.user?.id]);
  
  // Initialize with existing votes and check if user has already submitted
  useEffect(() => {
    if (votingData.existingVotes && Object.keys(votingData.existingVotes).length > 0) {
      setSelectedVotes(votingData.existingVotes);
      setHasSubmittedVotes(true);
    } else {
      setHasSubmittedVotes(false);
    }
  }, [votingData.existingVotes]);
  
  // Calculate required votes as minimum of available submissions and max votes allowed
  const maxVotesAllowed = leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER;
  const requiredVotes = Math.min(orderedResponses.length, maxVotesAllowed);

  const handleVoteToggle = (responseId: string) => {
    // Prevent vote changes if user has already submitted
    if (hasSubmittedVotes) {
      return;
    }
    
    const newVotes = { ...selectedVotes };
    const hasVoted = newVotes[responseId] === 1;
    
    if (hasVoted) {
      // Remove vote
      delete newVotes[responseId];
    } else if (getTotalVotes() < requiredVotes) {
      // Add vote (only 1 vote per submission allowed)
      newVotes[responseId] = 1;
      
      // Show heart animation only when voting (not un-voting)
      setHeartAnimation(responseId);
      setTimeout(() => setHeartAnimation(null), 1000);
    }
    
    setSelectedVotes(newVotes);
  };

  const handleImageTap = (responseId: string) => {
    // Prevent double-tap voting if user has already submitted
    if (hasSubmittedVotes) {
      return;
    }
    
    const now = Date.now();
    const doubleTapThreshold = 300; // milliseconds
    
    if (lastTap && lastTap.responseId === responseId && now - lastTap.time < doubleTapThreshold) {
      // Double tap detected - toggle vote
      handleVoteToggle(responseId);
      
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
    if (totalVotes !== requiredVotes || hasSubmittedVotes) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };
  
  const confirmSubmitVotes = async () => {
    setShowConfirmation(false);
    await onSubmitVotes(selectedVotes);
    setHasSubmittedVotes(true);
  };
  
  const cancelSubmitVotes = () => {
    setShowConfirmation(false);
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
      {orderedResponses.length > 0 ? (
        <div className="space-y-0">
          {orderedResponses.map((response, index) => {
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
                priority={index === 0}
                headerActions={
                  <button
                    onClick={() => handleVoteToggle(response.id)}
                    disabled={hasSubmittedVotes || (!hasVoted && getTotalVotes() >= requiredVotes)}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                      hasVoted 
                        ? 'bg-gray-800 text-white hover:bg-gray-900' 
                        : hasSubmittedVotes
                        ? 'bg-app-surface-light text-app-text-muted cursor-not-allowed opacity-50'
                        : 'bg-app-surface-light text-app-text hover:bg-app-surface disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <svg 
                        className={`w-4 h-4 ${hasVoted ? 'text-red-500' : ''}`}
                        fill={hasVoted ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                        />
                      </svg>
                      <span>{hasVoted ? 'Voted' : 'Vote'}</span>
                    </div>
                  </button>
                }
                imageOverlay={
                  heartAnimation === response.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg 
                        className="w-16 h-16 text-red-500 transform scale-0"
                        style={{
                          animation: 'heartBeat 0.8s ease-out forwards'
                        }}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  )
                }
                footerContent={
                  <CommentSection
                    responseId={response.id}
                    showInput={true}
                  />
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
      <div className="bg-app-bg border-t border-app-border py-6 pb-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="mb-4">
            <span className="text-lg font-medium text-app-text">
              Votes cast: {getTotalVotes()}/{requiredVotes}
            </span>
          </div>
          {!hasSubmittedVotes ? (
            <button
              onClick={handleSubmitVotes}
              disabled={getTotalVotes() !== requiredVotes || isSubmitting}
              className="bg-gray-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-900 disabled:bg-app-surface-light disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Votes'}
            </button>
          ) : (
            <div className="text-center">
              <div className="bg-green-900/20 border border-green-500/30 text-green-400 px-6 py-3 rounded-lg font-medium mb-2">
                ✓ Votes Submitted
              </div>
              <p className="text-app-text-muted text-sm">You can still view all submissions but cannot change your votes.</p>
            </div>
          )}
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
      
      {/* Vote Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-app-surface border border-app-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-app-text mb-3">Confirm Your Votes</h3>
            <p className="text-app-text-secondary mb-4">
              Are you sure you want to submit your votes? You won&apos;t be able to change them once submitted.
            </p>
            <div className="mb-4">
              <p className="text-sm text-app-text-muted mb-2">You have voted for {getTotalVotes()} submission{getTotalVotes() !== 1 ? 's' : ''}:</p>
              {Object.keys(selectedVotes).map(responseId => {
                const response = orderedResponses.find(r => r.id === responseId);
                return response ? (
                  <div key={responseId} className="flex items-center space-x-2 text-sm text-app-text-secondary">
                    <span>•</span>
                    <span>@{response.user.username}&apos;s submission</span>
                  </div>
                ) : null;
              })}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={confirmSubmitVotes}
                disabled={isSubmitting}
                className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Votes'}
              </button>
              <button
                onClick={cancelSubmitVotes}
                disabled={isSubmitting}
                className="flex-1 bg-app-surface-light text-app-text px-4 py-2 rounded-lg font-medium hover:bg-app-surface disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
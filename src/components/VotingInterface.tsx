'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import PhotoFeedItem from './PhotoFeedItem';
import CommentSection from './CommentSection';
import FloatingVoteCounter from './FloatingVoteCounter';
import { NoSubmissionsEmptyState } from './EmptyState';
import { VOTING_CONFIG } from '@/constants/phases';
import { getUniversalVotingOrder } from '@/lib/ordering';
import type { VotingInterfaceProps } from '@/types/components';
import type { VoteMap } from '@/types/vote';


export default function VotingInterface({
  votingData,
  onSubmitVotes,
  isSubmitting,
  message,
  leagueSettings,
  onVoteCountChange,
  onVisibilityChange
}: VotingInterfaceProps) {
  const { data: session } = useSession();
  const [selectedVotes, setSelectedVotes] = useState<VoteMap>({});
  const [lastTap, setLastTap] = useState<{ responseId: string; time: number } | null>(null);
  const [heartAnimation, setHeartAnimation] = useState<string | null>(null);
  const [hasSubmittedVotes, setHasSubmittedVotes] = useState(false);
  const [showFloatingCounter, setShowFloatingCounter] = useState(false);
  const bottomSectionRef = useRef<HTMLDivElement>(null);
  
  // Create deterministic ordering for voting (same for all users)
  const orderedResponses = useMemo(() => {
    if (!votingData.prompt) {
      // Fallback to original order if no prompt
      return votingData.responses;
    }

    // Use only the prompt ID to ensure ALL users see the same order
    const promptId = votingData.prompt.id || votingData.prompt.text || 'default-prompt';

    return getUniversalVotingOrder(votingData.responses, promptId);
  }, [votingData.responses, votingData.prompt]);
  
  // Initialize with existing votes and check if user has already submitted
  useEffect(() => {
    if (votingData.existingVotes && Object.keys(votingData.existingVotes).length > 0) {
      setSelectedVotes(votingData.existingVotes);
      setHasSubmittedVotes(true);
    } else {
      setHasSubmittedVotes(false);
    }
  }, [votingData.existingVotes]);
  
  // Intersection Observer to detect when bottom section is visible
  useEffect(() => {
    const currentBottomSection = bottomSectionRef.current;
    if (!currentBottomSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show floating counter when bottom section is NOT fully visible
        setShowFloatingCounter(!entry.isIntersecting);
        // Notify parent of visibility changes
        if (onVisibilityChange) {
          onVisibilityChange(entry.isIntersecting);
        }
      },
      {
        threshold: 0.2, // Trigger when 20% of bottom section is visible (disappears later)
        rootMargin: '0px 0px 0px 0px' // No margin
      }
    );

    observer.observe(currentBottomSection);

    return () => {
      if (currentBottomSection) {
        observer.unobserve(currentBottomSection);
      }
    };
  }, []);
  
  // Calculate required votes based on votable responses (excluding user's own)
  const maxVotesAllowed = leagueSettings?.votesPerPlayer ?? VOTING_CONFIG.VOTES_PER_PLAYER;
  const votableResponses = orderedResponses.filter(response =>
    votingData.votableResponseIds?.includes(response.id) ?? true
  );
  const requiredVotes = Math.min(votableResponses.length, maxVotesAllowed);


  const handleVoteToggle = (responseId: string) => {
    // Prevent vote changes if user has already submitted
    if (hasSubmittedVotes) {
      return;
    }

    // Check if this response is votable (not user's own submission)
    const response = orderedResponses.find(r => r.id === responseId);
    const isOwnSubmission = response?.userId === votingData.currentUserId;
    if (isOwnSubmission) {
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

    // Check if this response is votable (not user's own submission)
    const response = orderedResponses.find(r => r.id === responseId);
    const isOwnSubmission = response?.userId === votingData.currentUserId;
    if (isOwnSubmission) {
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

  // Notify parent component of vote count changes
  useEffect(() => {
    if (onVoteCountChange) {
      onVoteCountChange(getTotalVotes());
    }
  }, [selectedVotes, onVoteCountChange]);

  const handleSubmitVotes = async () => {
    const totalVotes = getTotalVotes();
    if (totalVotes !== requiredVotes || hasSubmittedVotes) {
      return;
    }

    // Submit votes directly
    await onSubmitVotes(selectedVotes);
    setHasSubmittedVotes(true);
  };

  return (
    <>
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
        <div className="space-y-4">
          {orderedResponses.map((response, index) => {
            const hasVoted = selectedVotes[response.id] === 1;
            // Check if this is the user's own submission
            const isOwnSubmission = response.userId === votingData.currentUserId;

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
                  // Show vote button for other users' submissions, badge for own submission
                  !isOwnSubmission ? (
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
                        <span>
                          {hasVoted ? 'Voted' : 'Vote'}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="px-4 py-2 rounded-full font-medium text-sm bg-app-surface-dark text-app-text-muted border border-app-border-dark">
                      <div className="flex items-center space-x-1">
                        <svg
                          className="w-4 h-4 text-app-text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>You</span>
                      </div>
                    </div>
                  )
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
      <div ref={bottomSectionRef} className="bg-app-bg border-t border-app-border py-6 pb-8 mt-4">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="mb-4">
            <span className="text-lg font-medium text-app-text">
              Votes cast: {getTotalVotes()}/{requiredVotes}
            </span>
          </div>
          {!hasSubmittedVotes ? (
            <div className="space-y-3">
              <button
                onClick={handleSubmitVotes}
                disabled={getTotalVotes() !== requiredVotes || isSubmitting}
                className={`${getTotalVotes() === requiredVotes ? 'bg-[#3a8e8c] hover:bg-[#2d6b6a]' : 'bg-gray-800 hover:bg-gray-900'} text-white px-8 py-3 rounded-lg font-medium disabled:bg-app-surface-light disabled:cursor-not-allowed transition-colors`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Votes'}
              </button>
              <p className="text-app-text-muted text-xs text-center">
                You won&apos;t be able to change your votes after submitting
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-[#3a8e8c]/20 border border-[#3a8e8c]/30 text-[#3a8e8c] px-6 py-3 rounded-lg font-medium mb-2">
                ✓ Votes Submitted
              </div>
            </div>
          )}
          {message && message.type === 'error' && (
            <div className="mt-4 p-3 rounded-lg text-sm bg-app-error-bg border border-app-error text-app-error">
              {message.text}
            </div>
          )}
        </div>
      </div>
      
      </div>

    </>
  );
}
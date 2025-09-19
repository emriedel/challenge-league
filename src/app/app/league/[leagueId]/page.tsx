'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import {
  useLeagueQuery,
  useVotingQuery,
  useLeaguePromptQuery,
  useSubmitVotesMutation
} from '@/hooks/queries';
import { useSubmissionManagement } from '@/hooks/useSubmissionManagement';
import { useVotingManagement } from '@/hooks/useVotingManagement';
import { useMessages } from '@/hooks/useMessages';
import { useContextualNotifications } from '@/hooks/useContextualNotifications';
import { useCacheInvalidator } from '@/lib/cacheInvalidation';
import { useChallengeCacheListener } from '@/hooks/useCacheEventListener';
import { useNavigationRefreshHandlers } from '@/lib/navigationRefresh';
import PullToRefreshContainer, { PullToRefreshHandle } from '@/components/PullToRefreshContainer';
import LeagueNavigation from '@/components/LeagueNavigation';
import CurrentChallenge from '@/components/CurrentChallenge';
import VotingInterface from '@/components/VotingInterface';
import SubmissionForm from '@/components/SubmissionForm';
import UserSubmissionDisplay from '@/components/UserSubmissionDisplay';
import WaitingToStartState from '@/components/WaitingToStartState';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorFallback from '@/components/PageErrorFallback';
import { SkeletonChallenge, SkeletonSubmissionGrid, SkeletonSubmissionFeed } from '@/components/LoadingSkeleton';


interface LeagueHomePageProps {
  params: { leagueId: string };
}

export default function LeagueHomePage({ params }: LeagueHomePageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useLeagueQuery(params.leagueId);
  const { data: votingData, isLoading: votingLoading, error: votingError } = useVotingQuery(params.leagueId);
  const { data: promptData, isLoading: promptLoading, error: promptError, refetch: refetchPrompt } = useLeaguePromptQuery(params.leagueId);
  const cacheInvalidator = useCacheInvalidator();
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);

  // Listen for cache events to keep challenge page synchronized
  useChallengeCacheListener(params.leagueId);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await cacheInvalidator.refreshLeague(params.leagueId);
  }, [cacheInvalidator, params.leagueId]);

  // Handle scroll-to-top from navigation
  const handleScrollToTop = useCallback(() => {
    if (pullToRefreshRef.current?.scrollToTop) {
      pullToRefreshRef.current.scrollToTop();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Handle navigation refresh trigger
  const handleNavigationRefresh = useCallback(async () => {
    if (pullToRefreshRef.current?.triggerRefresh) {
      await pullToRefreshRef.current.triggerRefresh();
    } else {
      await handleRefresh();
    }
  }, [handleRefresh]);

  // Register this page with the navigation refresh manager
  useNavigationRefreshHandlers('challenge', handleScrollToTop, handleNavigationRefresh);

  // Check if user just joined this league
  const justJoined = searchParams.get('joined') === 'true';

  // Show contextual notification prompt when user just joined
  useContextualNotifications({
    leagueName: leagueData?.league?.name,
    trigger: justJoined ? 'league-join' : null
  });
  
  // Mutations for user actions
  const submitVotesMutation = useSubmitVotesMutation(params.leagueId);
  
  // Custom hooks for managing complex state
  const { submissionMessage, votingMessage, setSubmissionMessage, setVotingMessage } = useMessages();
  const { submitResponse, updateResponse, isSubmitting: isSubmittingResponse } = useSubmissionManagement({
    promptId: promptData?.prompt?.id,
    leagueId: params.leagueId,
    onSuccess: setSubmissionMessage,
    onError: (message) => setSubmissionMessage({ type: 'error', text: message }),
    onRefetch: refetchPrompt,
  });
  const votingManagement = useVotingManagement({
    onSuccess: (message) => setVotingMessage({ type: 'success', text: message }),
    onError: (message) => setVotingMessage({ type: 'error', text: message }),
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/app/auth/signin');
    }
  }, [session, status, router]);

  const handleSubmitVotes = async (votes: { [responseId: string]: number }) => {
    try {
      await submitVotesMutation.mutateAsync(votes);
      setVotingMessage({ type: 'success', text: 'Votes submitted successfully!' });
      await cacheInvalidator.handleVoting('submit', params.leagueId);
    } catch (error) {
      setVotingMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit votes'
      });
    }
  };

  const handleSubmitResponse = async (data: { photo: File; caption: string }) => {
    await submitResponse(data);
  };

  const handleUpdateResponse = async (data: { photo?: File; caption: string }) => {
    if (!promptData?.userResponse) return;
    await updateResponse(data, promptData.userResponse.imageUrl);
  };

  if (status === 'loading' || leagueLoading || promptLoading) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Loading..." />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="space-y-8">
            <SkeletonChallenge />
            {votingLoading ? (
              <SkeletonSubmissionGrid count={3} />
            ) : (
              <SkeletonSubmissionFeed count={1} />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (leagueError) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Error" />
        <PageErrorFallback 
          title="League Error"
          description={leagueError instanceof Error ? leagueError.message : leagueError || 'An error occurred'}
          resetError={() => window.location.reload()}
        />
      </div>
    );
  }

  const league = leagueData?.league;
  const leaderboard = leagueData?.leaderboard || [];

  // Check if league hasn't started yet
  if (league && league.isStarted === false) {
    return (
      <WaitingToStartState
        league={{
          id: league.id,
          name: league.name,
          description: league.description || '',
          owner: league.owner
        }}
        isOwner={league.isOwner}
      />
    );
  }

  // Base UI state directly on prompt status from database
  const promptStatus = promptData?.prompt?.status;
  const showVoting = promptStatus === 'VOTING' && (votingData?.responses?.length ?? 0) > 0;
  const showSubmission = promptStatus === 'ACTIVE' && !promptData?.userResponse;
  const showSubmitted = promptStatus === 'ACTIVE' && !!promptData?.userResponse;
  const showNoChallenge = !promptStatus || promptStatus === 'SCHEDULED' || promptStatus === 'COMPLETED';

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex flex-col h-screen">
          <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
          <div className="flex-1 flex items-center justify-center">
            <PageErrorFallback
              error={error}
              resetError={resetError}
              title="League Page Error"
              description="This league page encountered an error. Please try again."
            />
          </div>
        </div>
      )}
    >
      <div className="flex flex-col h-screen">
        <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />

        {/* Pull-to-refresh container for page content */}
        <PullToRefreshContainer
          ref={pullToRefreshRef}
          onRefresh={handleRefresh}
          className="flex-1"
        >
          {/* Container for challenge content */}
          <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Current Challenge - only show when there's an active challenge */}
          {!showNoChallenge && (
            <div className="mb-2">
              <CurrentChallenge
                votingData={votingData || undefined}
                promptData={promptData && promptData.prompt ? {
                  prompt: {
                    id: promptData.prompt.id,
                    text: promptData.prompt.text,
                    phaseStartedAt: promptData.prompt.phaseStartedAt,
                    status: promptData.prompt.status,
                    challengeNumber: promptData.prompt.challengeNumber,
                    createdAt: new Date().toISOString(),
                    leagueId: params.leagueId
                  }
                } : undefined}
                showVoting={!!showVoting}
                showSubmission={!!showSubmission}
                showSubmitted={!!showSubmitted}
                leagueSettings={league ? {
                  submissionDays: league.submissionDays,
                  votingDays: league.votingDays,
                  votesPerPlayer: league.votesPerPlayer
                } : undefined}
              />
            </div>
          )}

          {/* No Active Challenge State */}
          {showNoChallenge && (
            <div className="mb-8">
              <div className="bg-app-surface border border-app-border rounded-lg p-8 text-center">
                <div className="text-app-text-muted mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-app-text mb-2">No Active Challenge</h3>
                <p className="text-app-text-secondary">
                  There&apos;s no challenge running right now. Check back soon for the next creative prompt!
                </p>
              </div>
            </div>
          )}

          {/* Submission Form */}
          {showSubmission && promptData?.prompt && (
            <div className="max-w-2xl mx-auto px-4 mb-8">
              <div className="bg-app-surface border border-app-border rounded-md p-4">

                {submissionMessage && (
                  <div className={`mb-4 p-3 rounded-md text-sm ${
                    submissionMessage.type === 'success'
                      ? 'bg-app-success-bg border border-app-success text-app-success'
                      : 'bg-app-error-bg border border-app-error text-app-error'
                  }`}>
                    {submissionMessage.text}
                  </div>
                )}

                <SubmissionForm
                  prompt={{
                    id: promptData.prompt.id,
                    text: promptData.prompt.text,
                    phaseStartedAt: promptData.prompt.phaseStartedAt,
                    status: promptData.prompt.status
                  }}
                  onSubmit={handleSubmitResponse}
                  isSubmitting={isSubmittingResponse}
                />
              </div>
            </div>
          )}

          {/* Voting Interface */}
          {showVoting && votingData && (
            <VotingInterface
              votingData={{
                canVote: true, // Always allow voting when prompt status is VOTING
                responses: votingData.responses.map(response => ({
                  ...response,
                  user: {
                    id: (response.user as any).id || `user-${response.user.username}`,
                    username: response.user.username,
                    profilePhoto: response.user.profilePhoto
                  }
                })),
                prompt: votingData.prompt ? { text: votingData.prompt.text } : undefined,
                voteEnd: votingData.voteEnd,
                userHasVoted: votingData.existingVotes && votingData.existingVotes.length > 0,
                existingVotes: votingData.existingVotes ? votingData.existingVotes.reduce((acc: { [responseId: string]: number }, vote: any) => {
                  acc[vote.response.id] = 1; // Each response can receive 1 vote per voter
                  return acc;
                }, {}) : {}
              }}
              onSubmitVotes={handleSubmitVotes}
              isSubmitting={votingManagement.isSubmitting}
              message={votingMessage}
              leagueSettings={league ? {
                submissionDays: league.submissionDays,
                votingDays: league.votingDays,
                votesPerPlayer: league.votesPerPlayer
              } : undefined}
            />
          )}

          {/* User's Current Submission (when already submitted) */}
          {showSubmitted && promptData?.userResponse && session?.user && (
            <UserSubmissionDisplay
              userResponse={{
                ...promptData.userResponse,
                canEdit: true,
                isOwn: true,
                user: {
                  id: session.user.id,
                  username: session.user.username || '',
                  profilePhoto: session.user.profilePhoto
                }
              }}
              user={{
                id: session.user.id || `user-${session.user.username}`,
                username: session.user.username || '',
                profilePhoto: session.user.profilePhoto,
              }}
              onUpdate={handleUpdateResponse}
              isUpdating={isSubmittingResponse}
              message={submissionMessage}
            />
          )}
        </div>
        </PullToRefreshContainer>
      </div>
    </ErrorBoundary>
  );
}
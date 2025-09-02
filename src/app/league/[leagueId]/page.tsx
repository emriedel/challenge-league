'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  useLeagueQuery, 
  useVotingQuery, 
  useLeaguePromptQuery,
  useSubmitVotesMutation,
  useSubmitResponseMutation
} from '@/hooks/queries';
import { useSubmissionManagement } from '@/hooks/useSubmissionManagement';
import { useVotingManagement } from '@/hooks/useVotingManagement';
import { useMessages } from '@/hooks/useMessages';
import LeagueNavigation from '@/components/LeagueNavigation';
import CurrentChallenge from '@/components/CurrentChallenge';
import VotingInterface from '@/components/VotingInterface';
import SubmissionForm from '@/components/SubmissionForm';
import UserSubmissionDisplay from '@/components/UserSubmissionDisplay';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorFallback from '@/components/PageErrorFallback';
import { SkeletonChallenge, SkeletonSubmissionGrid, SkeletonSubmissionFeed } from '@/components/LoadingSkeleton';


interface LeagueHomePageProps {
  params: { leagueId: string };
}

export default function LeagueHomePage({ params }: LeagueHomePageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useLeagueQuery(params.leagueId);
  const { data: votingData, isLoading: votingLoading, error: votingError } = useVotingQuery(params.leagueId);
  const { data: promptData, isLoading: promptLoading, error: promptError, refetch: refetchPrompt } = useLeaguePromptQuery(params.leagueId);
  
  // Mutations for user actions
  const submitVotesMutation = useSubmitVotesMutation(params.leagueId);
  const submitResponseMutation = useSubmitResponseMutation(params.leagueId);
  
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
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  const handleSubmitVotes = async (votes: { [responseId: string]: number }) => {
    try {
      await submitVotesMutation.mutateAsync(votes);
      setVotingMessage({ type: 'success', text: 'Votes submitted successfully!' });
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
  const currentUserEntry = leaderboard.find(entry => entry.user.username === session.user.username);

  // Three basic states for the Challenge page
  const showVoting = votingData?.canVote && votingData.responses.length > 0;
  const showSubmission = !showVoting && promptData?.prompt && !promptData.userResponse;
  const showSubmitted = !showVoting && promptData?.prompt && promptData.userResponse;
  const showNoChallenge = !showVoting && !showSubmission && !showSubmitted;

  return (
    <ErrorBoundary 
      fallback={({ error, resetError }) => (
        <div>
          <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
          <PageErrorFallback 
            error={error}
            resetError={resetError}
            title="League Page Error"
            description="This league page encountered an error. Please try again."
          />
        </div>
      )}
    >
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
        
        {/* Container for challenge content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Current Challenge - only show when there's an active challenge */}
          {!showNoChallenge && (
            <CurrentChallenge
              votingData={votingData || undefined}
              promptData={promptData && promptData.prompt ? {
                prompt: {
                  id: promptData.prompt.id,
                  text: promptData.prompt.text,
                  phaseStartedAt: promptData.prompt.phaseStartedAt,
                  status: promptData.prompt.status,
                  queueOrder: promptData.prompt.queueOrder,
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
          )}

          {/* Submission Form */}
          {showSubmission && promptData?.prompt && (
            <div className="mb-8">
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
        </div>

        {/* Full-width components - outside container */}
        {/* Voting Interface */}
        {showVoting && votingData && (
          <VotingInterface
            votingData={{
              canVote: votingData.canVote,
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
                acc[vote.response.id] = 1; // Since each vote = 1 point in the current system
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
    </ErrorBoundary>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLeague } from '@/hooks/useLeague';
import { useVoting } from '@/hooks/useVoting';
import { useGallery } from '@/hooks/useGallery';
import { useLeaguePrompt } from '@/hooks/useLeaguePrompt';
import { useSubmissionManagement } from '@/hooks/useSubmissionManagement';
import { useVotingManagement } from '@/hooks/useVotingManagement';
import { useMessages } from '@/hooks/useMessages';
import LeagueNavigation from '@/components/LeagueNavigation';
import CurrentChallenge from '@/components/CurrentChallenge';
import VotingInterface from '@/components/VotingInterface';
import SubmissionSection from '@/components/SubmissionSection';
import UserSubmissionDisplay from '@/components/UserSubmissionDisplay';
import ResultsGallery from '@/components/ResultsGallery';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorFallback from '@/components/PageErrorFallback';
import { SkeletonChallenge, SkeletonSubmissionGrid, SkeletonSubmissionFeed } from '@/components/LoadingSkeleton';


interface LeagueHomePageProps {
  params: { leagueId: string };
}

export default function LeagueHomePage({ params }: LeagueHomePageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useLeague(params.leagueId);
  const { data: votingData, isLoading: votingLoading, error: votingError, submitVotes } = useVoting(params.leagueId);
  const { data: galleryData, isLoading: galleryLoading, error: galleryError } = useGallery(params.leagueId);
  const { data: promptData, isLoading: promptLoading, error: promptError, refetch: refetchPrompt } = useLeaguePrompt(params.leagueId);
  
  // Custom hooks for managing complex state
  const { submissionMessage, votingMessage, setSubmissionMessage, setVotingMessage } = useMessages();
  const { submitResponse, updateResponse, isSubmitting: isSubmittingResponse } = useSubmissionManagement({
    promptId: promptData?.prompt?.id,
    leagueId: params.leagueId,
    onSuccess: (message) => setSubmissionMessage({ type: 'success', text: message }),
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
    await votingManagement.submitVotes({ submitVotes });
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          description={leagueError}
          resetError={() => window.location.reload()}
        />
      </div>
    );
  }

  const league = leagueData?.league;
  const leaderboard = leagueData?.leaderboard || [];
  const currentUserEntry = leaderboard.find(entry => entry.user.username === session.user.username);

  // Show voting interface if voting is active, otherwise show submission area or latest results
  const showVoting = votingData?.canVote && votingData.responses.length > 0;
  const showSubmission = !showVoting && promptData?.prompt && !promptData.userResponse;
  const showSubmitted = !showVoting && promptData?.prompt && promptData.userResponse;
  const showLatestResults = !showVoting && !showSubmission && !showSubmitted && galleryData?.responses && galleryData.responses.length > 0;

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
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Challenge */}
        <CurrentChallenge
          votingData={votingData || undefined}
          promptData={promptData || undefined}
          showVoting={!!showVoting}
          showSubmission={!!showSubmission}
          showSubmitted={!!showSubmitted}
        />

        {/* Voting Interface */}
        {showVoting && votingData && (
          <VotingInterface
            votingData={{
              canVote: votingData.canVote,
              responses: votingData.responses,
              prompt: votingData.prompt ? { text: votingData.prompt.text } : undefined,
              voteEnd: votingData.voteEnd,
            }}
            onSubmitVotes={handleSubmitVotes}
            isSubmitting={votingManagement.isSubmitting}
            message={votingMessage}
          />
        )}

        {/* Submission Form */}
        {showSubmission && promptData?.prompt && (
          <SubmissionSection
            prompt={promptData.prompt}
            onSubmit={handleSubmitResponse}
            isSubmitting={isSubmittingResponse}
            message={submissionMessage}
          />
        )}

        {/* User's Current Submission (when already submitted) */}
        {showSubmitted && promptData?.userResponse && session?.user && (
          <UserSubmissionDisplay
            userResponse={promptData.userResponse}
            user={{
              username: session.user.username || '',
              profilePhoto: session.user.profilePhoto,
            }}
            onUpdate={handleUpdateResponse}
            isUpdating={isSubmittingResponse}
            message={submissionMessage}
          />
        )}

        {/* Completed Rounds (when not voting) */}
        {showLatestResults && !showVoting && galleryData?.responses && (
          <ResultsGallery
            responses={galleryData.responses.map(response => ({
              ...response,
              finalRank: response.finalRank || undefined,
            }))}
            prompt={galleryData.prompt || undefined}
            leagueId={params.leagueId}
          />
        )}

        </div>
      </div>
    </ErrorBoundary>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLeague } from '@/hooks/useLeague';
import { useVoting } from '@/hooks/useVoting';
import { useGallery } from '@/hooks/useGallery';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useLeaguePrompt } from '@/hooks/useLeaguePrompt';
import LeagueNavigation from '@/components/LeagueNavigation';
import SubmissionForm from '@/components/SubmissionForm';

// Ranking display for results
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return '#1';
    case 2:
      return '#2';
    case 3:
      return '#3';
    default:
      return `#${rank}`;
  }
};


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
  const [selectedVotes, setSelectedVotes] = useState<{ [responseId: string]: number }>({});
  const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [votingMessage, setVotingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (submissionMessage?.type === 'success') {
      const timer = setTimeout(() => {
        setSubmissionMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submissionMessage]);

  useEffect(() => {
    if (votingMessage?.type === 'success') {
      const timer = setTimeout(() => {
        setVotingMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [votingMessage]);

  const handleVoteSelection = (responseId: string, increment: boolean) => {
    const newVotes = { ...selectedVotes };
    const currentVotes = newVotes[responseId] || 0;
    
    if (increment && getTotalVotes() < 3) {
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
    if (totalVotes !== 3) {
      setVotingMessage({ type: 'error', text: 'Please use all 3 of your votes' });
      return;
    }

    setIsSubmittingVotes(true);
    setVotingMessage(null);
    const result = await submitVotes(selectedVotes);
    setIsSubmittingVotes(false);

    if (result.success) {
      setVotingMessage({ type: 'success', text: 'Votes submitted successfully!' });
      setSelectedVotes({});
    } else {
      setVotingMessage({ type: 'error', text: result.error || 'Failed to submit votes' });
    }
  };

  const handleSubmitResponse = async (data: { photo: File; caption: string }) => {
    if (!promptData?.prompt) return;

    setIsSubmittingResponse(true);
    setSubmissionMessage(null); // Clear any previous messages

    try {
      // First upload the photo
      const formData = new FormData();
      formData.append('file', data.photo);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload photo');
      }

      const { url: photoUrl } = await uploadResponse.json();

      // Then submit the response
      const submitResponse = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId: promptData.prompt.id,
          photoUrl,
          caption: data.caption,
          leagueId: params.leagueId,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      const isEditing = promptData.userResponse !== null;
      setSubmissionMessage({ 
        type: 'success', 
        text: isEditing ? 'Response updated successfully!' : 'Response submitted successfully!' 
      });
      setShowEditForm(false); // Hide edit form after successful submission
      refetchPrompt(); // Refresh to show updated submission
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to submit response' 
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  if (status === 'loading' || leagueLoading || promptLoading) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Loading..." />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading league...</p>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
            <p className="text-red-700">{leagueError}</p>
          </div>
        </div>
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
    <div>
      <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Challenge */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
          {showVoting ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Current Challenge</h2>
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-lg text-gray-800 font-medium">{votingData.prompt?.text}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-blue-700 font-medium">Voting Phase Active</p>
                  <p className="text-gray-600">Cast your votes for the best submissions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Voting deadline:</p>
                  <p className="text-lg font-semibold">
                    {votingData.voteEnd ? new Date(votingData.voteEnd).toLocaleDateString('en-US', {
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
              <div className="bg-white rounded-lg p-4 mb-4">
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
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Active Challenge</h2>
              <div className="space-y-2">
                <p className="text-gray-700">No challenge is currently active</p>
                <p className="text-sm text-gray-500">
                  {showLatestResults ? 'View the latest completed round below' : 'Check back for new challenges'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Voting Interface */}
        {showVoting && (
          <div className="space-y-6 mb-8">
            {/* Voting Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Cast Your Votes</h2>
              <div className="space-y-2 text-blue-700">
                <p className="font-medium">Challenge: {votingData.prompt?.text}</p>
              </div>
              <div className="mt-4 space-y-1 text-sm text-blue-600">
                <p>• You have 3 votes to distribute among submissions (each vote = 1 point)</p>
                <p>• You can give multiple votes to the same submission</p>
                <p>• You cannot vote for your own submission</p>
                <p>• Voting ends: {votingData.voteEnd ? new Date(votingData.voteEnd).toLocaleString() : 'TBD'}</p>
              </div>
            </div>

            {/* Voting Grid */}
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
                      className="w-full h-48 object-cover"
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
                            className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
                          >
                            −
                          </button>
                          <span className="text-lg font-semibold w-8 text-center">{voteCount}</span>
                          <button
                            onClick={() => handleVoteSelection(response.id, true)}
                            disabled={getTotalVotes() >= 3}
                            className="w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
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

            {/* Submit Votes */}
            <div className="text-center">
              <div className="mb-4">
                <span className="text-lg font-medium">
                  Votes used: {getTotalVotes()}/3
                </span>
              </div>
              <button
                onClick={handleSubmitVotes}
                disabled={getTotalVotes() !== 3 || isSubmittingVotes}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingVotes ? 'Submitting...' : 'Submit Votes'}
              </button>
              {votingMessage && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  votingMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {votingMessage.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission Form */}
        {showSubmission && (
          <div className="space-y-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Current Challenge</h2>
              <p className="text-gray-600 mb-6">{promptData.prompt.text}</p>
              
              {submissionMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  submissionMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {submissionMessage.text}
                </div>
              )}
              
              <SubmissionForm
                prompt={promptData.prompt}
                onSubmit={handleSubmitResponse}
                isSubmitting={isSubmittingResponse}
              />
            </div>
          </div>
        )}

        {/* User's Current Submission (when already submitted) */}
        {showSubmitted && (
          <div className="space-y-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-medium mb-3">Your Current Submission</h2>
                  <div className="text-right text-sm text-gray-500">
                    <div>Submitted: {new Date(promptData.userResponse!.submittedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}</div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-1/2">
                    <Image
                      src={promptData.userResponse!.imageUrl}
                      alt="Your submission"
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="md:w-1/2">
                    <div className="bg-white rounded-lg p-4 h-full">
                      <h4 className="font-medium text-gray-900 mb-2">Caption:</h4>
                      <p className="text-gray-700">{promptData.userResponse!.caption}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                {!showEditForm ? (
                  <div className="text-center">
                    <button
                      onClick={() => setShowEditForm(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Edit Submission
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      You can update your submission until the deadline
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium">Edit Your Submission</h3>
                      <button
                        onClick={() => setShowEditForm(false)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Your previous submission will be replaced with the new one.
                    </p>
                    
                    {submissionMessage && (
                      <div className={`mb-4 p-3 rounded-lg text-sm ${
                        submissionMessage.type === 'success' 
                          ? 'bg-green-50 border border-green-200 text-green-700' 
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }`}>
                        {submissionMessage.text}
                      </div>
                    )}
                    
                    <SubmissionForm
                      prompt={promptData.prompt}
                      onSubmit={handleSubmitResponse}
                      isSubmitting={isSubmittingResponse}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completed Rounds (when not voting) */}
        {showLatestResults && !showVoting && (
          <div className="space-y-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Latest Completed Round</h2>
              <p className="text-gray-600 mb-4">{galleryData.prompt?.text}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryData.responses?.slice(0, 6).map((response) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="relative">
                      <Image
                        src={response.imageUrl}
                        alt={response.caption}
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover"
                      />
                      {response.finalRank && response.finalRank <= 3 && (
                        <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-sm font-bold">
                          {getRankIcon(response.finalRank)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <ProfileAvatar 
                            username={response.user.username}
                            profilePhoto={response.user.profilePhoto}
                            size="sm"
                          />
                          <p className="font-medium text-gray-900">@{response.user.username}</p>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-blue-600 font-medium">{response.totalPoints} pts</div>
                          <div className="text-gray-500">#{response.finalRank || '—'}</div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{response.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link
                  href={`/league/${params.leagueId}/results`}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  View All Completed Rounds →
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
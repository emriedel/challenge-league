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
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorFallback from '@/components/PageErrorFallback';
import { SkeletonChallenge, SkeletonSubmissionGrid, SkeletonSubmissionFeed } from '@/components/LoadingSkeleton';
import { NoSubmissionsEmptyState, NoChallengeEmptyState } from '@/components/EmptyState';

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
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [editedPhoto, setEditedPhoto] = useState<File | null>(null);
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

  const handleStartInlineEdit = () => {
    if (promptData?.userResponse) {
      setEditedCaption(promptData.userResponse.caption);
      setEditedPhoto(null);
      setIsEditingInline(true);
    }
  };

  const handleCancelInlineEdit = () => {
    setIsEditingInline(false);
    setEditedCaption('');
    setEditedPhoto(null);
    setSubmissionMessage(null);
  };

  const handleSaveInlineEdit = async () => {
    if (!promptData?.prompt || !promptData.userResponse) return;

    setIsSubmittingResponse(true);
    setSubmissionMessage(null);

    try {
      let photoUrl = promptData.userResponse.imageUrl; // Keep existing photo by default

      // Upload new photo if one was selected
      if (editedPhoto) {
        const formData = new FormData();
        formData.append('file', editedPhoto);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo');
        }

        const { url } = await uploadResponse.json();
        photoUrl = url;
      }

      // Update the response
      const submitResponse = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId: promptData.prompt.id,
          photoUrl,
          caption: editedCaption,
          leagueId: params.leagueId,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Failed to update submission');
      }

      setSubmissionMessage({ 
        type: 'success', 
        text: 'Submission updated successfully!' 
      });
      setIsEditingInline(false);
      setEditedCaption('');
      setEditedPhoto(null);
      refetchPrompt(); // Refresh to show updated submission
    } catch (error) {
      console.error('Update error:', error);
      setSubmissionMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update submission' 
      });
    } finally {
      setIsSubmittingResponse(false);
    }
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
          {showVoting ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Current Challenge</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
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
                            disabled={getTotalVotes() >= 3}
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
              <h2 className="text-lg font-medium mb-4">Your Submission</h2>
              
              {/* Instagram-style submission display */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-4">
                {/* Header with user info and edit button */}
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center space-x-3">
                    <ProfileAvatar 
                      username={session.user.username || ''}
                      profilePhoto={session.user.profilePhoto}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{session.user.username}</p>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(promptData.userResponse!.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Edit button in upper right */}
                  {!isEditingInline && (
                    <button
                      onClick={handleStartInlineEdit}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none p-3"
                      title="Edit submission"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Image with preserved aspect ratio */}
                <div className="relative w-full">
                  {isEditingInline ? (
                    <div className="relative">
                      <Image
                        src={editedPhoto ? URL.createObjectURL(editedPhoto) : promptData.userResponse!.imageUrl}
                        alt="Your submission"
                        width={800}
                        height={600}
                        className="w-full h-auto object-contain bg-gray-50"
                        style={{ maxHeight: '70vh' }}
                        priority={false}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <label className="bg-white text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditedPhoto(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={promptData.userResponse!.imageUrl}
                      alt="Your submission"
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain bg-gray-50"
                      style={{ maxHeight: '70vh' }}
                      priority={false}
                    />
                  )}
                </div>
                
                {/* Caption area */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {isEditingInline ? (
                        <div className="space-y-3">
                          <p className="text-gray-800 leading-relaxed">
                            <span className="font-semibold">{session.user.username}</span>{' '}
                          </p>
                          <textarea
                            value={editedCaption}
                            onChange={(e) => setEditedCaption(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                            placeholder="Write a caption..."
                            maxLength={500}
                          />
                          <div className="text-xs text-gray-500 text-right">
                            {editedCaption.length}/500
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-800 leading-relaxed">
                          <span className="font-semibold">{session.user.username}</span>{' '}
                          <span>{promptData.userResponse!.caption}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save/Cancel buttons for inline editing */}
              {isEditingInline && (
                <div className="border-t pt-4">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleCancelInlineEdit}
                      disabled={isSubmittingResponse}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveInlineEdit}
                      disabled={isSubmittingResponse || editedCaption.trim().length === 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingResponse ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    You can update your submission until the deadline
                  </p>
                </div>
              )}
              
              {/* Success/Error messages */}
              {submissionMessage && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  submissionMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {submissionMessage.text}
                </div>
              )}
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
                        className="w-full h-48 object-contain bg-gray-50"
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
    </ErrorBoundary>
  );
}
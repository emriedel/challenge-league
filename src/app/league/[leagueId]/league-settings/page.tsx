'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  useLeagueSettingsQuery,
  useCreatePromptMutation,
  useUpdatePromptMutation,
  useDeletePromptMutation,
  useReorderPromptsMutation,
  useTransitionPhaseMutation,
  useUpdateLeagueSettingsMutation
} from '@/hooks/queries';
import LeagueNavigation from '@/components/LeagueNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorFallback from '@/components/PageErrorFallback';
import { SkeletonLeaderboard } from '@/components/LoadingSkeleton';
import { getRealisticPhaseEndTime } from '@/lib/phaseCalculations';

interface LeagueSettingsPageProps {
  params: { leagueId: string };
}

interface Prompt {
  id: string;
  text: string;
  phaseStartedAt: string | null;
  status: 'SCHEDULED' | 'ACTIVE' | 'VOTING' | 'COMPLETED';
  queueOrder: number;
  createdAt: string;
}

export default function LeagueSettingsPage({ params }: LeagueSettingsPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: settingsData, isLoading: settingsLoading, error: settingsError } = useLeagueSettingsQuery(params.leagueId);
  
  // Mutations
  const createPromptMutation = useCreatePromptMutation(params.leagueId);
  const updatePromptMutation = useUpdatePromptMutation(params.leagueId);
  const deletePromptMutation = useDeletePromptMutation(params.leagueId);
  const reorderPromptsMutation = useReorderPromptsMutation(params.leagueId);
  const transitionPhaseMutation = useTransitionPhaseMutation(params.leagueId);
  const updateLeagueSettingsMutation = useUpdateLeagueSettingsMutation(params.leagueId);
  
  // Local state
  const [newPromptText, setNewPromptText] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // League settings state - use strings for inputs, parse only on submit
  const [submissionDays, setSubmissionDays] = useState('5');
  const [votingDays, setVotingDays] = useState('2');
  const [votesPerPlayer, setVotesPerPlayer] = useState('3');
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Initialize settings when starting to edit
  const handleStartEditing = () => {
    if (settingsData?.league) {
      setSubmissionDays(settingsData.league.submissionDays.toString());
      setVotingDays(settingsData.league.votingDays.toString());
      setVotesPerPlayer(settingsData.league.votesPerPlayer.toString());
    }
    setIsEditingSettings(true);
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;

    try {
      await createPromptMutation.mutateAsync(newPromptText.trim());
      setNewPromptText('');
      setMessage({ type: 'success', text: 'Prompt added to queue successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create prompt' 
      });
    }
  };

  const handleUpdatePrompt = async (promptId: string) => {
    if (!editText.trim()) return;

    try {
      await updatePromptMutation.mutateAsync({ promptId, text: editText.trim() });
      setEditingPrompt(null);
      setEditText('');
      setMessage({ type: 'success', text: 'Prompt updated successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update prompt' 
      });
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      await deletePromptMutation.mutateAsync(promptId);
      setMessage({ type: 'success', text: 'Prompt deleted successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete prompt' 
      });
    }
  };

  const handleMovePrompt = async (promptId: string, direction: 'up' | 'down') => {
    if (!settingsData) return;
    
    const scheduled = settingsData.queue.scheduled;
    const currentIndex = scheduled.findIndex(p => p.id === promptId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= scheduled.length) return;

    const newOrder = [...scheduled];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

    try {
      await reorderPromptsMutation.mutateAsync(newOrder.map(p => p.id));
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to reorder prompts' 
      });
    }
  };

  const handleTransitionPhase = async () => {
    try {
      const result = await transitionPhaseMutation.mutateAsync();
      
      let successMessage = '';
      switch (result.action) {
        case 'activated':
          successMessage = `Started new challenge: &quot;${result.prompt}&quot;`;
          break;
        case 'started_voting':
          successMessage = `Started voting phase for: &quot;${result.prompt}&quot;`;
          break;
        case 'completed':
          successMessage = `Completed challenge: &quot;${result.prompt}&quot;`;
          break;
        case 'completed_and_started_next':
          successMessage = `Completed &quot;${result.completedPrompt}&quot; and started &quot;${result.newPrompt}&quot;`;
          break;
        default:
          successMessage = 'Phase transition completed';
      }
      
      setMessage({ type: 'success', text: successMessage });
      setShowTransitionModal(false);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to transition phase' 
      });
      setShowTransitionModal(false);
    }
  };

  const handleUpdateLeagueSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse and validate input values
    const parsedSubmissionDays = parseInt(submissionDays, 10);
    const parsedVotingDays = parseInt(votingDays, 10);
    const parsedVotesPerPlayer = parseInt(votesPerPlayer, 10);
    
    // Validation
    if (isNaN(parsedSubmissionDays) || parsedSubmissionDays < 1 || parsedSubmissionDays > 14) {
      setMessage({ type: 'error', text: 'Submission days must be between 1 and 14' });
      return;
    }
    if (isNaN(parsedVotingDays) || parsedVotingDays < 1 || parsedVotingDays > 7) {
      setMessage({ type: 'error', text: 'Voting days must be between 1 and 7' });
      return;
    }
    if (isNaN(parsedVotesPerPlayer) || parsedVotesPerPlayer < 1 || parsedVotesPerPlayer > 10) {
      setMessage({ type: 'error', text: 'Votes per player must be between 1 and 10' });
      return;
    }
    
    try {
      await updateLeagueSettingsMutation.mutateAsync({
        submissionDays: parsedSubmissionDays,
        votingDays: parsedVotingDays,
        votesPerPlayer: parsedVotesPerPlayer
      });
      
      setIsEditingSettings(false);
      setMessage({ type: 'success', text: 'League settings updated successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update league settings' 
      });
    }
  };

  const handleCancelSettingsEdit = () => {
    // Reset to current values
    if (settingsData?.league) {
      setSubmissionDays(settingsData.league.submissionDays.toString());
      setVotingDays(settingsData.league.votingDays.toString());
      setVotesPerPlayer(settingsData.league.votesPerPlayer.toString());
    }
    setIsEditingSettings(false);
  };

  if (status === 'loading' || settingsLoading) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Loading..." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonLeaderboard />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (settingsError) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Error" />
        <PageErrorFallback 
          title="League Settings Error"
          description={settingsError instanceof Error ? settingsError.message : settingsError || 'An error occurred'}
          resetError={() => window.location.reload()}
        />
      </div>
    );
  }

  const league = settingsData?.league;
  const queue = settingsData?.queue;
  const phaseInfo = settingsData?.phaseInfo;
  const isOwner = league?.isOwner || false;

  return (
    <ErrorBoundary 
      fallback={({ error, resetError }) => (
        <div>
          <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
          <PageErrorFallback 
            error={error}
            resetError={resetError}
            title="League Settings Error"
            description="The league settings page encountered an error. Please try again."
          />
        </div>
      )}
    >
      <div className="min-h-screen bg-app-bg">
        <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
        
        {/* Mobile-friendly container with proper bottom padding for nav */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 md:pb-8">
          
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-app-text mb-2">
              {isOwner ? 'League Settings' : 'League Information'}
            </h1>
            <div className="bg-app-surface rounded-lg border border-app-border p-4">
              <h2 className="font-semibold text-app-text mb-2">{league?.name}</h2>
              {league?.description && (
                <p className="text-app-text-secondary mb-2">{league.description}</p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-app-text-muted">
                  {league?.memberCount} members
                </p>
                {isOwner && (
                  <p className="text-sm text-app-text-muted font-mono bg-app-surface-dark px-2 py-1 rounded">
                    Invite Code: {league?.inviteCode}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* League Configuration Settings */}
          <div className="bg-app-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-app-text">League Configuration</h2>
              {isOwner && !isEditingSettings && (
                <button
                  onClick={handleStartEditing}
                  className="px-3 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Edit Settings
                </button>
              )}
            </div>

            {isEditingSettings && isOwner ? (
              <form onSubmit={handleUpdateLeagueSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="submission-days" className="block text-sm font-medium text-app-text-secondary mb-2">
                      Submission Days
                    </label>
                    <input
                      id="submission-days"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={submissionDays}
                      onChange={(e) => setSubmissionDays(e.target.value)}
                      placeholder="Enter number of days (1-14)"
                    />
                    <p className="text-xs text-app-text-muted mt-1">Days for submission phase (1-14)</p>
                  </div>

                  <div>
                    <label htmlFor="voting-days" className="block text-sm font-medium text-app-text-secondary mb-2">
                      Voting Days
                    </label>
                    <input
                      id="voting-days"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={votingDays}
                      onChange={(e) => setVotingDays(e.target.value)}
                      placeholder="Enter number of days (1-7)"
                    />
                    <p className="text-xs text-app-text-muted mt-1">Days for voting phase (1-7)</p>
                  </div>

                  <div>
                    <label htmlFor="votes-per-player" className="block text-sm font-medium text-app-text-secondary mb-2">
                      Votes Per Player
                    </label>
                    <input
                      id="votes-per-player"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={votesPerPlayer}
                      onChange={(e) => setVotesPerPlayer(e.target.value)}
                      placeholder="Enter number of votes (1-10)"
                    />
                    <p className="text-xs text-app-text-muted mt-1">Number of votes each player gets (1-10)</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={updateLeagueSettingsMutation.isPending}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updateLeagueSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSettingsEdit}
                    className="w-full sm:w-auto bg-app-surface-light text-app-text px-6 py-2 rounded-lg font-medium hover:bg-app-surface focus:outline-none focus:ring-2 focus:ring-app-border focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-app-surface-dark rounded-lg p-4">
                  <h3 className="text-sm font-medium text-app-text-secondary mb-1">Submission Phase</h3>
                  <p className="text-2xl font-bold text-app-text">{league?.submissionDays || 5} days</p>
                  <p className="text-xs text-app-text-muted">Time to submit responses</p>
                </div>
                
                <div className="bg-app-surface-dark rounded-lg p-4">
                  <h3 className="text-sm font-medium text-app-text-secondary mb-1">Voting Phase</h3>
                  <p className="text-2xl font-bold text-app-text">{league?.votingDays || 2} days</p>
                  <p className="text-xs text-app-text-muted">Time to vote on submissions</p>
                </div>
                
                <div className="bg-app-surface-dark rounded-lg p-4">
                  <h3 className="text-sm font-medium text-app-text-secondary mb-1">Votes Per Player</h3>
                  <p className="text-2xl font-bold text-app-text">{league?.votesPerPlayer || 3} votes</p>
                  <p className="text-xs text-app-text-muted">Each player can cast this many votes</p>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          {message && (
            <div className={`mb-6 px-4 py-3 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-sm">{message.text}</span>
                <button 
                  onClick={() => setMessage(null)} 
                  className="ml-2 text-lg leading-none hover:opacity-70"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Admin Controls */}
          {isOwner && (
            <>
              {/* Phase Transition Controls */}
              <div className="bg-app-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-app-text mb-4">Phase Controls</h2>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-900 mb-2">Current Status</h3>
                  {phaseInfo?.currentPhase.type === 'NONE' && (
                    <p className="text-blue-700 text-sm">No active challenges</p>
                  )}
                  {phaseInfo?.currentPhase.type === 'ACTIVE' && (
                    <div className="text-blue-700 text-sm">
                      <p className="font-medium">Active Phase: &quot;{phaseInfo.currentPhase.prompt}&quot;</p>
                      {phaseInfo.currentPhase.endTime && (
                        <p>Ends: {new Date(phaseInfo.currentPhase.endTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}</p>
                      )}
                    </div>
                  )}
                  {phaseInfo?.currentPhase.type === 'VOTING' && (
                    <div className="text-blue-700 text-sm">
                      <p className="font-medium">Voting Phase: &quot;{phaseInfo.currentPhase.prompt}&quot;</p>
                      {phaseInfo.currentPhase.endTime && (
                        <p>Ends: {new Date(phaseInfo.currentPhase.endTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-orange-900 mb-2">Next Action</h3>
                  <p className="text-orange-700 text-sm">
                    {phaseInfo?.nextPhase.type === 'VOTING' && `Will start voting for: "${phaseInfo.nextPhase.prompt}"`}
                    {phaseInfo?.nextPhase.type === 'COMPLETED' && `Will complete current challenge`}
                    {phaseInfo?.nextPhase.type === 'NEW_ACTIVE' && phaseInfo.nextPhase.prompt && `Will start new challenge: "${phaseInfo.nextPhase.prompt}"`}
                    {phaseInfo?.nextPhase.type === 'NEW_ACTIVE' && !phaseInfo.nextPhase.prompt && `No scheduled challenges available`}
                  </p>
                </div>

                <button
                  onClick={() => setShowTransitionModal(true)}
                  disabled={transitionPhaseMutation.isPending}
                  className="w-full sm:w-auto bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {transitionPhaseMutation.isPending ? 'Transitioning...' : 'Transition to Next Phase'}
                </button>
              </div>

              {/* Add New Prompt */}
              <div className="bg-app-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-app-text mb-4">Add Challenge</h2>
                <form onSubmit={handleCreatePrompt} className="space-y-4">
                  <div>
                    <label htmlFor="prompt-text" className="block text-sm font-medium text-app-text-secondary mb-2">
                      Challenge Description
                    </label>
                    <textarea
                      id="prompt-text"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="e.g., Share a photo that represents your favorite moment from this week"
                      value={newPromptText}
                      onChange={(e) => setNewPromptText(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={createPromptMutation.isPending || !newPromptText.trim()}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {createPromptMutation.isPending ? 'Adding...' : 'Add to Queue'}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Current Active Challenge */}
          {queue?.active && queue.active.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-green-900 mb-4">Currently Active</h2>
              {queue.active.map((prompt) => (
                <div key={prompt.id} className="bg-app-surface-dark rounded-lg p-4">
                  <h3 className="font-medium text-app-text mb-2">{prompt.text}</h3>
                  <div className="text-sm text-app-text-secondary">
                    {(() => {
                      const endTime = getRealisticPhaseEndTime({ 
                        id: prompt.id, 
                        status: prompt.status, 
                        phaseStartedAt: prompt.phaseStartedAt ? new Date(prompt.phaseStartedAt) : null 
                      }, league ? {
                        submissionDays: league.submissionDays,
                        votingDays: league.votingDays,
                        votesPerPlayer: league.votesPerPlayer
                      } : undefined);
                      return endTime ? (
                        <p>Active until: {endTime.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}</p>
                      ) : (
                        <p>Phase timing not available</p>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Voting Phase */}
          {queue?.voting && queue.voting.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-4">Voting Phase Active</h2>
              {queue.voting.map((prompt) => (
                <div key={prompt.id} className="bg-app-surface-dark rounded-lg p-4">
                  <h3 className="font-medium text-app-text mb-2">{prompt.text}</h3>
                  <div className="text-sm text-app-text-secondary">
                    {(() => {
                      const endTime = getRealisticPhaseEndTime({ 
                        id: prompt.id, 
                        status: prompt.status, 
                        phaseStartedAt: prompt.phaseStartedAt ? new Date(prompt.phaseStartedAt) : null 
                      }, league ? {
                        submissionDays: league.submissionDays,
                        votingDays: league.votingDays,
                        votesPerPlayer: league.votesPerPlayer
                      } : undefined);
                      return endTime ? (
                        <p>Voting ends: {endTime.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}</p>
                      ) : (
                        <p>Phase timing not available</p>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Challenges Queue */}
          <div className="bg-app-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-app-text mb-4">
              Upcoming Challenges ({queue?.scheduled?.length || 0})
            </h2>
            
            {!queue?.scheduled || queue.scheduled.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-app-text-muted mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-app-text-muted">No upcoming challenges</p>
                {isOwner && (
                  <p className="text-app-text-muted text-sm mt-1">Add some challenges above to get started!</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {queue.scheduled.map((prompt, index) => (
                  <div key={prompt.id} className="border border-app-border rounded-lg p-4 hover:bg-app-surface-light transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Queue Position */}
                      <div className="flex-shrink-0">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                      </div>
                      
                      {/* Prompt Content */}
                      <div className="flex-1 min-w-0">
                        {editingPrompt === prompt.id && isOwner ? (
                          <div className="space-y-3">
                            <textarea
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                            />
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => handleUpdatePrompt(prompt.id)}
                                disabled={updatePromptMutation.isPending}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                              >
                                {updatePromptMutation.isPending ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPrompt(null);
                                  setEditText('');
                                }}
                                className="px-3 py-2 bg-app-surface-light text-app-text rounded-lg text-sm hover:bg-app-surface"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <h3 className="font-medium text-app-text text-sm sm:text-base leading-relaxed">
                            {prompt.text}
                          </h3>
                        )}
                      </div>
                      
                      {/* Actions */}
                      {editingPrompt !== prompt.id && isOwner && (
                        <div className="flex flex-col sm:flex-row gap-1 flex-shrink-0">
                          {/* Move buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMovePrompt(prompt.id, 'up')}
                              disabled={index === 0 || reorderPromptsMutation.isPending}
                              className="p-1 text-app-text-muted hover:text-app-text-secondary disabled:opacity-30 text-sm"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMovePrompt(prompt.id, 'down')}
                              disabled={index === queue.scheduled.length - 1 || reorderPromptsMutation.isPending}
                              className="p-1 text-app-text-muted hover:text-app-text-secondary disabled:opacity-30 text-sm"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                          
                          {/* Edit and Delete buttons - mobile optimized */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingPrompt(prompt.id);
                                setEditText(prompt.text);
                              }}
                              className="px-2 py-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm rounded hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            
                            <button
                              onClick={() => handleDeletePrompt(prompt.id)}
                              disabled={deletePromptMutation.isPending}
                              className="px-2 py-1 text-red-600 hover:text-red-700 text-xs sm:text-sm rounded hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletePromptMutation.isPending ? '...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Challenges */}
          {queue?.completed && queue.completed.length > 0 && (
            <div className="bg-app-surface-dark rounded-lg border border-app-border p-4 sm:p-6 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-app-text-secondary mb-4">
                Recent Completed Challenges ({Math.min(queue.completed.length, 10)})
              </h2>
              <div className="space-y-2">
                {queue.completed.slice(-10).reverse().map((prompt) => (
                  <div key={prompt.id} className="text-sm text-app-text-secondary p-2 bg-app-surface rounded border border-app-border">
                    <p className="font-medium">{prompt.text}</p>
                    <p className="text-xs text-app-text-muted mt-1">
                      Completed on {new Date(prompt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
            <div className="text-blue-700 space-y-1">
              <p>• Challenges automatically activate in queue order</p>
              <p>• Each challenge runs for {league?.submissionDays || 5} days (submission phase)</p>
              <p>• Followed by {league?.votingDays || 2} days of voting</p>
              <p>• Each player gets {league?.votesPerPlayer || 3} votes to cast per challenge</p>
              <p>• {isOwner ? 'Use "Transition to Next Phase" to manually advance phases' : 'League owners can manually advance phases if needed'}</p>
            </div>
          </div>
        </div>

        {/* Transition Confirmation Modal */}
        {showTransitionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-app-surface rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-app-text mb-4">Confirm Phase Transition</h3>
              
              <div className="mb-4 space-y-3">
                <div className="bg-app-surface-dark p-3 rounded">
                  <p className="text-sm font-medium text-app-text-secondary">Current:</p>
                  <p className="text-sm text-app-text-secondary">
                    {phaseInfo?.currentPhase.type === 'NONE' && 'No active challenges'}
                    {phaseInfo?.currentPhase.type === 'ACTIVE' && `Active: "${phaseInfo.currentPhase.prompt}"`}
                    {phaseInfo?.currentPhase.type === 'VOTING' && `Voting: "${phaseInfo.currentPhase.prompt}"`}
                  </p>
                </div>
                
                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-sm font-medium text-orange-700">Next:</p>
                  <p className="text-sm text-orange-600">
                    {phaseInfo?.nextPhase.type === 'VOTING' && `Start voting for: "${phaseInfo.nextPhase.prompt}"`}
                    {phaseInfo?.nextPhase.type === 'COMPLETED' && 'Complete current challenge'}
                    {phaseInfo?.nextPhase.type === 'NEW_ACTIVE' && phaseInfo.nextPhase.prompt && `Start new challenge: "${phaseInfo.nextPhase.prompt}"`}
                    {phaseInfo?.nextPhase.type === 'NEW_ACTIVE' && !phaseInfo.nextPhase.prompt && 'No scheduled challenges'}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-app-text-secondary mb-6">
                This will immediately move to the next phase, regardless of timing. Are you sure?
              </p>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => setShowTransitionModal(false)}
                  className="px-4 py-2 text-app-text-secondary bg-app-surface-dark rounded-lg hover:bg-app-surface-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransitionPhase}
                  disabled={transitionPhaseMutation.isPending}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  {transitionPhaseMutation.isPending ? 'Transitioning...' : 'Confirm Transition'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
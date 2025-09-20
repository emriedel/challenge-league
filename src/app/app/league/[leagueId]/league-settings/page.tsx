'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  useLeagueSettingsQuery,
  useCreatePromptMutation,
  useUpdatePromptMutation,
  useDeletePromptMutation,
  useReorderPromptsMutation,
  useTransitionPhaseMutation,
  useUpdateLeagueSettingsMutation,
  useLeaveLeagueMutation,
  useDeleteLeagueMutation
} from '@/hooks/queries';
import { useLeagueSettingsCacheListener } from '@/hooks/useCacheEventListener';
import { useCacheInvalidator } from '@/lib/cacheInvalidation';
import { useNavigationRefreshHandlers } from '@/lib/navigationRefresh';
import DocumentPullToRefresh from '@/components/DocumentPullToRefresh';
import LeagueNavigation from '@/components/LeagueNavigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorFallback from '@/components/PageErrorFallback';
import { SkeletonLeaderboard } from '@/components/LoadingSkeleton';

// CSS for range sliders
const sliderStyles = `
  .slider {
    touch-action: pan-y;
    -webkit-appearance: none;
    appearance: none;
  }
  
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    touch-action: pan-y;
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    touch-action: pan-y;
  }
  
  .slider::-webkit-slider-track {
    height: 8px;
    background: #404040;
    border-radius: 4px;
  }
  
  .slider::-moz-range-track {
    height: 8px;
    background: #404040;
    border-radius: 4px;
    border: none;
  }
  
  .slider-container {
    touch-action: pan-y;
    overflow: hidden;
  }
`;

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

  // Listen for cache events to keep settings synchronized
  useLeagueSettingsCacheListener(params.leagueId);

  // Pull-to-refresh setup
  const cacheInvalidator = useCacheInvalidator();

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await cacheInvalidator.refreshLeague(params.leagueId);
  }, [cacheInvalidator, params.leagueId]);

  // Handle scroll-to-top from navigation
  const handleScrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Handle navigation refresh trigger
  const handleNavigationRefresh = useCallback(async () => {
    await handleRefresh();
  }, [handleRefresh]);

  // Register this page with the navigation refresh manager
  useNavigationRefreshHandlers('league', handleScrollToTop, handleNavigationRefresh);

  // Mutations
  const createPromptMutation = useCreatePromptMutation(params.leagueId);
  const updatePromptMutation = useUpdatePromptMutation(params.leagueId);
  const deletePromptMutation = useDeletePromptMutation(params.leagueId);
  const reorderPromptsMutation = useReorderPromptsMutation(params.leagueId);
  const transitionPhaseMutation = useTransitionPhaseMutation(params.leagueId);
  const updateLeagueSettingsMutation = useUpdateLeagueSettingsMutation(params.leagueId);
  const leaveLeagueMutation = useLeaveLeagueMutation(params.leagueId);
  const deleteLeagueMutation = useDeleteLeagueMutation(params.leagueId);
  
  // Local state
  const [newPromptText, setNewPromptText] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ promptId: string; promptText: string } | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteLeagueConfirm, setShowDeleteLeagueConfirm] = useState(false);

  // Optimistic state for prompts
  const [optimisticPrompts, setOptimisticPrompts] = useState<Prompt[]>([]);
  const [deletingPrompts, setDeletingPrompts] = useState<Set<string>>(new Set());
  
  // League settings state - use strings for inputs, parse only on submit
  const [submissionDays, setSubmissionDays] = useState('6');
  const [votingDays, setVotingDays] = useState('1');
  const [votesPerPlayer, setVotesPerPlayer] = useState('3');
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/app/auth/signin');
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

    // Optimistic update
    const tempPrompt: Prompt = {
      id: `temp-${Date.now()}`,
      text: newPromptText.trim(),
      phaseStartedAt: null,
      status: 'SCHEDULED',
      queueOrder: (settingsData?.queue.scheduled?.length || 0) + optimisticPrompts.length + 1,
      createdAt: new Date().toISOString()
    };

    const promptText = newPromptText.trim();
    setOptimisticPrompts(prev => [...prev, tempPrompt]);
    setNewPromptText('');
    setShowAddChallenge(false);

    try {
      await createPromptMutation.mutateAsync(promptText);
      // Clear optimistic state on success - real data will replace it
      setOptimisticPrompts(prev => prev.filter(p => p.id !== tempPrompt.id));
    } catch (error) {
      // Remove optimistic prompt on error
      setOptimisticPrompts(prev => prev.filter(p => p.id !== tempPrompt.id));
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
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update prompt' 
      });
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    // Optimistic update
    setDeletingPrompts(prev => new Set(prev).add(promptId));
    setDeleteConfirm(null);

    try {
      await deletePromptMutation.mutateAsync(promptId);
      // Clear optimistic state on success
      setDeletingPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
    } catch (error) {
      // Revert optimistic state on error
      setDeletingPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete prompt'
      });
    }
  };

  const handleMovePrompt = async (promptId: string, direction: 'up' | 'down') => {
    if (!settingsData) return;

    const allPrompts = [...(settingsData.queue.scheduled || []), ...optimisticPrompts].filter(p => !deletingPrompts.has(p.id));
    const currentIndex = allPrompts.findIndex(p => p.id === promptId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= allPrompts.length) return;

    const newOrder = [...allPrompts];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

    try {
      // Only send real prompt IDs to the server
      const realPromptIds = newOrder.map(p => p.id).filter(id => !id.startsWith('temp-'));
      await reorderPromptsMutation.mutateAsync(realPromptIds);
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

  const handleLeaveLeague = async () => {
    try {
      await leaveLeagueMutation.mutateAsync();
      setShowLeaveConfirm(false);
      // Redirect to leagues page after leaving
      router.push('/app');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to leave league' 
      });
      setShowLeaveConfirm(false);
    }
  };

  const handleDeleteLeague = async () => {
    try {
      await deleteLeagueMutation.mutateAsync();
      setShowDeleteLeagueConfirm(false);
      // Redirect to leagues page after deleting
      router.push('/app');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete league' 
      });
      setShowDeleteLeagueConfirm(false);
    }
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
    <>
      <style>{sliderStyles}</style>
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
      <DocumentPullToRefresh onRefresh={handleRefresh}>
        <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />

        {/* Mobile-friendly container with proper bottom padding for nav */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
          
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-app-text mb-4 text-center">
              {isOwner ? 'League Settings' : 'League Information'}
            </h1>
            <div className="bg-app-surface rounded-lg border border-app-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-app-text">{league?.name}</h2>
                <p className="text-sm text-app-text-muted">
                  {league?.memberCount} members
                </p>
              </div>
              {league?.description && (
                <p className="text-app-text-secondary">{league.description}</p>
              )}
            </div>
          </div>

          {/* League Configuration Settings */}
          <div className="bg-app-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-app-text">League Configuration</h2>
              {isOwner && !isEditingSettings && (
                <button
                  onClick={handleStartEditing}
                  className="px-3 py-2 text-[#3a8e8c] hover:text-[#2d6b6a] text-sm font-medium rounded-lg hover:bg-[#3a8e8c] hover:bg-opacity-10 transition-colors"
                >
                  Edit Settings
                </button>
              )}
            </div>

            {isEditingSettings && isOwner ? (
              <form onSubmit={handleUpdateLeagueSettings} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="slider-container">
                    <label htmlFor="submission-days" className="block text-sm font-medium text-app-text-secondary mb-3">
                      Submission Days: {submissionDays}
                    </label>
                    <input
                      id="submission-days"
                      type="range"
                      min="1"
                      max="14"
                      step="1"
                      className="w-full h-2 bg-app-surface-dark rounded-lg appearance-none cursor-pointer slider"
                      value={submissionDays}
                      onChange={(e) => setSubmissionDays(e.target.value)}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    />
                    <div className="flex justify-between text-xs text-app-text-muted mt-1">
                      <span>1 day</span>
                      <span>14 days</span>
                    </div>
                    <p className="text-xs text-app-text-muted mt-2">Days for submission phase</p>
                  </div>

                  <div className="slider-container">
                    <label htmlFor="voting-days" className="block text-sm font-medium text-app-text-secondary mb-3">
                      Voting Days: {votingDays}
                    </label>
                    <input
                      id="voting-days"
                      type="range"
                      min="1"
                      max="7"
                      step="1"
                      className="w-full h-2 bg-app-surface-dark rounded-lg appearance-none cursor-pointer slider"
                      value={votingDays}
                      onChange={(e) => setVotingDays(e.target.value)}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    />
                    <div className="flex justify-between text-xs text-app-text-muted mt-1">
                      <span>1 day</span>
                      <span>7 days</span>
                    </div>
                    <p className="text-xs text-app-text-muted mt-2">Days for voting phase</p>
                  </div>

                  <div className="slider-container">
                    <label htmlFor="votes-per-player" className="block text-sm font-medium text-app-text-secondary mb-3">
                      Votes Per Player: {votesPerPlayer}
                    </label>
                    <input
                      id="votes-per-player"
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      className="w-full h-2 bg-app-surface-dark rounded-lg appearance-none cursor-pointer slider"
                      value={votesPerPlayer}
                      onChange={(e) => setVotesPerPlayer(e.target.value)}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    />
                    <div className="flex justify-between text-xs text-app-text-muted mt-1">
                      <span>1 vote</span>
                      <span>10 votes</span>
                    </div>
                    <p className="text-xs text-app-text-muted mt-2">Number of votes each player gets</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={updateLeagueSettingsMutation.isPending}
                    className="w-full sm:w-auto bg-[#3a8e8c] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#2d6b6a] focus:outline-none focus:ring-2 focus:ring-[#3a8e8c] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  >
                    {updateLeagueSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSettingsEdit}
                    className="w-full sm:w-auto bg-app-surface-light text-app-text px-6 py-2 rounded-lg font-medium hover:bg-app-surface border border-app-border focus:outline-none focus:ring-2 focus:ring-app-border focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-app-surface-dark rounded-lg p-4">
                  <h3 className="text-sm font-medium text-app-text-secondary mb-1">Submission Phase</h3>
                  <p className="text-2xl font-bold text-app-text">{league?.submissionDays || 6} days</p>
                  <p className="text-xs text-app-text-muted">Time to submit responses</p>
                </div>
                
                <div className="bg-app-surface-dark rounded-lg p-4">
                  <h3 className="text-sm font-medium text-app-text-secondary mb-1">Voting Phase</h3>
                  <p className="text-2xl font-bold text-app-text">{league?.votingDays || 1} days</p>
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
                ? 'bg-green-900 bg-opacity-20 border-green-600 border-opacity-30 text-green-300' 
                : 'bg-red-900 bg-opacity-20 border-red-600 border-opacity-30 text-red-300'
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



          {/* Upcoming Challenges Queue - Admin Only */}
          {isOwner && (
          <div className="bg-app-surface rounded-lg border border-app-border p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-app-text mb-4">
              Upcoming Challenges ({((queue?.scheduled?.length || 0) + optimisticPrompts.length)})
            </h2>
            
            {(!queue?.scheduled || queue.scheduled.length === 0) && optimisticPrompts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-app-text-muted mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-app-text-muted">No upcoming challenges</p>
                {isOwner && (
                  <p className="text-app-text-muted text-sm mt-1">Click the button below to add your first challenge!</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {[...(queue?.scheduled || []), ...optimisticPrompts]
                  .filter(prompt => !deletingPrompts.has(prompt.id))
                  .map((prompt, index) => (
                  <div key={prompt.id} className={`border border-app-border rounded-lg p-4 hover:bg-app-surface-light transition-colors ${
                    prompt.id.startsWith('temp-') ? 'opacity-75' : ''
                  } ${
                    deletingPrompts.has(prompt.id) ? 'opacity-50 pointer-events-none' : ''
                  }`}>
                    {/* Header with queue number and prompt text */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className="bg-blue-900 bg-opacity-30 text-blue-300 text-xs font-medium px-2 py-1 rounded flex-shrink-0">
                        #{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        {editingPrompt === prompt.id && isOwner ? (
                          <textarea
                            rows={3}
                            className="w-full px-3 py-2 bg-app-surface border border-app-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-app-text placeholder-app-text-muted resize-none"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                          />
                        ) : (
                          <h3 className="font-medium text-app-text text-base leading-relaxed break-words">
                            {prompt.text}
                          </h3>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons row */}
                    {isOwner && (
                      <div className="flex items-center justify-between pt-2 border-t border-app-border-dark">
                        {/* Left: Move buttons */}
                        {editingPrompt !== prompt.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleMovePrompt(prompt.id, 'up')}
                              disabled={index === 0 || reorderPromptsMutation.isPending || prompt.id.startsWith('temp-')}
                              className="flex items-center justify-center w-10 h-10 text-app-text-muted hover:text-app-text-secondary disabled:opacity-30 text-xl hover:bg-app-surface-light rounded-lg transition-colors"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMovePrompt(prompt.id, 'down')}
                              disabled={index === [...(queue?.scheduled || []), ...optimisticPrompts].filter(p => !deletingPrompts.has(p.id)).length - 1 || reorderPromptsMutation.isPending || prompt.id.startsWith('temp-')}
                              className="flex items-center justify-center w-10 h-10 text-app-text-muted hover:text-app-text-secondary disabled:opacity-30 text-xl hover:bg-app-surface-light rounded-lg transition-colors"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                        ) : (
                          <div></div>
                        )}
                        
                        {/* Right: Edit/Delete or Save/Cancel buttons */}
                        <div className="flex items-center gap-2">
                          {editingPrompt === prompt.id ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingPrompt(null);
                                  setEditText('');
                                }}
                                className="px-4 py-2 bg-app-surface-light text-app-text rounded-lg text-sm hover:bg-app-surface border border-app-border transition-colors min-h-[40px]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdatePrompt(prompt.id)}
                                disabled={updatePromptMutation.isPending}
                                className="px-4 py-2 bg-[#3a8e8c] text-white rounded-lg text-sm hover:bg-[#2d6b6a] disabled:opacity-50 transition-colors min-h-[40px]"
                              >
                                {updatePromptMutation.isPending ? 'Saving...' : 'Save'}
                              </button>
                            </>
                          ) : (
                            <>
                              {!prompt.id.startsWith('temp-') && (
                                <button
                                  onClick={() => {
                                    setEditingPrompt(prompt.id);
                                    setEditText(prompt.text);
                                  }}
                                  className="flex items-center justify-center w-10 h-10 text-blue-400 hover:text-blue-300 hover:bg-blue-900 hover:bg-opacity-20 rounded-lg transition-colors"
                                  title="Edit challenge"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (prompt.id.startsWith('temp-')) {
                                    setOptimisticPrompts(prev => prev.filter(p => p.id !== prompt.id));
                                  } else {
                                    setDeleteConfirm({ promptId: prompt.id, promptText: prompt.text });
                                  }
                                }}
                                disabled={deletePromptMutation.isPending && !prompt.id.startsWith('temp-')}
                                className="flex items-center justify-center w-10 h-10 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded-lg disabled:opacity-50 transition-colors"
                                title="Delete challenge"
                              >
                                {deletePromptMutation.isPending && !prompt.id.startsWith('temp-') ? (
                                  <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Challenge Section */}
            <div className="mt-4 pt-4 border-t border-app-border">
                {!showAddChallenge ? (
                  <button
                    onClick={() => setShowAddChallenge(true)}
                    className="w-full bg-[#3a8e8c] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#2d6b6a] focus:outline-none focus:ring-2 focus:ring-[#3a8e8c] focus:ring-offset-2 transition-colors"
                  >
                    + Add Challenge
                  </button>
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={handleCreatePrompt} className="space-y-4">
                      <div>
                        <label htmlFor="prompt-text" className="block text-sm font-medium text-app-text-secondary mb-2">
                          Challenge Description
                        </label>
                        <textarea
                          id="prompt-text"
                          rows={3}
                          className="w-full px-3 py-2 bg-app-surface border border-app-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-app-text placeholder-app-text-muted"
                          placeholder="e.g., Share a photo that represents your favorite moment from this week"
                          value={newPromptText}
                          onChange={(e) => setNewPromptText(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="submit"
                          disabled={createPromptMutation.isPending || !newPromptText.trim()}
                          className="flex-1 sm:flex-none bg-[#3a8e8c] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#2d6b6a] focus:outline-none focus:ring-2 focus:ring-[#3a8e8c] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                        >
                          {createPromptMutation.isPending ? 'Adding...' : 'Add to Queue'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddChallenge(false);
                            setNewPromptText('');
                          }}
                          className="flex-1 sm:flex-none bg-app-surface-light text-app-text px-6 py-2 rounded-lg font-medium hover:bg-app-surface border border-app-border focus:outline-none focus:ring-2 focus:ring-app-border focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
            </div>
          </div>
          )}

          {/* Admin Controls & Danger Zone - Admin Only */}
          {isOwner && (
            <div className="bg-app-surface rounded-lg border border-app-border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-app-text mb-4">Danger Zone</h2>

              {/* Phase Controls Section */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-app-text mb-2">Phase Controls</h3>
                <div className="bg-app-surface-dark rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-app-text-secondary mb-2">Current Phase</h4>
                  {phaseInfo?.currentPhase.type === 'NONE' && (
                    <p className="text-app-text-secondary text-sm">No active challenges</p>
                  )}
                  {phaseInfo?.currentPhase.type === 'ACTIVE' && (
                    <div className="text-app-text-secondary text-sm">
                      <p className="font-medium text-app-text">Active Phase: &quot;{phaseInfo.currentPhase.prompt}&quot;</p>
                      {phaseInfo.currentPhase.endTime && (
                        <p>Ends: {new Date(phaseInfo.currentPhase.endTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZoneName: 'short',
                        })}</p>
                      )}
                    </div>
                  )}
                  {phaseInfo?.currentPhase.type === 'VOTING' && (
                    <div className="text-app-text-secondary text-sm">
                      <p className="font-medium text-app-text">Voting Phase: &quot;{phaseInfo.currentPhase.prompt}&quot;</p>
                      {phaseInfo.currentPhase.endTime && (
                        <p>Ends: {new Date(phaseInfo.currentPhase.endTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZoneName: 'short',
                        })}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-orange-900 bg-opacity-20 rounded-lg p-4 mb-4 border border-orange-600 border-opacity-30">
                  <h4 className="font-medium text-orange-300 mb-2">Next Phase</h4>
                  <p className="text-orange-200 text-sm">
                    {phaseInfo?.nextPhase.type === 'VOTING' && `Will start voting for: "${phaseInfo.nextPhase.prompt}"`}
                    {phaseInfo?.nextPhase.type === 'COMPLETED' && `Will complete current challenge`}
                    {phaseInfo?.nextPhase.type === 'NEW_ACTIVE' && phaseInfo.nextPhase.prompt && `Will start new challenge: "${phaseInfo.nextPhase.prompt}"`}
                    {phaseInfo?.nextPhase.type === 'NEW_ACTIVE' && !phaseInfo.nextPhase.prompt && `No scheduled challenges available`}
                  </p>
                </div>

                <button
                  onClick={() => setShowTransitionModal(true)}
                  disabled={transitionPhaseMutation.isPending}
                  className="w-full sm:w-auto bg-[#b8860b] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#9a7209] focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {transitionPhaseMutation.isPending ? 'Transitioning...' : 'Transition to Next Phase'}
                </button>
              </div>

              {/* Danger Zone Section */}
              <div className="border-t border-app-border-dark pt-6">
                <h3 className="text-lg font-semibold text-app-text mb-2">Danger Zone</h3>
                <div className="bg-red-900 bg-opacity-20 rounded-lg p-4 mb-4 border border-red-600 border-opacity-30">
                  <p className="text-red-200 text-sm mb-2">
                    <strong>Warning:</strong> Deleting this league will permanently remove all league data
                  </p>
                  <p className="text-red-200 text-sm mt-3">
                    <strong>This action cannot be undone.</strong>
                  </p>
                </div>

                <button
                  onClick={() => setShowDeleteLeagueConfirm(true)}
                  disabled={deleteLeagueMutation.isPending}
                  className="w-full sm:w-auto bg-[#8b4444] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#7a3d3d] focus:outline-none focus:ring-2 focus:ring-[#8b4444] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {deleteLeagueMutation.isPending ? 'Deleting League...' : 'Delete League'}
                </button>
              </div>
            </div>
          )}

          {/* Leave League Section - Non-admins only */}
          {!isOwner && (
            <div className="bg-app-surface rounded-lg border border-app-border-dark p-4 sm:p-6 mt-6">
              <h2 className="text-lg sm:text-xl font-semibold text-app-text mb-4">Leave League</h2>
              <div className="bg-red-900 bg-opacity-20 rounded-lg p-4 mb-4 border border-red-600 border-opacity-30">
                <p className="text-red-200 text-sm mb-2">
                  <strong>Warning:</strong> Leaving this league will permanently remove all submitted content
                </p>
                <p className="text-red-200 text-sm mt-3">
                  This action cannot be undone.
                </p>
              </div>

              <button
                onClick={() => setShowLeaveConfirm(true)}
                disabled={leaveLeagueMutation.isPending}
                className="w-full sm:w-auto bg-[#8b4444] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#7a3d3d] focus:outline-none focus:ring-2 focus:ring-[#8b4444] focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {leaveLeagueMutation.isPending ? 'Leaving...' : 'Leave League'}
              </button>
            </div>
          )}
        </div>

        {/* Leave League Confirmation Modal */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-app-surface rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-app-text mb-4">Confirm Leave League</h3>
              
              <div className="mb-4">
                <p className="text-sm text-app-text-secondary mb-3">
                  Are you sure you want to leave <strong>{league?.name}</strong>?
                </p>
              </div>
              
              <p className="text-sm text-app-text-muted mb-6">
                This action cannot be undone.
              </p>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="px-4 py-2 text-app-text-secondary bg-app-surface-dark rounded-lg hover:bg-app-surface-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveLeague}
                  disabled={leaveLeagueMutation.isPending}
                  className="px-4 py-2 bg-[#8b4444] text-white rounded-lg hover:bg-[#7a3d3d] disabled:opacity-50 transition-colors"
                >
                  {leaveLeagueMutation.isPending ? 'Leaving...' : 'Leave League'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                  className="px-4 py-2 bg-[#b8860b] text-white rounded-lg hover:bg-[#9a7209] disabled:opacity-50 transition-colors"
                >
                  {transitionPhaseMutation.isPending ? 'Transitioning...' : 'Confirm Transition'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Challenge Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-app-surface rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-app-text mb-4">Delete Challenge</h3>
              
              <div className="mb-4">
                <p className="text-sm text-app-text-secondary mb-3">
                  Are you sure you want to delete this challenge?
                </p>
                <div className="bg-app-surface-dark p-3 rounded">
                  <p className="text-sm text-app-text break-words">{deleteConfirm.promptText}</p>
                </div>
              </div>
              
              <p className="text-sm text-app-text-muted mb-6">
                This action cannot be undone.
              </p>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-app-text-secondary bg-app-surface-dark rounded-lg hover:bg-app-surface-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePrompt(deleteConfirm.promptId)}
                  disabled={deletePromptMutation.isPending}
                  className="px-4 py-2 bg-[#8b4444] text-white rounded-lg hover:bg-[#7a3d3d] disabled:opacity-50 transition-colors"
                >
                  {deletePromptMutation.isPending ? 'Deleting...' : 'Delete Challenge'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete League Confirmation Modal */}
        {showDeleteLeagueConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-app-surface rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-app-text mb-4">Delete League</h3>
              
              <div className="mb-4">
                <p className="text-sm text-app-text-secondary mb-3">
                  Are you sure you want to permanently delete <strong className="text-app-text">{league?.name}</strong>?
                </p>
                
                <div className="bg-red-900 bg-opacity-20 rounded-lg p-4 mb-4 border border-red-600 border-opacity-30">
                  <p className="text-red-200 text-sm mb-2">
                    <strong>This will permanently delete:</strong>
                  </p>
                  <ul className="text-red-200 text-sm space-y-1 ml-4">
                    <li>• All challenges and submissions from {league?.memberCount} members</li>
                    <li>• All photos and voting data</li>
                    <li>• All league history and statistics</li>
                    <li>• League settings and configurations</li>
                  </ul>
                </div>
              </div>
              
              <p className="text-sm text-app-text-muted mb-6">
                <strong>This action cannot be undone.</strong> All data will be permanently removed from our servers.
              </p>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteLeagueConfirm(false)}
                  className="px-4 py-2 text-app-text-secondary bg-app-surface-dark rounded-lg hover:bg-app-surface-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLeague}
                  disabled={deleteLeagueMutation.isPending}
                  className="px-4 py-2 bg-[#8b4444] text-white rounded-lg hover:bg-[#7a3d3d] disabled:opacity-50 transition-colors"
                >
                  {deleteLeagueMutation.isPending ? 'Deleting League...' : 'Delete League'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DocumentPullToRefresh>
    </ErrorBoundary>
    </>
  );
}
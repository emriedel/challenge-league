'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { useCacheInvalidator } from '@/lib/cacheInvalidation';

interface WaitingToStartStateProps {
  league: {
    id: string;
    name: string;
    description: string;
    owner?: {
      id: string;
      username: string;
    };
  };
  isOwner: boolean;
}

export default function WaitingToStartState({ league, isOwner }: WaitingToStartStateProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const cacheInvalidator = useCacheInvalidator();

  const handleStartLeague = async () => {
    if (!isOwner) return;
    
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch(`/api/leagues/${league.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start league');
      }

      // Use enhanced cache invalidation with cross-tab broadcasting
      await cacheInvalidator.handleAdmin('startLeague', league.id);

      // Refresh the page to show the started state
      router.refresh();
    } catch (err) {
      console.error('Error starting league:', err);
      setError(err instanceof Error ? err.message : 'Failed to start league');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex justify-center p-6 pt-8">
      <div className="max-w-2xl w-full">
        {isOwner ? (
          <div className="bg-app-surface rounded-lg border border-app-border p-6">
            <div className="space-y-6">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-app-text mb-2">
                  {league.name}
                </h2>
              </div>
              <h3 className="text-lg font-semibold text-app-text text-center">
                What&apos;s next?
              </h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <span className="text-[#3a8e8c] font-bold text-lg">1.</span>
                  <p className="text-app-text-secondary text-sm">Invite other players to join your league<br /><em className="text-xs">Players can also join after the league starts</em></p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-[#3a8e8c] font-bold text-lg">2.</span>
                  <p className="text-app-text-secondary text-sm">Add or adjust Challenges in the League Settings page</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-[#3a8e8c] font-bold text-lg">3.</span>
                  <p className="text-app-text-secondary text-sm">Start the league when you&apos;re ready to kick off the first Challenge!</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleStartLeague}
                disabled={isStarting}
                data-testid="start-league-button"
                className={`
                  w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 mt-6
                  ${
                    isStarting
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-[#3a8e8c] hover:bg-[#2f7370] text-white shadow-lg'
                  }
                `}
              >
                {isStarting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting League...</span>
                  </div>
                ) : (
                  'Start League'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="space-y-3">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[#3a8e8c] rounded-full flex items-center justify-center">
                  <img src="/logo.png" alt="Challenge League" className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-app-text">
                Welcome to {league.name}!
              </h3>
              <p className="text-app-text-secondary text-base">
                You're all set! The league admin is preparing the first challenge.
              </p>
            </div>

            <div className="bg-app-surface-light rounded-lg p-5 space-y-4">
              <h4 className="text-sm font-semibold text-app-text uppercase tracking-wide">
                What to Expect
              </h4>
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-[#3a8e8c] flex-shrink-0">
                    <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-app-text text-sm font-medium">Weekly Challenges</p>
                    <p className="text-app-text-secondary text-xs">Submit photos to create the best response to the week's prompt</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-[#3a8e8c] flex-shrink-0">
                    <svg fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h4v7H4v-7zM10 8h4v12h-4V8zM16 16h4v4h-4v-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-app-text text-sm font-medium">Vote & Compete</p>
                    <p className="text-app-text-secondary text-xs">Vote on your favorite submissions and try to climb the leaderboard</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#3a8e8c]/10 border border-[#3a8e8c]/20 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 text-[#3a8e8c] flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-[#3a8e8c] text-sm">
                  Tip: Enable notifications to get one when the first challenge goes live!
                </p>
              </div>
            </div>

            {league.owner && (
              <p className="text-app-text-muted text-xs">
                League managed by <span className="text-app-text-secondary font-medium">@{league.owner.username}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
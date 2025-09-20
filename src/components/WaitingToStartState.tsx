'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

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

      // Invalidate relevant caches to force refetch of league data
      await queryClient.invalidateQueries({ queryKey: queryKeys.league(league.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.leaguePrompt(league.id) });
      
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
    <div className="min-h-screen bg-app-bg flex justify-center p-4 pt-16">
      <div className="max-w-2xl w-full">
        <div className="bg-app-surface rounded-lg border border-app-border p-6 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-app-text mb-2">
              {league.name}
            </h2>
            <p className="text-app-text-secondary">
              {league.description}
            </p>
          </div>

          {isOwner ? (
            <div className="space-y-4">
              <div className="bg-app-surface-dark rounded-lg p-4 border border-app-border-dark">
                <h3 className="text-lg font-semibold text-app-text mb-2">
                  Ready to Start Your League?
                </h3>
                <p className="text-app-text-secondary text-sm">
                  When you&apos;re ready, click the button below to begin the first creative challenge!
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleStartLeague}
                disabled={isStarting}
                data-testid="start-league-button"
                className={`
                  w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200
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
          ) : (
            <div className="space-y-4">
              <div className="bg-app-surface-dark rounded-lg p-4 border border-app-border-dark">
                <h3 className="text-lg font-semibold text-app-text mb-2">
                  Waiting for League to Start
                </h3>
                <p className="text-app-text-secondary text-sm">
                  This league hasn&apos;t started yet. The league owner ({league.owner?.username}) 
                  needs to start the first challenge.
                </p>
              </div>

              <div className="flex items-center justify-center text-app-text-muted">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-[#3a8e8c] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#3a8e8c] rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-[#3a8e8c] rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
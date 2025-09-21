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
    <div className="min-h-screen bg-app-bg flex justify-center p-4 pt-8">
      <div className="max-w-2xl w-full">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-app-text mb-2">
            {league.name}
          </h2>
        </div>
        <div className="bg-app-surface rounded-lg border border-app-border p-6">
          {isOwner ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-app-text text-center">
                What's next?
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
                  <p className="text-app-text-secondary text-sm">Start the league when you're ready to kick off the first Challenge!</p>
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
          ) : (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-semibold text-app-text mb-2">
                Waiting for League to Start
              </h3>
              <p className="text-app-text-secondary text-sm">
                This league is waiting for all players to join and the admin to start the league.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
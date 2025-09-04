'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-app-surface rounded-2xl border border-app-border p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-app-text mb-2">
              {league.name}
            </h2>
            <p className="text-app-text-secondary">
              {league.description}
            </p>
          </div>

          {isOwner ? (
            <div className="space-y-4">
              <div className="bg-app-surface-dark rounded-xl p-6 border border-app-border-dark">
                <h3 className="text-lg font-semibold text-app-text mb-2">
                  Ready to Start Your League?
                </h3>
                <p className="text-app-text-secondary text-sm mb-4">
                  Your league has been created and members can join using the invite code. 
                  When you&apos;re ready, click the button below to begin the first creative challenge!
                </p>
                <p className="text-app-text-muted text-xs mb-6">
                  Once started, your league will begin its first creative challenge and members 
                  can start submitting their responses.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleStartLeague}
                disabled={isStarting}
                className={`
                  w-full px-6 py-3 rounded-xl font-semibold transition-all duration-200
                  ${
                    isStarting
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25'
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
              <div className="bg-app-surface-dark rounded-xl p-6 border border-app-border-dark">
                <h3 className="text-lg font-semibold text-app-text mb-2">
                  Waiting for League to Start
                </h3>
                <p className="text-app-text-secondary text-sm mb-4">
                  This league hasn&apos;t started yet. The league owner ({league.owner?.username}) 
                  needs to start the first challenge.
                </p>
                <p className="text-app-text-muted text-xs">
                  You&apos;ll be notified when the league begins and you can start participating 
                  in creative challenges!
                </p>
              </div>

              <div className="flex items-center justify-center text-app-text-muted">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
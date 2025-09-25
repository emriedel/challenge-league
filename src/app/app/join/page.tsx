'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import LeagueAvatar from '@/components/LeagueAvatar';
import { useJoinLeagueByIdMutation } from '@/hooks/queries/useLeagueQuery';

interface League {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  owner: {
    id: string;
    username: string;
  };
  memberCount: number;
  createdAt: string;
  isStarted: boolean;
}

export default function JoinLeaguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Use the mutation hook for proper cache invalidation
  const joinMutation = useJoinLeagueByIdMutation();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/app/auth/signin');
      return;
    }
    
    // Load available leagues
    loadAvailableLeagues();
  }, [session, status, router]);

  const loadAvailableLeagues = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leagues/available');
      const data = await response.json();
      
      if (response.ok) {
        setAvailableLeagues(data.leagues);
      } else {
        setError(data.error || 'Failed to load available leagues');
      }
    } catch (err) {
      setError('Failed to load available leagues');
    } finally {
      setLoading(false);
    }
  };


  const handleOneClickJoin = async (leagueId: string) => {
    setError('');

    try {
      const data = await joinMutation.mutateAsync(leagueId);
      // Redirect to the joined league with joined flag
      router.push(`/app/league/${data.league.id}?joined=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-app-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app-bg px-4 pt-8 pb-20 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-app-text mb-2">
            Join a League
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Available Leagues */}
        <div className="mb-8">

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-app-text-muted">Loading leagues...</p>
            </div>
          ) : availableLeagues.length === 0 ? (
            <div className="text-center py-12 bg-app-surface rounded-xl border border-app-border">
              <p className="text-app-text-muted text-lg">No leagues available to join</p>
              <p className="text-app-text-muted text-sm mt-2">Create your own league to get started</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {availableLeagues.map((league) => (
                <div key={league.id} className="bg-app-surface rounded-xl border border-app-border p-6 hover:border-app-border-light transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <LeagueAvatar
                      leagueName={league.name}
                      leagueId={league.id}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-app-text text-lg">{league.name}</h3>
                        {!league.isStarted && (
                          <span className="text-xs bg-app-surface-light text-app-text-secondary border border-app-border-light px-2 py-1 rounded-full self-start">
                            Not Started
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-app-text-secondary text-sm mb-4">{league.description}</p>

                  <div className="flex justify-between items-center text-sm text-app-text-muted mb-4">
                    <span>by {league.owner.username}</span>
                    <span>{league.memberCount} members</span>
                  </div>
                  
                  <button
                    onClick={() => handleOneClickJoin(league.id)}
                    disabled={joinMutation.isPending}
                    className="w-full bg-[#3a8e8c] hover:bg-[#347a78] text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                  >
                    {joinMutation.isPending ? 'Joining...' : 'Join League'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-app-text-secondary hover:text-app-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
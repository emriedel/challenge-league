'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import LeagueAvatar from '@/components/LeagueAvatar';

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
  const [leagueId, setLeagueId] = useState('');
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showManualJoin, setShowManualJoin] = useState(false);

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

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueId.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: leagueId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join league');
      }

      // Redirect to the joined league with joined flag
      router.push(`/app/league/${data.league.id}?joined=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOneClickJoin = async (leagueId: string) => {
    setLoadingJoin(leagueId);
    setError('');

    try {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join league');
      }

      // Redirect to the joined league with joined flag
      router.push(`/app/league/${data.league.id}?joined=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingJoin(null);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-app-surface-dark rounded-full p-3 shadow-lg mb-4">
            <Image
              src="/logo.png"
              alt="Challenge League"
              width={48}
              height={48}
              className="rounded-full"
              priority
            />
          </div>
          <h1 className={`${rubik.className} text-2xl sm:text-3xl font-semibold text-app-text text-center`}>
            Join a League
          </h1>
          <p className="text-app-text-secondary mt-2 text-center max-w-md">
            Choose from available leagues or enter a league ID to join
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Available Leagues */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-app-text">Available Leagues</h2>
            <button
              onClick={() => setShowManualJoin(!showManualJoin)}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              {showManualJoin ? 'Hide' : 'Join by ID'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-app-text-muted">Loading leagues...</p>
            </div>
          ) : availableLeagues.length === 0 ? (
            <div className="text-center py-8 bg-app-surface rounded-xl border border-app-border">
              <p className="text-app-text-muted">No leagues available to join</p>
              <p className="text-app-text-muted text-sm mt-2">Ask friends for a league ID or create your own league</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableLeagues.map((league) => (
                <div key={league.id} className="bg-app-surface rounded-xl border border-app-border p-6 hover:border-app-border-light transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <LeagueAvatar
                      leagueName={league.name}
                      leagueId={league.id}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-app-text text-lg truncate">{league.name}</h3>
                        {!league.isStarted && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full whitespace-nowrap">
                            Not Started
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-app-text-secondary text-sm mb-4 line-clamp-2">{league.description}</p>
                  
                  <div className="flex justify-between items-center text-xs text-app-text-muted mb-4">
                    <span>by {league.owner.username}</span>
                    <span>{league.memberCount} members</span>
                  </div>
                  
                  <button
                    onClick={() => handleOneClickJoin(league.id)}
                    disabled={loadingJoin === league.id}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {loadingJoin === league.id ? 'Joining...' : 'Join League'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Join Form */}
        {showManualJoin && (
          <div className="max-w-md mx-auto bg-app-surface py-6 px-6 shadow-xl rounded-xl border border-app-border">
            <h3 className="text-lg font-semibold text-app-text mb-4 text-center">Join by League ID</h3>
            <form onSubmit={handleJoinLeague} className="space-y-4">
              <div>
                <label htmlFor="leagueId" className="block text-sm font-medium text-app-text-secondary mb-2">
                  League ID
                </label>
                <input
                  id="leagueId"
                  type="text"
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  className="w-full px-3 py-2 bg-app-surface-dark border border-app-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-app-text placeholder-app-text-muted"
                  placeholder="Enter league ID"
                  required
                />
                <p className="text-xs text-app-text-muted mt-2">
                  Ask the league owner for the league ID
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !leagueId.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-semibold disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join League'}
              </button>
            </form>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            href="/app"
            className="inline-flex items-center text-app-text-secondary hover:text-app-text transition-colors font-medium"
          >
            ← Back to My Leagues
          </Link>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import type { League } from '@/types/league';
import { CONTENT_LIMITS } from '@/constants/app';

export default function JoinLeaguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    league: League;
  } | null>(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        // Fetch all public leagues and user's current leagues
        const [allLeaguesRes, userLeaguesRes] = await Promise.all([
          fetch('/api/leagues/public'),
          fetch('/api/leagues')
        ]);

        if (allLeaguesRes.ok) {
          const allLeaguesData = await allLeaguesRes.json();
          setAvailableLeagues(allLeaguesData.leagues || []);
        }

        if (userLeaguesRes.ok) {
          const userLeaguesData = await userLeaguesRes.json();
          setUserLeagues(userLeaguesData.leagues || []);
        }
      } catch (err) {
        console.error('Failed to fetch leagues:', err);
        setError('Failed to load leagues');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchLeagues();
    }
  }, [status]);

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

  if (status === 'unauthenticated') {
    router.push('/app/auth/signin');
    return null;
  }

  const handleJoinLeague = async (leagueId: string) => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leagueId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join league');
      }

      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out leagues the user is already a member of
  const joinableLeagues = availableLeagues.filter(
    league => !userLeagues.some(userLeague => userLeague.id === league.id)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-app-text-muted">Loading leagues...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">

          {/* Success Card */}
          <div className="bg-app-surface py-6 sm:py-8 px-6 shadow-xl rounded-xl border border-app-border">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-app-text mb-2">
                Welcome to {success.league.name}!
              </h2>
              <p className="text-app-text-secondary text-sm mb-6">
                You can now participate in challenges and compete with other members
              </p>

              <div className="bg-app-surface-dark rounded-xl p-4 mb-6 text-left">
                <div className="text-sm text-app-text-secondary space-y-1">
                  <p><span className="text-app-text font-medium">League:</span> {success.league.name}</p>
                  <p><span className="text-app-text font-medium">Owner:</span> @{success.league.owner?.username || 'Unknown'}</p>
                  <p><span className="text-app-text font-medium">Members:</span> {success.league.memberCount}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/app/league/${success.league.id}`}
                  className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 font-semibold"
                >
                  Go to League Dashboard
                </Link>
                <Link
                  href="/app"
                  className="w-full flex justify-center py-2.5 sm:py-3 px-4 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light transition-all duration-200 font-medium"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-8 pb-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-app-text mb-2">
            Join a League
          </h1>
          <p className="text-app-text-secondary">
            Browse and join any public league to start competing
          </p>
        </div>

        {error && (
          <div className="bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Available Leagues */}
        {joinableLeagues.length > 0 ? (
          <div className="grid gap-4 sm:gap-6">
            {joinableLeagues.map((league) => (
              <div
                key={league.id}
                className="bg-app-surface border border-app-border rounded-xl p-6 hover:border-app-border-light transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-app-text mb-2">
                      {league.name}
                    </h3>
                    {league.description && (
                      <p className="text-app-text-secondary text-sm mb-3">
                        {league.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-app-text-muted">
                      <span>{league.memberCount} members</span>
                      {league.owner && (
                        <span>Owner: @{league.owner.username}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleJoinLeague(league.id)}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Joining...' : 'Join League'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-app-surface border border-app-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-app-surface-dark rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-app-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-app-text mb-2">
              No leagues available
            </h3>
            <p className="text-app-text-secondary mb-4">
              There are no public leagues available to join right now, or you&apos;re already a member of all available leagues.
            </p>
            <Link
              href="/app/leagues/new"
              className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Create Your Own League
            </Link>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            href="/app"
            className="block sm:inline-block px-6 py-2.5 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light transition-all duration-200 font-medium"
          >
            Back to Home
          </Link>
          <Link
            href="/app/leagues/new"
            className="block sm:inline-block px-6 py-2.5 text-blue-600 hover:text-blue-500 font-medium transition-colors"
          >
            Create Your Own League →
          </Link>
        </div>
      </div>
    </div>
  );
}
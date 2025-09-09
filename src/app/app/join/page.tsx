'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';

export default function JoinLeaguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leagueId, setLeagueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/app/auth/signin');
    }
  }, [session, status, router]);

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

      // Redirect to the joined league
      router.push(`/app/league/${data.league.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-6">
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
        </div>

        {/* Join Form */}
        <div className="bg-app-surface py-8 px-6 shadow-xl rounded-xl border border-app-border">
          <form onSubmit={handleJoinLeague} className="space-y-6">
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
                Ask the league owner for the league ID to join
              </p>
            </div>

            {error && (
              <div className="bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading || !leagueId.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 font-semibold disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join League'}
              </button>
              
              <Link
                href="/app"
                className="w-full flex justify-center py-3 px-4 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light transition-all duration-200 font-medium"
              >
                Back to Leagues
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
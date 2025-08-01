'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { League } from '@/types/league';


export default function LeaguesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchLeagues();
    }
  }, [status, router]);

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/leagues');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leagues');
      }

      setLeagues(data.leagues || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = (inviteCode: string) => {
    navigator.clipboard.writeText(inviteCode);
    // Could add a toast notification here
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Leagues</h1>
        <p className="text-gray-600">
          Manage your league memberships and create new competitions.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Leagues ({leagues.length})
        </h2>
        <div className="space-x-3">
          <Link
            href="/leagues/join"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
          >
            Join League
          </Link>
          <Link
            href="/leagues/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Create League
          </Link>
        </div>
      </div>

      {leagues.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No leagues yet
          </h3>
          <p className="text-gray-600 mb-6">
            Join an existing league or create your own to start competing in creative challenges.
          </p>
          <div className="space-x-3">
            <Link
              href="/leagues/join"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Join League
            </Link>
            <Link
              href="/leagues/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create League
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {leagues.map((league) => (
            <div
              key={league.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {league.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {league.memberCount} member{league.memberCount !== 1 ? 's' : ''} • 
                    Owner: {league.owner?.username || 'Unknown'}
                  </p>
                </div>
                {league.isOwner && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Owner
                  </span>
                )}
              </div>

              {league.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {league.description}
                </p>
              )}

              <div className="space-y-3">
                <Link
                  href={`/league/${league.id}`}
                  className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-center text-sm"
                >
                  View League
                </Link>

                {league.isOwner && league.inviteCode && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Invite Code:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {league.inviteCode}
                    </code>
                    <button
                      onClick={() => copyInviteCode(league.inviteCode!)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Copy invite code"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
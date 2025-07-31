'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface League {
  id: string;
  name: string;
  slug: string;
  description?: string;
  memberCount: number;
  isOwner: boolean;
  owner: {
    username: string;
  };
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeagues = useCallback(async () => {
    try {
      const response = await fetch('/api/leagues');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leagues');
      }

      const userLeagues = data.leagues || [];
      setLeagues(userLeagues);

      // Auto-redirect logic based on league count
      if (userLeagues.length === 0) {
        // No leagues - stay on home page to show league creation/joining options
        setLoading(false);
      } else if (userLeagues.length === 1) {
        // Single league - auto-redirect
        router.push(`/league/${userLeagues[0].slug}`);
      } else {
        // Multiple leagues - show selection dashboard
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Fetch user's leagues
    fetchLeagues();
  }, [session, status, router, fetchLeagues]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your leagues...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  // Show league selection dashboard for users with multiple leagues or no leagues
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Challenge League!</h1>
        <p className="text-xl text-gray-600">Submit photos to win challenges against your friends</p>
      </div>

      {leagues.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm4 14a6 6 0 006-6V4a2 2 0 00-2-2H6a2 2 0 00-2 2v6a6 6 0 006 6z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join creative competition leagues to compete in weekly challenges with friends, family, or communities. 
            Submit photos, vote on submissions, and climb the leaderboards!
          </p>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/leagues/join"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-center"
              >
                Join a League
              </Link>
              <Link
                href="/leagues/new"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center"
              >
                Create a League
              </Link>
            </div>
            <Link
              href="/how-it-works"
              className="inline-block text-blue-600 hover:text-blue-800 text-sm"
            >
              Learn how it works →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Leagues</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {leagues.map((league) => (
                <div
                  key={league.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {league.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {league.memberCount} member{league.memberCount !== 1 ? 's' : ''} • 
                        Owner: @{league.owner.username}
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

                  <Link
                    href={`/league/${league.id}`}
                    className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-center"
                  >
                    Enter League
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="space-x-4">
              <Link
                href="/leagues/join"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Join A League
              </Link>
              <Link
                href="/leagues/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create New League
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
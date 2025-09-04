'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import type { League } from '@/types/league';


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
        router.push(`/league/${userLeagues[0].id}`);
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
      <div className="min-h-screen bg-app-bg flex flex-col justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-app-text-muted">Loading your leagues...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col justify-center px-4">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-app-error-bg border border-app-error text-app-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Show league selection dashboard for users with multiple leagues or no leagues
  return (
    <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {leagues.length === 0 && (
          <>
            {/* Logo and Brand */}
            <div className="flex flex-col items-center mb-3 sm:mb-6">
              <div className="bg-app-surface-dark rounded-full p-2 sm:p-3 shadow-lg mb-3 sm:mb-4">
                <Image
                  src="/logo.png"
                  alt="Challenge League"
                  width={48}
                  height={48}
                  className="rounded-full sm:w-16 sm:h-16"
                  priority
                />
              </div>
              <h1 className={`${rubik.className} text-2xl sm:text-3xl font-semibold text-app-text text-center`}>
                Challenge League
              </h1>
            </div>

            {/* Welcome Card */}
            <div className="bg-app-surface py-6 sm:py-8 px-6 shadow-xl rounded-xl border border-app-border">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-app-text mb-2">Welcome!</h2>
                <p className="text-app-text-secondary text-sm">
                  Join creative competitions with friends
                </p>
              </div>

              {/* How it Works Section */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-app-text text-center mb-4">How it Works</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-app-text">1. Submit Photos</h4>
                      <p className="text-xs text-app-text-secondary mt-1">Complete creative challenges by submitting photos during the weekly submission phase</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-app-text">2. Vote on Favorites</h4>
                      <p className="text-xs text-app-text-secondary mt-1">Vote for your favorite submissions during the voting phase to determine winners</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-app-text">3. Climb the Leaderboard</h4>
                      <p className="text-xs text-app-text-secondary mt-1">Earn points and compete with friends to see who wins the most challenges</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Link
                    href="/leagues/join"
                    className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 font-semibold"
                  >
                    Join a League
                  </Link>
                  <Link
                    href="/leagues/new"
                    className="w-full flex justify-center py-2.5 sm:py-3 px-4 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light transition-all duration-200 font-medium"
                  >
                    Create a League
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
        
        {leagues.length > 0 && (
          <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-app-text mb-4">Your Leagues</h1>
              <p className="text-xl text-app-text-secondary">Choose a league to continue</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {leagues.map((league) => (
                <div
                  key={league.id}
                  className="bg-app-surface border border-app-border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-app-text mb-2">
                        {league.name}
                      </h3>
                      <p className="text-sm text-app-text-muted mb-2">
                        {league.memberCount} member{league.memberCount !== 1 ? 's' : ''} • 
                        Owner: @{league.owner?.username || 'Unknown'}
                      </p>
                    </div>
                    {league.isOwner && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Owner
                      </span>
                    )}
                  </div>

                  {league.description && (
                    <p className="text-app-text-secondary text-sm mb-4 line-clamp-2">
                      {league.description}
                    </p>
                  )}

                  <Link
                    href={`/league/${league.id}`}
                    className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-center font-semibold transition-all duration-200"
                  >
                    Enter League
                  </Link>
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/leagues/join"
                  className="block w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                >
                  Join A League
                </Link>
                <Link
                  href="/leagues/new"
                  className="block w-full sm:w-auto bg-app-surface-dark text-app-text-secondary hover:bg-app-surface-light px-4 py-2 rounded-xl font-medium transition-all duration-200"
                >
                  Create New League
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
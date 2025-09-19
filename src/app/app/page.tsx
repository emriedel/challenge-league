'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useLeagueActions } from '@/hooks/useLeagueActions';
import OnboardingModal from '@/components/OnboardingModal';
import NotificationDot from '@/components/NotificationDot';
import type { League } from '@/types/league';


export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');

  // Handle onboarding for new users
  const {
    showOnboarding,
    isNewUserFlow,
    markOnboardingComplete,
    closeOnboarding,
  } = useOnboarding();

  // Use new hook to fetch leagues with action status
  const { leagues, loading, error: leagueError } = useLeagueActions();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/app/auth/signin');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (leagueError) {
      setError(leagueError);
    }
  }, [leagueError]);

  // Redirect to single league immediately if user has exactly one league
  useEffect(() => {
    if (!loading && leagues.length === 1) {
      router.push(`/app/league/${leagues[0].id}`);
    }
  }, [loading, leagues, router]);

  // Show loading while fetching leagues or redirecting to single league
  if (status === 'loading' || loading || (!loading && leagues.length === 1)) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-app-text-muted">
            {leagues.length === 1 ? 'Entering your league...' : 'Loading your leagues...'}
          </p>
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
  // (Single league users are redirected above)
  return (
    <>
      <div className="min-h-screen bg-app-bg flex flex-col px-4 pt-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {leagues.length === 0 && (
            <>
              {/* Logo and Brand */}
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <div className="bg-app-surface-dark rounded-full p-3 sm:p-4 shadow-lg mb-4">
                  <Image
                    src="/logo.png"
                    alt="Challenge League"
                    width={64}
                    height={64}
                    className="rounded-full"
                    priority
                  />
                </div>
                <h1 className={`${rubik.className} text-3xl sm:text-4xl font-semibold text-app-text text-center`}>
                  Challenge League
                </h1>
                <p className="text-app-text-secondary text-lg mt-2">
                  Join creative competitions with friends
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Link
                  href="/app/join"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 font-semibold text-lg"
                >
                  Join a League
                </Link>
                <Link
                  href="/app/new"
                  className="w-full flex justify-center py-3 px-4 text-app-text-secondary bg-app-surface-dark rounded-xl hover:bg-app-surface-light transition-all duration-200 font-medium text-lg"
                >
                  Create a League
                </Link>
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
                    className="bg-app-surface border border-app-border rounded-lg p-6 hover:shadow-md transition-shadow relative"
                  >
                    {league.needsAction && (
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-red-400 font-medium">
                          {league.actionType === 'submission' ? 'Submit Required' : 'Vote Required'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-app-text">
                            {league.name}
                          </h3>
                          {league.needsAction && (
                            <NotificationDot show={true} size="md" className="relative top-0 right-0" />
                          )}
                        </div>
                        <p className="text-sm text-app-text-muted mb-2">
                          Owner: @{league.owner?.username || 'Unknown'}
                        </p>
                      </div>
                      {league.isOwner && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
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
                      href={`/app/league/${league.id}`}
                      className={`block w-full px-4 py-2 rounded-xl text-center font-semibold transition-all duration-200 ${
                        league.needsAction
                          ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                      }`}
                    >
                      {league.needsAction ? 'Action Required' : 'Enter League'}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                  <Link
                    href="/app/join"
                    className="block w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                  >
                    Join A League
                  </Link>
                  <Link
                    href="/app/new"
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
      
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={closeOnboarding}
        onComplete={markOnboardingComplete}
        isNewUserFlow={isNewUserFlow}
      />
    </>
  );
}
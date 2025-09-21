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
import LeagueAvatar from '@/components/LeagueAvatar';

export default function AppHomeClient() {
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

  // Auto-redirect if user ends up with exactly one league
  useEffect(() => {
    if (!loading && leagues.length === 1) {
      router.push(`/app/league/${leagues[0].id}`);
    }
  }, [loading, leagues, router]);

  // Show loading while fetching data
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

  return (
    <>
      <div className="min-h-screen bg-app-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {leagues.length === 0 ? (
            /* Welcome State - No Leagues */
            <div className="max-w-2xl mx-auto text-center py-6">
              {/* Header */}
              <div className="mb-8">
                <h1 className={`${rubik.className} text-3xl sm:text-4xl font-bold text-app-text mb-6`}>
                  Welcome to<br/>Challenge League!
                </h1>
                <p className="text-app-text-secondary text-md">
                  Join or create a league to start challenging friends
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Link
                  href="/app/new"
                  data-testid="create-league-button-welcome"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border border-app-border rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create League
                </Link>
                <Link
                  href="/app/join"
                  data-testid="join-league-button-welcome"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border border-app-border rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join League
                </Link>
              </div>
            </div>
          ) : (
            /* League Dashboard */
            <div className="overflow-hidden">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className={`${rubik.className} text-3xl sm:text-4xl font-bold text-app-text mb-2`}>
                  Your Leagues
                </h1>
              </div>

              {/* Leagues Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {leagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/app/league/${league.id}`}
                    className="block bg-app-surface border border-app-border rounded-lg hover:border-app-border-light transition-colors group"
                  >
                    <div className="p-4 sm:p-6 w-full">
                      {/* League Header */}
                      <div className="flex items-center gap-3">
                        <LeagueAvatar
                          leagueName={league.name}
                          leagueId={league.id}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-app-text truncate mb-2">
                            {league.name}
                          </h3>

                          {/* League Status - combines phase info and action status */}
                          {league.currentPrompt && (
                            <div className="flex items-center gap-2 text-sm break-words mb-2">
                              <span className="text-app-text-secondary">
                                Challenge #{league.currentPrompt.challengeNumber} •
                              </span>
                              {league.needsAction ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-red-400 font-medium">
                                    {league.actionType === 'submission' ? 'Submit now!' : 'Vote now!'}
                                  </span>
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                </div>
                              ) : (
                                <span className="text-app-text-secondary">
                                  {league.currentPrompt.status === 'ACTIVE' ? 'Submissions Open' : 'Voting Open'}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Phase End Time */}
                          {league.currentPrompt?.phaseEndsAt && (
                            <div className="flex items-center gap-1 text-sm text-app-text-muted">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>
                                {new Date(league.currentPrompt.phaseEndsAt).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  timeZoneName: 'short'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Link
                  href="/app/new"
                  data-testid="create-league-button-dashboard"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border border-app-border rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create League
                </Link>
                <Link
                  href="/app/join"
                  data-testid="join-league-button-dashboard"
                  className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border border-app-border rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join League
                </Link>
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
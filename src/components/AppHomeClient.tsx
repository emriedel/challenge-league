'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { rubik } from '@/lib/fonts';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useLeagueActionsQuery } from '@/hooks/queries';
import { useJoinLeagueByIdMutation } from '@/hooks/queries/useLeagueQuery';
import OnboardingModal from '@/components/OnboardingModal';
import LeagueAvatar from '@/components/LeagueAvatar';

interface AvailableLeague {
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

export default function AppHomeClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');
  const [topLeagues, setTopLeagues] = useState<AvailableLeague[]>([]);
  const [loadingTopLeagues, setLoadingTopLeagues] = useState(false);

  // Handle onboarding for new users
  const {
    showOnboarding,
    isNewUserFlow,
    markOnboardingComplete,
    closeOnboarding,
  } = useOnboarding();

  // Use new React Query hook to fetch leagues with action status
  const { leagues, loading, error: leagueError } = useLeagueActionsQuery();

  // Use the mutation hook for joining leagues
  const joinMutation = useJoinLeagueByIdMutation();

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

  // Load top 3 leagues when user has no leagues
  useEffect(() => {
    if (!loading && leagues.length === 0 && session) {
      loadTopLeagues();
    }
  }, [loading, leagues, session]);

  const loadTopLeagues = async () => {
    setLoadingTopLeagues(true);
    try {
      const response = await fetch('/api/leagues/available');
      const data = await response.json();

      if (response.ok) {
        // Get only top 3 leagues
        setTopLeagues(data.leagues.slice(0, 3));
      } else {
        console.error('Failed to load top leagues:', data.error);
      }
    } catch (err) {
      console.error('Failed to load top leagues:', err);
    } finally {
      setLoadingTopLeagues(false);
    }
  };

  const handleJoinLeague = async (leagueId: string) => {
    setError('');

    try {
      const data = await joinMutation.mutateAsync(leagueId);
      // Redirect to the joined league with joined flag
      router.push(`/app/league/${data.league.id}?joined=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          {leagues.length === 0 ? (
            /* Welcome State - No Leagues */
            <div className="max-w-4xl mx-auto text-center py-2">
              {/* Header */}
              <div className="mb-8">
                <h1 className={`${rubik.className} text-3xl sm:text-4xl font-bold text-app-text mb-6`}>
                  Welcome to<br/>Challenge League!
                </h1>
                <p className="text-app-text-secondary text-md">
                  Join one of these popular leagues or create your own
                </p>
              </div>

              {/* Top Leagues */}
              {loadingTopLeagues ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-app-text-muted">Loading popular leagues...</p>
                </div>
              ) : topLeagues.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                  {topLeagues.map((league) => (
                    <div key={league.id} className="bg-app-surface rounded-xl border border-app-border p-6 hover:border-app-border-light transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <LeagueAvatar
                          leagueName={league.name}
                          leagueId={league.id}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-app-text text-lg text-left">{league.name}</h3>
                            {!league.isStarted && (
                              <span className="text-xs bg-app-surface-light text-app-text-secondary border border-app-border-light px-2 py-1 rounded-full self-start">
                                Not Started
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-app-text-secondary text-sm mb-4 text-left">{league.description}</p>

                      <div className="flex justify-between items-center text-sm text-app-text-muted mb-4">
                        <span>by {league.owner.username}</span>
                        <span>{league.memberCount} members</span>
                      </div>

                      <button
                        onClick={() => handleJoinLeague(league.id)}
                        disabled={joinMutation.isPending}
                        className="w-full bg-[#3a8e8c] hover:bg-[#347a78] text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                      >
                        {joinMutation.isPending ? 'Joining...' : 'Join League'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
                {topLeagues.length > 0 && (
                  <Link
                    href="/app/join"
                    data-testid="see-all-leagues-button"
                    className="flex items-center justify-center gap-2 px-6 py-4 text-lg font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border border-app-border rounded-lg transition-colors w-full"
                  >
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    See all Leagues
                  </Link>
                )}
                <Link
                  href="/app/new"
                  data-testid="create-league-button-welcome"
                  className="flex items-center justify-center gap-2 px-6 py-4 text-lg font-medium text-app-text-secondary bg-app-surface hover:bg-app-surface-light border border-app-border rounded-lg transition-colors w-full"
                >
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create League
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8 items-start">
                {leagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/app/league/${league.id}`}
                    className="flex flex-col bg-app-surface border border-app-border rounded-lg hover:border-app-border-light transition-colors group h-full"
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
                          <h3
                            className="text-lg font-semibold text-app-text truncate mb-2"
                            title={league.name}
                          >
                            {league.name}
                          </h3>

                          {/* League Status - show not started state or current challenge info */}
                          {league.isStarted === false ? (
                            <div className="flex items-center gap-2 text-sm break-words mb-2">
                              {league.isOwner ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-amber-400 font-medium">Not Started</span>
                                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                </div>
                              ) : (
                                <span className="text-app-text-muted">Not Started</span>
                              )}
                            </div>
                          ) : league.currentPrompt ? (
                            <>
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

                              {/* Phase End Time */}
                              {league.currentPrompt.phaseEndsAt && (
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
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex gap-3 justify-center">
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
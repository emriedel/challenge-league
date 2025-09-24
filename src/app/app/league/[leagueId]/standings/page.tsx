'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import { useLeagueStandingsQuery } from '@/hooks/queries';
import { useStandingsCacheListener } from '@/hooks/useCacheEventListener';
import { useCacheInvalidator } from '@/lib/cacheInvalidation';
import { useNavigationRefreshHandlers } from '@/lib/navigationRefresh';
import DocumentPullToRefresh from '@/components/DocumentPullToRefresh';
import LeagueNavigation from '@/components/LeagueNavigation';
import ProfileAvatar from '@/components/ProfileAvatar';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorFallback from '@/components/PageErrorFallback';
import { SkeletonLeaderboard } from '@/components/LoadingSkeleton';
import { NoMembersEmptyState } from '@/components/EmptyState';
import MedalIcon from '@/components/MedalIcon';

// Ranking display for standings
const getRankIcon = (rank: number) => {
  if (rank >= 1 && rank <= 3) {
    return <MedalIcon place={rank as 1 | 2 | 3} size="md" />;
  }
  return `#${rank}`;
};

// Get background color for podium positions
const getRowBackgroundClass = (rank: number, isCurrentUser: boolean) => {
  const baseClass = isCurrentUser ? 'bg-app-surface-light' : '';

  switch (rank) {
    case 1:
      return `${baseClass} bg-gradient-to-r from-yellow-900/20 to-transparent`;
    case 2:
      return `${baseClass} bg-gradient-to-r from-gray-700/20 to-transparent`;
    case 3:
      return `${baseClass} bg-gradient-to-r from-yellow-800/20 to-transparent`;
    default:
      return baseClass;
  }
};

interface StandingPageProps {
  params: { leagueId: string };
}

export default function StandingPage({ params }: StandingPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useLeagueStandingsQuery(params.leagueId);
  const cacheInvalidator = useCacheInvalidator();

  // Listen for cache events to keep standings synchronized
  useStandingsCacheListener(params.leagueId);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await cacheInvalidator.refreshLeague(params.leagueId);
  }, [cacheInvalidator, params.leagueId]);

  // Navigation refresh handlers
  const handleScrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const handleNavigationRefresh = useCallback(async () => {
    await handleRefresh();
  }, [handleRefresh]);

  useNavigationRefreshHandlers('standings', handleScrollToTop, handleNavigationRefresh);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/app/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading' || leagueLoading) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Loading..." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonLeaderboard />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (leagueError) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Error" />
        <PageErrorFallback 
          title="Standings Error"
          description={leagueError instanceof Error ? leagueError.message : leagueError || 'An error occurred'}
          resetError={() => window.location.reload()}
        />
      </div>
    );
  }

  const league = leagueData?.league;
  const standings = leagueData?.leaderboard || [];

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex flex-col h-screen">
          <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
          <div className="flex-1 flex items-center justify-center">
            <PageErrorFallback
              error={error}
              resetError={resetError}
              title="Standings Page Error"
              description="The standings page encountered an error. Please try again."
            />
          </div>
        </div>
      )}
    >
      <DocumentPullToRefresh onRefresh={handleRefresh}>
        <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
          <h1 className="text-2xl sm:text-3xl font-bold text-app-text mb-4 text-center">League Standings</h1>


        <div className="bg-app-surface border border-app-border rounded-lg overflow-hidden">
          {standings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <tbody className="bg-app-surface divide-y divide-app-border">
                  {standings.map((entry, index) => {
                    const isCurrentUser = entry.user.username === session.user.username;
                    const rankIcon = getRankIcon(entry.stats.leagueRank);

                    return (
                      <tr
                        key={entry.user.id}
                        className={getRowBackgroundClass(entry.stats.leagueRank, isCurrentUser)}
                      >
                        <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-center w-12">
                          <div className="flex justify-center items-center min-h-[24px]">
                            {typeof rankIcon === 'string' ? (
                              <span className="text-app-text-secondary">
                                {rankIcon}
                              </span>
                            ) : (
                              <div className="flex justify-center items-center w-6">
                                {rankIcon}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-app-text">
                          <div className="flex items-center space-x-2 min-w-0">
                            <ProfileAvatar
                              username={entry.user.username}
                              profilePhoto={entry.user.profilePhoto}
                              size="sm"
                            />
                            <span
                              className={`truncate max-w-[120px] sm:max-w-[200px] md:max-w-none ${
                                isCurrentUser ? 'font-bold' : ''
                              }`}
                              title={entry.user.username}
                            >
                              {entry.user.username}
                            </span>
                          </div>
                        </td>
                      <td className={`px-3 py-4 whitespace-nowrap text-sm text-app-text font-medium text-center ${
                        isCurrentUser ? 'font-bold' : ''
                      }`}>
                        {entry.stats.totalVotes}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm text-app-text text-center">
                        {entry.stats.wins}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm text-app-text text-center">
                        {entry.stats.totalSubmissions}
                      </td>
                        <td className="hidden lg:table-cell px-3 py-4 whitespace-nowrap text-sm text-app-text text-center">
                          {entry.stats.votingParticipation}/{entry.stats.totalCompletedRounds}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <NoMembersEmptyState />
            </div>
          )}
        </div>
        </div>
      </DocumentPullToRefresh>
    </ErrorBoundary>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLeagueStandingsQuery } from '@/hooks/queries';
import LeagueNavigation from '@/components/LeagueNavigation';
import ProfileAvatar from '@/components/ProfileAvatar';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageErrorFallback from '@/components/PageErrorFallback';
import { SkeletonLeaderboard } from '@/components/LoadingSkeleton';
import { NoMembersEmptyState } from '@/components/EmptyState';

// Ranking display for standings
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return '#1';
    case 2:
      return '#2';
    case 3:
      return '#3';
    default:
      return `#${rank}`;
  }
};

interface StandingPageProps {
  params: { leagueId: string };
}

export default function StandingPage({ params }: StandingPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useLeagueStandingsQuery(params.leagueId);

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
        <div>
          <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
          <PageErrorFallback 
            error={error}
            resetError={resetError}
            title="Standings Page Error"
            description="The standings page encountered an error. Please try again."
          />
        </div>
      )}
    >
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-semibold text-app-text mb-6 text-center">League Standings</h2>
          
        <div className="bg-app-surface border border-app-border rounded-lg overflow-hidden">
          {standings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-app-border">
                <tbody className="bg-app-surface divide-y divide-app-border">
                  {standings.map((entry, index) => (
                    <tr 
                      key={entry.user.id}
                      className={entry.user.username === session.user.username ? 'bg-app-surface-light' : ''}
                    >
                      <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-center w-12">
                        <span className="text-app-text-secondary">
                          {getRankIcon(entry.stats.leagueRank)}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-app-text">
                        <div className="flex items-center space-x-2">
                          <ProfileAvatar 
                            username={entry.user.username}
                            profilePhoto={entry.user.profilePhoto}
                            size="sm"
                          />
                          <span className="truncate">{entry.user.username}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-app-text font-medium">
                        {entry.stats.totalVotes}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm text-app-text">
                        {entry.stats.wins}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm text-app-text">
                        {entry.stats.totalSubmissions}
                      </td>
                    </tr>
                  ))}
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
      </div>
    </ErrorBoundary>
  );
}
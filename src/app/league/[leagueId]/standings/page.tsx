'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLeague } from '@/hooks/useLeague';
import LeagueNavigation from '@/components/LeagueNavigation';
import ProfileAvatar from '@/components/ProfileAvatar';

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
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useLeague(params.leagueId);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading' || leagueLoading) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Loading..." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading standings...</p>
          </div>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
            <p className="text-red-700">{leagueError}</p>
          </div>
        </div>
      </div>
    );
  }

  const league = leagueData?.league;
  const standings = leagueData?.leaderboard || [];

  return (
    <div>
      <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-semibold">League Standings</h2>
          </div>
          
          {standings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenges</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {standings.map((entry, index) => (
                    <tr 
                      key={entry.user.id}
                      className={entry.user.username === session.user.username ? 'bg-blue-50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="flex items-center gap-2">
                          {getRankIcon(entry.stats.leagueRank)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-3">
                          <ProfileAvatar 
                            username={entry.user.username}
                            profilePhoto={entry.user.profilePhoto}
                            size="sm"
                          />
                          <span>{entry.user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {entry.stats.totalPoints}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.stats.wins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.stats.totalSubmissions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Yet</h3>
              <p className="text-gray-500">The standings will populate as players join and compete.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
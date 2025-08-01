'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGallery } from '@/hooks/useGallery';
import { useLeague } from '@/hooks/useLeague';
import LeagueNavigation from '@/components/LeagueNavigation';
import Image from 'next/image';
import ProfileAvatar from '@/components/ProfileAvatar';

// Ranking display for results
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

interface ResultsPageProps {
  params: { leagueId: string };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading } = useLeague(params.leagueId);
  const { data: galleryData, isLoading: galleryLoading, error: galleryError } = useGallery(params.leagueId);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading' || leagueLoading || galleryLoading) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Loading..." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const league = leagueData?.league;

  return (
    <div>
      <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {galleryData?.rounds && galleryData.rounds.length > 0 ? (
            <>
              {galleryData.rounds.map((round, index) => (
                <div key={round.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">
                        Round {galleryData.rounds.length - index}
                      </h2>
                      <p className="text-gray-600">{round.text}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Ended: {new Date(round.weekEnd).toLocaleDateString()}</div>
                      <div>{round.responses.length} submissions</div>
                    </div>
                  </div>
                  
                  {round.responses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {round.responses.map((response) => (
                        <div key={response.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="relative">
                            <Image
                              src={response.imageUrl}
                              alt={response.caption}
                              width={400}
                              height={192}
                              className="w-full h-48 object-cover"
                            />
                            {response.finalRank && response.finalRank <= 3 && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold">
                                {getRankIcon(response.finalRank)}
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <ProfileAvatar 
                                  username={response.user.username}
                                  profilePhoto={response.user.profilePhoto}
                                  size="sm"
                                />
                                <p className="font-medium text-gray-900">{response.user.username}</p>
                              </div>
                              <div className="text-right text-sm">
                                <div className="text-blue-600 font-medium">{response.totalPoints} pts</div>
                                <div className="text-gray-500">#{response.finalRank || '—'}</div>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm">{response.caption}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No submissions for this round</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Rounds Yet</h3>
              <p className="text-gray-500">Completed rounds will appear here after challenges are completed and voted on.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
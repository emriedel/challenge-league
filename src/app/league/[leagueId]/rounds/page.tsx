'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
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
            <div className="space-y-12">
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
                    <div className="space-y-8">
                      {round.responses.slice(0, 3).map((response) => (
                        <div key={response.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          {/* Header with user info and rank */}
                          <div className="flex items-center justify-between p-4 pb-3">
                            <div className="flex items-center space-x-3">
                              <ProfileAvatar 
                                username={response.user.username}
                                profilePhoto={response.user.profilePhoto}
                                size="md"
                              />
                              <div>
                                <p className="font-semibold text-gray-900">{response.user.username}</p>
                                {response.finalRank && (
                                  <p className="text-sm text-gray-500">
                                    #{response.finalRank} • {response.totalPoints} points
                                  </p>
                                )}
                              </div>
                            </div>
                            {response.finalRank && response.finalRank <= 3 && (
                              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                                {getRankIcon(response.finalRank)}
                              </div>
                            )}
                          </div>
                          
                          {/* Image with preserved aspect ratio */}
                          <div className="relative w-full">
                            <Image
                              src={response.imageUrl}
                              alt={response.caption}
                              width={800}
                              height={600}
                              className="w-full h-auto"
                              style={{ maxHeight: '70vh' }}
                              priority={false}
                            />
                          </div>
                          
                          {/* Caption and interaction area */}
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-gray-800 leading-relaxed">
                                  <span className="font-semibold">@{response.user.username}</span>{' '}
                                  <span>{response.caption}</span>
                                </p>
                              </div>
                            </div>
                            
                            {/* Stats row */}
                            <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                              <div className="flex items-center space-x-4">
                                <span>{response.totalVotes} votes</span>
                                <span>{response.totalPoints} points</span>
                              </div>
                              <div>
                                Rank #{response.finalRank || '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* View All Submissions Button */}
                      {round.responses.length > 3 && (
                        <div className="text-center pt-4">
                          <Link
                            href={`/league/${params.leagueId}/rounds/${round.id}`}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            View All {round.responses.length} Submissions
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No submissions for this round</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
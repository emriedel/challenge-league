'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLeague } from '@/hooks/useLeague';
import { useGallery } from '@/hooks/useGallery';
import LeagueNavigation from '@/components/LeagueNavigation';
import ProfileAvatar from '@/components/ProfileAvatar';

// Ranking display for results with medal colors
const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        text: '#1',
        className: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      };
    case 2:
      return {
        text: '#2',
        className: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      };
    case 3:
      return {
        text: '#3',
        className: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
      };
    default:
      return {
        text: `#${rank}`,
        className: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
      };
  }
};

interface RoundResponse {
  id: string;
  caption: string;
  imageUrl: string;
  submittedAt: string;
  publishedAt: string | null;
  totalVotes: number;
  totalPoints: number;
  finalRank: number | null;
  user: {
    username: string;
    profilePhoto?: string;
  };
}

interface RoundData {
  id: string;
  text: string;
  weekStart: string;
  weekEnd: string;
  responses: RoundResponse[];
}

interface RoundDetailPageProps {
  params: { leagueId: string; roundId: string };
}

export default function RoundDetailPage({ params }: RoundDetailPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading } = useLeague(params.leagueId);
  const { data: galleryData } = useGallery(params.leagueId);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchRoundData = async () => {
      if (!params.leagueId || !params.roundId) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/rounds/${params.roundId}?leagueId=${params.leagueId}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/signin');
            return;
          }
          if (response.status === 404) {
            setError('Round not found');
            return;
          }
          throw new Error('Failed to fetch round data');
        }

        const data = await response.json();
        setRoundData(data.round);
      } catch (err) {
        console.error('Error fetching round data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoundData();
  }, [params.leagueId, params.roundId, router]);

  if (status === 'loading' || leagueLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session || !leagueData) {
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

  if (!roundData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Round not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LeagueNavigation 
        leagueId={params.leagueId} 
        leagueName={leagueData.league.name}
        isOwner={leagueData.league.isOwner}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link outside content area */}
        <div className="mb-6">
          <Link
            href={`/league/${params.leagueId}/rounds`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Completed Rounds
          </Link>
        </div>

        <div className="space-y-8">
          {/* Round Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Round #{galleryData?.rounds ? galleryData.rounds.length - galleryData.rounds.findIndex(r => r.id === roundData.id) : 1}</h1>
                <p className="text-gray-600 text-lg">{roundData.text}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Ended: {new Date(roundData.weekEnd).toLocaleDateString()}</div>
                <div>{roundData.responses.length} submissions</div>
              </div>
            </div>
          </div>

          {/* All Submissions */}
          {roundData.responses.length > 0 ? (
            <div className="space-y-8">
              {roundData.responses.map((response) => (
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
                      <div className={`${getRankBadge(response.finalRank).className} px-3 py-1 rounded-full text-sm font-bold flex items-center`}>
                        {getRankBadge(response.finalRank).text}
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
                          <span className="font-semibold">{response.user.username}</span>{' '}
                          <span>{response.caption}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions</h3>
              <p className="text-gray-500">
                No submissions were made for this round.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRoundsQuery, useLeagueQuery } from '@/hooks/queries';
import LeagueNavigation from '@/components/LeagueNavigation';
import Image from 'next/image';
import ProfileAvatar from '@/components/ProfileAvatar';
import { getRankBadge } from '@/lib/utils';


interface ResultsPageProps {
  params: { leagueId: string };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading } = useLeagueQuery(params.leagueId);
  const { data: galleryData, isLoading: galleryLoading, error: galleryError } = useRoundsQuery(params.leagueId);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Set the most recent round as default when data loads
  useEffect(() => {
    if (galleryData?.rounds && galleryData.rounds.length > 0 && !selectedRoundId) {
      setSelectedRoundId(galleryData.rounds[0].id);
    }
  }, [galleryData, selectedRoundId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const selectedRound = galleryData?.rounds?.find(round => round.id === selectedRoundId);
  const selectedRoundIndex = galleryData?.rounds?.findIndex(round => round.id === selectedRoundId);

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div>
      <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />
      
      {galleryData?.rounds && galleryData.rounds.length > 0 ? (
        <div>
          {/* Challenge Selector and Details */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="relative mb-6" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors min-w-48"
                >
                  <div className="text-left">
                    {selectedRound ? (
                      <div className="font-medium text-gray-900">
                        Challenge #{galleryData.rounds.length - (selectedRoundIndex || 0)}
                      </div>
                    ) : (
                      <div className="text-gray-500">Select a challenge</div>
                    )}
                  </div>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto min-w-64">
                    {galleryData.rounds.map((round, index) => (
                      <button
                        key={round.id}
                        onClick={() => {
                          setSelectedRoundId(round.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                          selectedRoundId === round.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          Challenge #{galleryData.rounds.length - index}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {truncateText(round.text, 80)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Challenge Details */}
              {selectedRound && (
                <div>
                  <p className="text-lg text-gray-700 mb-4 font-bold">
                    {selectedRound.text}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div>
                      Ended: {new Date(selectedRound.weekEnd).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full-width Photo Display */}
          <div className="min-h-screen">
            {selectedRound?.responses && selectedRound.responses.length > 0 ? (
              <div className="space-y-2">
                {selectedRound.responses.map((response) => (
                  <div key={response.id} className="border-b border-gray-200">
                    {/* Header with user info and rank */}
                    <div className="p-4 max-w-4xl mx-auto">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ProfileAvatar 
                            username={response.user.username}
                            profilePhoto={response.user.profilePhoto}
                            size="md"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{response.user.username}</p>
                          </div>
                        </div>
                        {response.finalRank && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              #{response.finalRank} • {response.totalPoints} points
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Full-width Image */}
                    <div className="relative w-full">
                      <Image
                        src={response.imageUrl}
                        alt={response.caption}
                        width={1200}
                        height={800}
                        className="w-full h-auto object-contain bg-gray-50"
                        style={{ maxHeight: '80vh' }}
                        priority={false}
                      />
                    </div>
                    
                    {/* Caption */}
                    <div className="p-4 max-w-4xl mx-auto">
                      <p className="text-gray-800 leading-relaxed">
                        <span className="font-semibold">{response.user.username}</span>{' '}
                        <span>{response.caption}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white min-h-[50vh] flex items-center justify-center">
                <div className="text-center py-8 text-gray-500">
                  <p>No submissions for this challenge</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Rounds Yet</h3>
            <p className="text-gray-500">Completed rounds will appear here after challenges are completed and voted on.</p>
          </div>
        </div>
      )}
    </div>
  );
}
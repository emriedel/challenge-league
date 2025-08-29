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
            <p className="mt-4 text-app-text-muted">Loading results...</p>
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
        <div className="bg-app-bg min-h-screen">
          {/* Challenge Selector and Details */}
          <div className="py-4">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative mb-4" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between p-2 bg-app-surface border border-app-border rounded-lg hover:bg-app-surface-light transition-colors min-w-48 shadow-sm"
                >
                  <div className="text-left">
                    {selectedRound ? (
                      <div className="font-medium text-app-text">
                        Challenge #{galleryData.rounds.length - (selectedRoundIndex || 0)}
                      </div>
                    ) : (
                      <div className="text-app-text-muted">Select a challenge</div>
                    )}
                  </div>
                  <svg 
                    className={`w-4 h-4 text-app-text-muted transition-transform ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-app-surface border border-app-border rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto min-w-64">
                    {galleryData.rounds.map((round, index) => (
                      <button
                        key={round.id}
                        onClick={() => {
                          setSelectedRoundId(round.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 border-b border-app-border-dark last:border-b-0 hover:bg-app-surface-light transition-colors ${
                          selectedRoundId === round.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium text-app-text">
                          Challenge #{galleryData.rounds.length - index}
                        </div>
                        <div className="text-sm text-app-text-secondary mt-1">
                          {truncateText(round.text, 80)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Challenge Details */}
              {selectedRound && (
                <div className="bg-app-surface border border-app-border rounded-lg p-4 mb-2 shadow-sm">
                  <p className="text-lg text-app-text mb-3 font-bold">
                    {selectedRound.text}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-app-text-muted">
                    <div>
                      Ended: {selectedRound.weekEnd 
                        ? new Date(selectedRound.weekEnd).toLocaleDateString()
                        : 'Date not available'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full-width Photo Display */}
          <div>
            {selectedRound?.responses && selectedRound.responses.length > 0 ? (
              <div className="space-y-0">
                {selectedRound.responses.map((response) => (
                  <div key={response.id} className="border-t border-gray-200 pt-2">
                    {/* Header with user info and rank */}
                    <div className="px-4 py-3 max-w-2xl mx-auto">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ProfileAvatar 
                            username={response.user.username}
                            profilePhoto={response.user.profilePhoto}
                            size="md"
                          />
                          <div>
                            <p className="font-semibold text-app-text">{response.user.username}</p>
                          </div>
                        </div>
                        {response.finalRank && (
                          <div className="text-right">
                            <p className="text-sm text-app-text-muted">
                              #{response.finalRank} • {response.totalVotes} votes
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Full-width Image */}
                    <div className="relative w-full max-w-2xl mx-auto">
                      <Image
                        src={response.imageUrl}
                        alt={response.caption}
                        width={1200}
                        height={800}
                        className="w-full h-auto object-contain bg-app-surface-dark"
                        style={{ maxHeight: '80vh' }}
                        priority={false}
                      />
                    </div>
                    
                    {/* Caption */}
                    <div className="px-4 pt-3 pb-8 max-w-2xl mx-auto">
                      <p className="text-app-text leading-relaxed">
                        <span className="font-semibold">{response.user.username}</span>{' '}
                        <span>{response.caption}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-app-bg min-h-[50vh] flex items-center justify-center">
                <div className="text-center py-8 text-app-text-muted">
                  <p>No submissions for this challenge</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-app-surface border border-app-border rounded-lg p-8 text-center">
            <div className="text-app-text-muted mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-app-text mb-2">No Completed Rounds Yet</h3>
            <p className="text-app-text-muted">Completed rounds will appear here after challenges are completed and voted on.</p>
          </div>
        </div>
      )}
    </div>
  );
}
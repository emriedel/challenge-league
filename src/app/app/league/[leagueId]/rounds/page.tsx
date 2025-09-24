'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRoundsQuery, useLeagueQuery } from '@/hooks/queries';
import { useResultsCacheListener } from '@/hooks/useCacheEventListener';
import { useCacheInvalidator } from '@/lib/cacheInvalidation';
import { useNavigationRefreshHandlers } from '@/lib/navigationRefresh';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import DocumentPullToRefresh from '@/components/DocumentPullToRefresh';
import LeagueNavigation from '@/components/LeagueNavigation';
import PhotoFeedItem from '@/components/PhotoFeedItem';
import CommentSection from '@/components/CommentSection';


interface ResultsPageProps {
  params: { leagueId: string };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading } = useLeagueQuery(params.leagueId);
  const { data: galleryData, isLoading: galleryLoading, error: galleryError } = useRoundsQuery(params.leagueId);
  const cacheInvalidator = useCacheInvalidator();
  const { markResultsAsViewed } = useActivityTracking();

  // Listen for cache events to keep results synchronized
  useResultsCacheListener(params.leagueId);

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

  useNavigationRefreshHandlers('results', handleScrollToTop, handleNavigationRefresh);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/app/auth/signin');
    }
  }, [session, status, router]);

  // Mark results as viewed when user visits this page
  useEffect(() => {
    if (session?.user?.id && !galleryLoading && galleryData?.rounds?.length) {
      // Add a small delay to ensure the notification query has loaded
      const timer = setTimeout(() => {
        markResultsAsViewed(params.leagueId);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [session?.user?.id, galleryLoading, galleryData?.rounds?.length, markResultsAsViewed, params.leagueId]);

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
        <div className="max-w-2xl mx-auto px-4 py-6">
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

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <DocumentPullToRefresh onRefresh={handleRefresh}>
      <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} isOwner={league?.isOwner} />

      {galleryData?.rounds && galleryData.rounds.length > 0 ? (
        <div className="bg-app-bg pb-8">
          {/* Challenge Selector and Details */}
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="">
              <div className="relative mb-4 flex justify-center" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center p-2 bg-app-surface border border-app-border rounded-md hover:bg-app-surface-light transition-colors min-w-48 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    {selectedRound ? (
                      <>
                        <svg className="w-4 h-4 text-app-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <div className="font-medium text-app-text">
                          Challenge #{selectedRound.challengeNumber}
                        </div>
                      </>
                    ) : (
                      <div className="text-app-text-muted">Select a challenge</div>
                    )}
                    <svg
                      className={`w-4 h-4 text-app-text-muted transition-transform ml-1 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-app-surface border border-app-border rounded-md shadow-lg z-40 max-h-96 overflow-y-auto min-w-64">
                    {galleryData.rounds.map((round, index) => (
                      <button
                        key={round.id}
                        onClick={() => {
                          setSelectedRoundId(round.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 border-b border-app-border-dark last:border-b-0 hover:bg-app-surface-light transition-colors ${
                          selectedRoundId === round.id ? 'bg-app-surface-light' : ''
                        }`}
                      >
                        <div className={`font-medium ${selectedRoundId === round.id ? 'text-blue-400' : 'text-app-text'}`}>
                          Challenge #{round.challengeNumber}
                        </div>
                        <div className={`text-sm mt-1 ${selectedRoundId === round.id ? 'text-blue-300' : 'text-app-text-secondary'}`}>
                          {truncateText(round.text, 80)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Challenge Details */}
              {selectedRound && (
                  <div className="text-center space-y-4">
                    <div>
                      <p className="text-[1.4rem] text-app-text font-medium my-6">{selectedRound.text}</p>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-app-text-muted">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      <span>
                        Ended: {selectedRound.weekEnd
                          ? new Date(selectedRound.weekEnd).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              timeZoneName: 'short',
                            })
                          : 'Date not available'
                        }
                      </span>
                    </div>

                  </div>
              )}
            </div>
          </div>

          {/* Full-width Photo Display */}
          <div>
            {selectedRound?.responses && selectedRound.responses.length > 0 ? (
              <div className="space-y-0">
                {selectedRound.responses.map((response) => {
                  const metadata = response.votingMetadata;
                  const authorDidntVote = metadata && !metadata.authorVoted;

                  return (
                    <PhotoFeedItem
                      key={response.id}
                      user={{
                        username: response.user.username,
                        profilePhoto: response.user.profilePhoto
                      }}
                      imageUrl={response.imageUrl}
                      caption={response.caption}
                      metadata={response.finalRank !== null && response.finalRank !== undefined ? {
                        rank: response.finalRank,
                        votes: response.totalVotes ?? 0,
                        strikethroughVotes: authorDidntVote
                      } : undefined}
                      headerActions={
                        authorDidntVote ? (
                          <div className="text-right">
                            <div className="text-xs text-app-text-muted">
                              (Didn&apos;t Vote)
                            </div>
                          </div>
                        ) : undefined
                      }
                      footerContent={
                        <CommentSection
                          responseId={response.id}
                          showInput={false}
                          collapsed={true}
                        />
                      }
                    />
                  );
                })}
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
        <div className="max-w-2xl mx-auto px-4 py-6">
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
    </DocumentPullToRefresh>
  );
}
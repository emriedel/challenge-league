'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLeague } from '@/hooks/useLeague';
import { useVoting } from '@/hooks/useVoting';
import { useGallery } from '@/hooks/useGallery';
import LeagueNavigation from '@/components/LeagueNavigation';

// Trophy icons for rankings
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return `#${rank}`;
  }
};

// Difficulty stars
const getDifficultyStars = (difficulty: number) => {
  return '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
};

interface LeagueHomePageProps {
  params: { leagueId: string };
}

export default function LeagueHomePage({ params }: LeagueHomePageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useLeague();
  const { data: votingData, isLoading: votingLoading, error: votingError, submitVotes } = useVoting();
  const { data: galleryData, isLoading: galleryLoading, error: galleryError } = useGallery();
  const [selectedVotes, setSelectedVotes] = useState<{ [responseId: string]: number }>({});
  const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  const handleVoteSelection = (responseId: string, rank: number) => {
    const newVotes = { ...selectedVotes };
    
    // Remove this rank from any other response
    Object.keys(newVotes).forEach(id => {
      if (newVotes[id] === rank && id !== responseId) {
        delete newVotes[id];
      }
    });
    
    // Set or toggle this vote
    if (newVotes[responseId] === rank) {
      delete newVotes[responseId];
    } else {
      newVotes[responseId] = rank;
    }
    
    setSelectedVotes(newVotes);
  };

  const handleSubmitVotes = async () => {
    const votes = Object.entries(selectedVotes).map(([responseId, rank]) => ({
      responseId,
      rank,
    }));

    if (votes.length !== 3) {
      alert('Please select your top 3 choices (1st, 2nd, and 3rd place)');
      return;
    }

    setIsSubmittingVotes(true);
    const result = await submitVotes(votes);
    setIsSubmittingVotes(false);

    if (result.success) {
      alert('Votes submitted successfully!');
      setSelectedVotes({});
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  if (status === 'loading' || leagueLoading) {
    return (
      <div>
        <LeagueNavigation leagueId={params.leagueId} leagueName="Loading..." />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading league...</p>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
            <p className="text-red-700">{leagueError}</p>
          </div>
        </div>
      </div>
    );
  }

  const league = leagueData?.league;
  const leaderboard = leagueData?.leaderboard || [];
  const currentUserEntry = leaderboard.find(entry => entry.user.username === session.user.username);

  // Show voting interface if voting is active, otherwise show submission area or latest results
  const showVoting = votingData?.canVote && votingData.responses.length > 0;
  const showLatestResults = !showVoting && galleryData?.responses && galleryData.responses.length > 0;

  return (
    <div>
      <LeagueNavigation leagueId={params.leagueId} leagueName={league?.name || 'League'} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Status */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🎯 Current Status</h2>
          {showVoting ? (
            <div className="space-y-2">
              <p className="text-blue-700 font-medium">⏰ Voting is now open!</p>
              <p className="text-gray-600">Cast your votes for the best submissions in the current challenge.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-700">Competition in progress</p>
              <p className="text-sm text-gray-500">
                {showLatestResults ? 'View the latest results below' : 'Check back for updates'}
              </p>
              <Link
                href="/submit"
                className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Response →
              </Link>
            </div>
          )}
        </div>

        {/* Voting Interface */}
        {showVoting && (
          <div className="space-y-6 mb-8">
            {/* Voting Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">🗳️ Cast Your Votes</h2>
              <div className="space-y-2 text-blue-700">
                <p className="font-medium">Challenge: "{votingData.prompt?.text}"</p>
                <p className="text-sm">
                  Category: {votingData.prompt?.category} | 
                  Difficulty: {getDifficultyStars(votingData.prompt?.difficulty || 1)}
                </p>
              </div>
              <div className="mt-4 space-y-1 text-sm text-blue-600">
                <p>• Select your 1st, 2nd, and 3rd place choices</p>
                <p>• You cannot vote for your own submission</p>
                <p>• Voting ends: {votingData.voteEnd ? new Date(votingData.voteEnd).toLocaleString() : 'TBD'}</p>
              </div>
            </div>

            {/* Voting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {votingData.responses.map((response) => {
                const selectedRank = selectedVotes[response.id];
                return (
                  <div
                    key={response.id}
                    className={`border-2 rounded-lg overflow-hidden transition-all ${
                      selectedRank 
                        ? 'border-blue-500 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={response.imageUrl}
                      alt={response.caption}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-2">@{response.user.username}</p>
                      <p className="text-gray-800 text-sm mb-4">{response.caption}</p>
                      
                      {/* Vote Buttons */}
                      <div className="flex gap-2">
                        {[1, 2, 3].map((rank) => (
                          <button
                            key={rank}
                            onClick={() => handleVoteSelection(response.id, rank)}
                            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                              selectedRank === rank
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : '🥉 3rd'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Votes */}
            <div className="text-center">
              <button
                onClick={handleSubmitVotes}
                disabled={Object.keys(selectedVotes).length !== 3 || isSubmittingVotes}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingVotes ? 'Submitting...' : `Submit Votes (${Object.keys(selectedVotes).length}/3)`}
              </button>
            </div>
          </div>
        )}

        {/* Latest Results (when not voting) */}
        {showLatestResults && !showVoting && (
          <div className="space-y-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">🏆 Latest Results</h2>
              <p className="text-gray-600 mb-4">"{galleryData.prompt?.text}"</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryData.responses.slice(0, 6).map((response) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="relative">
                      <img
                        src={response.imageUrl}
                        alt={response.caption}
                        className="w-full h-48 object-cover"
                      />
                      {response.finalRank && response.finalRank <= 3 && (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-sm font-bold">
                          {getRankIcon(response.finalRank)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900">@{response.user.username}</p>
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
              <div className="text-center mt-6">
                <Link
                  href={`/league/${params.leagueId}/results`}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  View All Results →
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
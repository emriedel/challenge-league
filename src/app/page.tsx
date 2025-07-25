'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLeague } from '@/hooks/useLeague';
import { useVoting } from '@/hooks/useVoting';
import { useGallery } from '@/hooks/useGallery';

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

export default function LeagueDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leagueData, isLoading: leagueLoading, error: leagueError } = useLeague();
  const { data: votingData, isLoading: votingLoading, error: votingError, submitVotes } = useVoting();
  const { data: galleryData, isLoading: galleryLoading, error: galleryError } = useGallery();
  const [activeTab, setActiveTab] = useState<'overview' | 'voting' | 'results' | 'leaderboard'>('overview');
  const [selectedVotes, setSelectedVotes] = useState<{ [responseId: string]: number }>({});
  const [isSubmittingVotes, setIsSubmittingVotes] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Auto-switch to voting tab if voting is active
  useEffect(() => {
    if (votingData?.canVote && votingData.responses.length > 0) {
      setActiveTab('voting');
    }
  }, [votingData]);

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
      setActiveTab('overview');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  if (status === 'loading' || leagueLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading league dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (leagueError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
          <p className="text-red-700">{leagueError}</p>
        </div>
      </div>
    );
  }

  const league = leagueData?.league;
  const leaderboard = leagueData?.leaderboard || [];
  const recentActivity = leagueData?.recentActivity || [];
  const currentUserEntry = leaderboard.find(entry => entry.user.username === session.user.username);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🏆 {league?.name}</h1>
        <p className="text-gray-600 mb-4">{league?.description}</p>
        <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
          <span>{league?.memberCount} Players</span>
          {currentUserEntry && (
            <span>Your Rank: #{currentUserEntry.stats.leagueRank}</span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overview', name: 'Overview', badge: null },
            { id: 'voting', name: 'Vote', badge: votingData?.canVote ? '🗳️' : null },
            { id: 'results', name: 'Latest Results', badge: null },
            { id: 'leaderboard', name: 'Leaderboard', badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              {tab.name}
              {tab.badge && <span>{tab.badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Current Status Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Current Status</h2>
            {votingData?.canVote ? (
              <div className="space-y-2">
                <p className="text-blue-700 font-medium">⏰ Voting is now open!</p>
                <p className="text-gray-600">Cast your votes for the best submissions in the current challenge.</p>
                <button
                  onClick={() => setActiveTab('voting')}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Vote Now →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-700">Next voting period opens when submissions close</p>
                <p className="text-sm text-gray-500">Check back soon for new challenges!</p>
              </div>
            )}
          </div>

          {/* Your Stats */}
          {currentUserEntry && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📊 Your Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">#{currentUserEntry.stats.leagueRank}</div>
                  <div className="text-sm text-gray-500">League Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentUserEntry.stats.totalPoints}</div>
                  <div className="text-sm text-gray-500">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{currentUserEntry.stats.wins}</div>
                  <div className="text-sm text-gray-500">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{currentUserEntry.stats.podiumFinishes}</div>
                  <div className="text-sm text-gray-500">Top 3 Finishes</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">📅 Recent Challenges</h2>
              <button
                onClick={() => setActiveTab('results')}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.slice(0, 2).map((activity) => (
                <div key={activity.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">"{activity.text}"</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {activity.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{activity.responses.length} submissions</span>
                    <span>Winner: {activity.responses[0]?.user.username || 'TBD'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'voting' && (
        <div className="space-y-6">
          {votingData?.canVote && votingData.responses.length > 0 ? (
            <>
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
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Voting</h3>
              <p className="text-gray-500">
                {votingData?.message || 'Voting will open when the current submission period ends.'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-8">
          {galleryData?.responses && galleryData.responses.length > 0 ? (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-2">🏆 Latest Results</h2>
                <p className="text-gray-600 mb-4">"{galleryData.prompt?.text}"</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {galleryData.responses.map((response) => (
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
              </div>
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
              <p className="text-gray-500">Results will appear here after challenges are completed and voted on.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">🏆 League Leaderboard</h2>
            <p className="text-gray-600 text-sm">Rankings based on total points earned across all challenges</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top 3</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenges</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry, index) => (
                  <tr 
                    key={entry.user.id}
                    className={entry.user.username === session.user.username ? 'bg-blue-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className="flex items-center gap-2">
                        {getRankIcon(entry.stats.leagueRank)}
                        {entry.user.username === session.user.username && (
                          <span className="text-blue-600 text-xs">(You)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {entry.stats.totalPoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.stats.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.stats.podiumFinishes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.stats.totalSubmissions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
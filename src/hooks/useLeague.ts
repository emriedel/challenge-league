'use client';

import { useState, useEffect } from 'react';

interface LeagueUser {
  id: string;
  username: string;
}

interface LeagueStats {
  totalPoints: number;
  totalSubmissions: number;
  wins: number;
  podiumFinishes: number;
  averageRank: number;
  leagueRank: number;
}

interface LeaderboardEntry {
  user: LeagueUser;
  stats: LeagueStats;
}

interface RecentActivity {
  id: string;
  text: string;
  weekEnd: string;
  responses: {
    id: string;
    caption: string;
    imageUrl: string;
    totalPoints: number;
    finalRank: number;
    user: {
      username: string;
    };
  }[];
}

interface League {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

interface LeagueData {
  league: League;
  leaderboard: LeaderboardEntry[];
  recentActivity: RecentActivity[];
}

interface UseLeagueReturn {
  data: LeagueData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLeague(): UseLeagueReturn {
  const [data, setData] = useState<LeagueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeague = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/league');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view league data');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch league data');
      }

      const leagueData = await response.json();
      setData(leagueData);
    } catch (err) {
      console.error('League fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeague();
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchLeague,
  };
}
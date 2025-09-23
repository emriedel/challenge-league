'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/queryClient';
import type { LeagueWithMembers } from '@/types/league';

interface LeagueUser {
  id: string;
  username: string;
  profilePhoto?: string;
}

interface LeagueStats {
  totalVotes: number;
  totalSubmissions: number;
  wins: number;
  podiumFinishes: number;
  averageRank: number;
  leagueRank: number;
  // New fields for "no vote, no points" rule
  votingParticipation: number; // Number of rounds the user voted in
  totalCompletedRounds: number; // Total completed rounds in the league
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
    totalVotes: number;
    finalRank: number;
    user: {
      username: string;
    };
  }[];
}

interface LeagueData {
  league: LeagueWithMembers;
  leaderboard: LeaderboardEntry[];
  recentActivity: RecentActivity[];
}

/**
 * Cached hook for league data with standings and recent activity
 */
export function useLeagueQuery(leagueId?: string) {
  return useQuery({
    queryKey: queryKeys.league(leagueId!),
    queryFn: async (): Promise<LeagueData> => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view league data');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch league data');
      }

      return response.json();
    },
    enabled: !!leagueId,
    ...cacheConfig.static, // League data changes infrequently
  });
}

/**
 * Hook specifically for league standings (leaderboard only)
 * This allows for more targeted caching of standings data
 */
export function useLeagueStandingsQuery(leagueId?: string) {
  const { data, ...rest } = useLeagueQuery(leagueId);
  
  return {
    data: data ? {
      league: data.league,
      leaderboard: data.leaderboard,
    } : null,
    ...rest,
  };
}

/**
 * Mutation for joining a league by invite code
 */
export function useJoinLeagueMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to join league');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate user leagues to show new league
      queryClient.invalidateQueries({ queryKey: queryKeys.userLeagues() });

      // Add new league data to cache
      if (data.league) {
        queryClient.setQueryData(queryKeys.league(data.league.id), data);
      }
    },
  });
}

/**
 * Mutation for joining a league by league ID
 */
export function useJoinLeagueByIdMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leagueId: string) => {
      const response = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leagueId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to join league');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate user leagues to show new league immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.userLeagues() });

      // Add new league data to cache
      if (data.league) {
        queryClient.setQueryData(queryKeys.league(data.league.id), data);
      }
    },
  });
}

/**
 * Mutation for creating a new league
 */
export function useCreateLeagueMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create league');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate user leagues to show new league immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.userLeagues() });

      // Add new league data to cache
      if (data.league) {
        queryClient.setQueryData(queryKeys.league(data.league.id), data);
      }
    },
  });
}
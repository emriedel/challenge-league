'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/queryClient';

interface SubmissionStatsSubmitter {
  id: string;
  userId: string;
  submittedAt: string;
  user: {
    username: string;
    profilePhoto?: string;
  };
}

interface SubmissionStatsData {
  hasActiveChallenge: boolean;
  submissionCount: number;
  totalMembers: number;
  submitters: SubmissionStatsSubmitter[];
}

/**
 * Hook for getting submission statistics for active challenges
 */
export function useSubmissionStatsQuery(leagueId?: string) {
  return useQuery({
    queryKey: queryKeys.submissionStats(leagueId!),
    queryFn: async (): Promise<SubmissionStatsData> => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/submission-stats`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view submission stats');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch submission stats');
      }

      return response.json();
    },
    enabled: !!leagueId,
    ...cacheConfig.dynamic, // Use dynamic cache (30s) for good performance
  });
}
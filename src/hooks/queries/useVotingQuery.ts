'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/queryClient';

interface VotingResponse {
  id: string;
  caption: string;
  imageUrl: string;
  submittedAt: string;
  user: {
    username: string;
    profilePhoto?: string;
  };
}

interface VotingPrompt {
  id: string;
  text: string;
  voteEnd: string;
}

interface ExistingVote {
  id: string;
  rank: number;
  points: number;
  response: {
    id: string;
  };
}

interface VotingData {
  prompt: VotingPrompt | null;
  responses: VotingResponse[];
  existingVotes: ExistingVote[];
  canVote: boolean;
  voteEnd?: string;
  message?: string;
}

/**
 * Cached hook for voting data
 * Uses dynamic cache for better performance while still keeping data reasonably fresh
 */
export function useVotingQuery(leagueId?: string) {
  return useQuery({
    queryKey: queryKeys.votingData(leagueId!),
    queryFn: async (): Promise<VotingData> => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/votes?id=${encodeURIComponent(leagueId)}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to vote');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch voting data');
      }

      return response.json();
    },
    enabled: !!leagueId,
    ...cacheConfig.dynamic, // Use dynamic cache (30s) instead of realTime (10s) for better performance
  });
}

/**
 * Mutation for submitting votes
 */
export function useSubmitVotesMutation(leagueId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (votes: { [responseId: string]: number }) => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ votes, leagueId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit votes');
      }

      return response.json();
    },
    onSuccess: () => {
      // Immediately refetch voting data after successful vote submission
      queryClient.invalidateQueries({ queryKey: queryKeys.votingData(leagueId!) });
      
      // Also invalidate league data since standings might change
      queryClient.invalidateQueries({ queryKey: queryKeys.league(leagueId!) });
      
      // Invalidate rounds data since results might be available
      queryClient.invalidateQueries({ queryKey: queryKeys.leagueRounds(leagueId!) });
    },
  });
}
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/queryClient';
import { invalidationPatterns } from '@/lib/cacheInvalidation';

interface VotingResponse {
  id: string;
  caption: string;
  imageUrl: string;
  submittedAt: string;
  userId: string; // Add userId for own submission detection
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
  
  response: {
    id: string;
  };
}

interface VotingData {
  prompt: VotingPrompt | null;
  responses: VotingResponse[];
  votableResponseIds?: string[]; // IDs of responses that can be voted on
  existingVotes: ExistingVote[];
  canVote: boolean;
  voteEnd?: string;
  message?: string;
  currentUserId?: string; // Current user's ID for frontend logic
}

/**
 * Cached hook for voting data
 * Uses aggressive caching since voting submissions are immutable once voting phase starts
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
    staleTime: 15 * 60 * 1000, // 15 minutes - submissions don't change during voting
    gcTime: 30 * 60 * 1000,    // 30 minutes - keep in cache while unused
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
      // Use enhanced invalidation pattern for voting
      const pattern = invalidationPatterns.voting.submit(leagueId!);
      pattern.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });
}
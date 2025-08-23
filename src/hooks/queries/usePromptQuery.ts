'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/queryClient';

interface PromptData {
  prompt: {
    id: string;
    text: string;
    status: 'SCHEDULED' | 'ACTIVE' | 'VOTING' | 'COMPLETED';
    weekStart: string;
    weekEnd: string;
    voteEnd: string;
  } | null;
  userResponse?: {
    id: string;
    imageUrl: string;
    caption: string;
    submittedAt: string;
    isPublished: boolean;
  } | null;
}

/**
 * Cached hook for current league prompt data
 * Uses dynamic cache config since prompt status changes regularly
 */
export function useLeaguePromptQuery(leagueId?: string) {
  return useQuery({
    queryKey: queryKeys.leaguePrompt(leagueId!),
    queryFn: async (): Promise<PromptData> => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/prompt`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view prompt data');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch prompt data');
      }

      return response.json();
    },
    enabled: !!leagueId,
    ...cacheConfig.dynamic, // Prompt data changes as status updates
  });
}

/**
 * Mutation for submitting a response to a prompt
 */
export function useSubmitResponseMutation(leagueId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      promptId: string;
      photoUrl: string;
      caption: string;
    }) => {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          leagueId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit response');
      }

      return response.json();
    },
    onSuccess: () => {
      // Immediately refetch prompt data to show updated user response
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leaguePrompt(leagueId!) 
      });
    },
  });
}

/**
 * Hook for user's response to a specific prompt
 */
export function useUserResponseQuery(promptId?: string) {
  return useQuery({
    queryKey: queryKeys.userResponse(promptId!),
    queryFn: async () => {
      if (!promptId) {
        throw new Error('Prompt ID is required');
      }

      const response = await fetch(`/api/responses?promptId=${promptId}&userOnly=true`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your response');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch user response');
      }

      return response.json();
    },
    enabled: !!promptId,
    ...cacheConfig.user, // User-specific data
  });
}
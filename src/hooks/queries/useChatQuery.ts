'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    profilePhoto?: string;
  };
}

interface ChatData {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Cached hook for chat initial data
 * This provides the initial message load that can be prefetched
 */
export function useChatInitialQuery(leagueId: string) {
  return useQuery({
    queryKey: ['league', leagueId, 'chat', 'initial'],
    queryFn: async (): Promise<ChatData> => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/chat`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view chat');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch chat messages');
      }

      return response.json();
    },
    enabled: !!leagueId,
    ...cacheConfig.dynamic, // Chat data changes regularly but not too frequently
  });
}
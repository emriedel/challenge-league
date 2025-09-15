'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/queryClient';

interface GalleryResponse {
  id: string;
  caption: string;
  imageUrl: string;
  submittedAt: string;
  publishedAt: string | null;
  totalVotes: number;
  finalRank: number | null;
  user: {
    username: string;
    profilePhoto?: string;
  };
  votes?: {
    id: string;
    rank: number;
    voter: {
      username: string;
    };
  }[];
}

interface CompletedRound {
  id: string;
  text: string;
  weekStart: string;
  weekEnd: string;
  challengeNumber: number;
  responses: GalleryResponse[];
}

interface RoundsData {
  rounds: CompletedRound[];
  // Legacy fields for backwards compatibility
  responses?: GalleryResponse[];
  prompt?: {
    id: string;
    text: string;
    weekStart: string;
    weekEnd: string;
  } | null;
}

/**
 * Cached hook for completed rounds/gallery data
 * Uses static cache config since completed rounds don't change
 */
export function useRoundsQuery(leagueId?: string) {
  return useQuery({
    queryKey: queryKeys.leagueRounds(leagueId!),
    queryFn: async (): Promise<RoundsData> => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/responses?id=${encodeURIComponent(leagueId)}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view the gallery');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch rounds data');
      }

      const galleryData = await response.json();
      
      // Handle new rounds format with backwards compatibility
      if (galleryData.rounds) {
        return {
          rounds: galleryData.rounds,
          // For backwards compatibility, provide latest round data
          responses: galleryData.rounds.length > 0 ? galleryData.rounds[0].responses : [],
          prompt: galleryData.rounds.length > 0 ? {
            id: galleryData.rounds[0].id,
            text: galleryData.rounds[0].text,
            weekStart: galleryData.rounds[0].weekStart,
            weekEnd: galleryData.rounds[0].weekEnd
          } : null
        };
      } else {
        // Handle legacy format
        return galleryData;
      }
    },
    enabled: !!leagueId,
    ...cacheConfig.static, // Completed rounds don't change
  });
}


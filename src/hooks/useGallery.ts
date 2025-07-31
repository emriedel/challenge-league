'use client';

import { useState, useEffect, useCallback } from 'react';

interface GalleryResponse {
  id: string;
  caption: string;
  imageUrl: string;
  submittedAt: string;
  publishedAt: string | null;
  totalVotes: number;
  totalPoints: number;
  finalRank: number | null;
  user: {
    username: string;
    profilePhoto?: string;
  };
  votes?: {
    id: string;
    rank: number;
    points: number;
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
  responses: GalleryResponse[];
}

interface GalleryData {
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

interface UseGalleryReturn {
  data: GalleryData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGallery(leagueId?: string): UseGalleryReturn {
  const [data, setData] = useState<GalleryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = useCallback(async () => {
    if (!leagueId) {
      setError('League slug is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/responses?id=${encodeURIComponent(leagueId)}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view the gallery');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch gallery');
      }

      const galleryData = await response.json();
      
      // Handle new rounds format with backwards compatibility
      if (galleryData.rounds) {
        const processedData: GalleryData = {
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
        setData(processedData);
      } else {
        // Handle legacy format
        setData(galleryData);
      }
    } catch (err) {
      console.error('Gallery fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    if (leagueId) {
      fetchGallery();
    }
  }, [leagueId, fetchGallery]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchGallery,
  };
}
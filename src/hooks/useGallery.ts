'use client';

import { useState, useEffect } from 'react';

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

interface GalleryData {
  responses: GalleryResponse[];
  prompt: {
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

export function useGallery(leagueSlug?: string): UseGalleryReturn {
  const [data, setData] = useState<GalleryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = async () => {
    if (!leagueSlug) {
      setError('League slug is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/responses?slug=${encodeURIComponent(leagueSlug)}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view the gallery');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch gallery');
      }

      const galleryData = await response.json();
      setData(galleryData);
    } catch (err) {
      console.error('Gallery fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leagueSlug) {
      fetchGallery();
    }
  }, [leagueSlug]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchGallery,
  };
}
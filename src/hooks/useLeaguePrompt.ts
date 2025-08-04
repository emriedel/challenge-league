'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { UseLeaguePromptReturn, PromptData } from '@/types/hooks';

export function useLeaguePrompt(leagueId?: string): UseLeaguePromptReturn {
  const { data: session } = useSession();
  const [data, setData] = useState<PromptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompt = useCallback(async () => {
    if (!session || !leagueId) {
      setError('Session or league ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/prompt`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('No active prompt found for this league');
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Failed to load prompt');
        }
        setData(null);
        return;
      }

      const promptData = await response.json();
      setData(promptData);
    } catch (error) {
      console.error('Prompt fetch error:', error);
      setError('Failed to load prompt');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, leagueId]);

  useEffect(() => {
    if (session && leagueId) {
      fetchPrompt();
    }
  }, [session, leagueId, fetchPrompt]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchPrompt,
  };
}
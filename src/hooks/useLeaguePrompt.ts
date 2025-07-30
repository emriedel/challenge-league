'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Prompt {
  id: string;
  text: string;
  weekStart: string;
  weekEnd: string;
}

interface UserResponse {
  id: string;
  submittedAt: string;
}

interface PromptData {
  prompt: Prompt;
  userResponse: UserResponse | null;
}

interface UseLeaguePromptReturn {
  data: PromptData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLeaguePrompt(leagueSlug?: string): UseLeaguePromptReturn {
  const { data: session } = useSession();
  const [data, setData] = useState<PromptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompt = useCallback(async () => {
    if (!session || !leagueSlug) {
      setError('Session or league slug is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompts/current?slug=${encodeURIComponent(leagueSlug)}`);
      
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
  }, [session, leagueSlug]);

  useEffect(() => {
    if (session && leagueSlug) {
      fetchPrompt();
    }
  }, [session, leagueSlug, fetchPrompt]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchPrompt,
  };
}
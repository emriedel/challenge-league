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

export function usePrompt() {
  const { data: session } = useSession();
  const [data, setData] = useState<PromptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompt = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prompts/current');
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('No active prompt found');
        } else {
          setError('Failed to load prompt');
        }
        return;
      }

      const data = await response.json();
      setData(data);
    } catch (error) {
      setError('Failed to load prompt');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchPrompt();
    }
  }, [session, fetchPrompt]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchPrompt,
  };
}
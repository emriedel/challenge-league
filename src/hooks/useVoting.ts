'use client';

import { useState, useEffect } from 'react';

interface VotingResponse {
  id: string;
  caption: string;
  imageUrl: string;
  submittedAt: string;
  user: {
    username: string;
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

interface UseVotingReturn {
  data: VotingData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  submitVotes: (votes: { [responseId: string]: number }) => Promise<{ success: boolean; error?: string }>;
}

export function useVoting(leagueSlug?: string): UseVotingReturn {
  const [data, setData] = useState<VotingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoting = async () => {
    if (!leagueSlug) {
      setError('League slug is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/votes?slug=${encodeURIComponent(leagueSlug)}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to vote');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch voting data');
      }

      const votingData = await response.json();
      setData(votingData);
    } catch (err) {
      console.error('Voting fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const submitVotes = async (votes: { [responseId: string]: number }) => {
    if (!leagueSlug) {
      return { success: false, error: 'League slug is required' };
    }

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ votes, leagueSlug }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to submit votes' };
      }

      // Refresh voting data after successful submission
      await fetchVoting();
      return { success: true };
    } catch (err) {
      console.error('Vote submission error:', err);
      return { success: false, error: 'Failed to submit votes' };
    }
  };

  useEffect(() => {
    if (leagueSlug) {
      fetchVoting();
    }
  }, [leagueSlug]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchVoting,
    submitVotes,
  };
}
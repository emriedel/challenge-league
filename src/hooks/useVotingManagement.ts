'use client';

import { useState, useCallback } from 'react';
import type { UseVotingManagementReturn, VoteMap } from '@/types';

interface UseVotingManagementProps {
  maxVotes?: number;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useVotingManagement({
  maxVotes = 3,
  onSuccess,
  onError
}: UseVotingManagementProps = {}): UseVotingManagementReturn {
  const [selectedVotes, setSelectedVotes] = useState<VoteMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTotalVotesFromObject = useCallback((votes: VoteMap) => {
    return Object.values(votes).reduce((sum, voteCount) => sum + voteCount, 0);
  }, []);

  const handleVoteSelection = useCallback((responseId: string, increment: boolean) => {
    setSelectedVotes(prevVotes => {
      const newVotes = { ...prevVotes };
      const currentVotes = newVotes[responseId] || 0;
      
      if (increment && getTotalVotesFromObject(prevVotes) < maxVotes) {
        newVotes[responseId] = currentVotes + 1;
      } else if (!increment && currentVotes > 0) {
        if (currentVotes === 1) {
          delete newVotes[responseId];
        } else {
          newVotes[responseId] = currentVotes - 1;
        }
      }
      
      return newVotes;
    });
  }, [maxVotes, getTotalVotesFromObject]);

  const getTotalVotes = useCallback(() => {
    return getTotalVotesFromObject(selectedVotes);
  }, [selectedVotes, getTotalVotesFromObject]);

  const submitVotes = useCallback(async (
    votingData: { submitVotes: (votes: VoteMap) => Promise<{ success: boolean; error?: string }> }
  ) => {
    const totalVotes = getTotalVotes();
    if (totalVotes !== maxVotes) {
      onError?.(`Please use all ${maxVotes} of your votes`);
      return;
    }

    setIsSubmitting(true);
    const result = await votingData.submitVotes(selectedVotes);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.('Votes submitted successfully!');
      setSelectedVotes({});
    } else {
      onError?.(result.error || 'Failed to submit votes');
    }
  }, [selectedVotes, maxVotes, getTotalVotes, onSuccess, onError]);

  const resetVotes = useCallback(() => {
    setSelectedVotes({});
  }, []);

  return {
    selectedVotes,
    isSubmitting,
    handleVoteSelection,
    getTotalVotes,
    submitVotes,
    resetVotes,
  };
}
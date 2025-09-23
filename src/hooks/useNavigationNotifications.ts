'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { queryKeys, cacheConfig } from '@/lib/queryClient';
import { useLeaguePromptQuery } from '@/hooks/queries/usePromptQuery';
import { useVotingQuery } from '@/hooks/queries/useVotingQuery';
import { useRoundsQuery } from '@/hooks/queries/useRoundsQuery';

interface NavigationNotifications {
  challengeNotification: boolean;
  resultsNotification: boolean;
  chatNotification: boolean;
  isLoading: boolean;
}

interface UserActivityData {
  lastViewedResults?: string;
  lastReadChatMessage?: string;
  unreadChatCount: number;
}

/**
 * Hook for managing navigation notification dots
 * Returns boolean indicators for when each tab should show a red dot
 */
export function useNavigationNotifications(leagueId?: string): NavigationNotifications {
  const { data: session } = useSession();

  // Get current prompt/challenge data
  const { data: promptData } = useLeaguePromptQuery(leagueId);

  // Get voting data
  const { data: votingData } = useVotingQuery(leagueId);

  // Get rounds/results data
  const { data: roundsData } = useRoundsQuery(leagueId);

  // Get user activity data
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: queryKeys.userActivity(leagueId!),
    queryFn: async (): Promise<UserActivityData> => {
      if (!leagueId || !session?.user?.id) {
        return { unreadChatCount: 0 };
      }

      const response = await fetch(`/api/user/activity/${leagueId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // No activity record exists yet
          return { unreadChatCount: 0 };
        }
        throw new Error('Failed to fetch user activity');
      }

      return response.json();
    },
    enabled: !!(leagueId && session?.user?.id),
    ...cacheConfig.dynamic, // Update frequently to catch new notifications
  });

  // Calculate challenge notification
  const challengeNotification = (() => {
    if (!promptData?.prompt) return false;

    const promptStatus = promptData.prompt.status;

    // Show notification if user needs to submit (ACTIVE status, no user response)
    if (promptStatus === 'ACTIVE' && !promptData.userResponse) {
      return true;
    }

    // Show notification if user needs to vote (VOTING status, no existing votes)
    if (promptStatus === 'VOTING' && votingData && (!votingData.existingVotes || votingData.existingVotes.length === 0)) {
      return true;
    }

    return false;
  })();

  // Calculate results notification
  const resultsNotification = (() => {
    if (!roundsData?.rounds || roundsData.rounds.length === 0) return false;
    if (!activityData) return false;

    // Get the most recent completed round
    const latestRound = roundsData.rounds[0]; // Rounds are sorted by newest first

    // If user has never viewed results, show notification for any completed round
    if (!activityData.lastViewedResults) {
      return true;
    }

    // Show notification if latest round is newer than last viewed
    const latestRoundDate = new Date(latestRound.weekEnd);
    const lastViewedDate = new Date(activityData.lastViewedResults);

    return latestRoundDate > lastViewedDate;
  })();

  // Calculate chat notification
  const chatNotification = (activityData?.unreadChatCount || 0) > 0;

  return {
    challengeNotification,
    resultsNotification,
    chatNotification,
    isLoading: activityLoading,
  };
}
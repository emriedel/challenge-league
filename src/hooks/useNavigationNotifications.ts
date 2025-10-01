'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { queryKeys, cacheConfig } from '@/lib/queryClient';
import { useLeaguePromptQuery } from '@/hooks/queries/usePromptQuery';
import { useVotingQuery } from '@/hooks/queries/useVotingQuery';
import { useRoundsQuery } from '@/hooks/queries/useRoundsQuery';
import { useLocalActivityTracking } from '@/hooks/useLocalActivityTracking';

interface NavigationNotifications {
  challengeNotification: boolean;
  resultsNotification: boolean;
  chatNotification: boolean;
  isLoading: boolean;
}

interface UnreadCountData {
  unreadChatCount: number;
}

/**
 * Hook for managing navigation notification dots
 * Returns boolean indicators for when each tab should show a red dot
 */
export function useNavigationNotifications(leagueId?: string): NavigationNotifications {
  const { data: session } = useSession();
  const { getActivityTimestamps } = useLocalActivityTracking();

  // Get current prompt/challenge data
  const { data: promptData } = useLeaguePromptQuery(leagueId);

  // Get voting data
  const { data: votingData } = useVotingQuery(leagueId);

  // Get rounds/results data
  const { data: roundsData } = useRoundsQuery(leagueId);

  // Get unread chat count from API
  const { data: unreadCountData, isLoading: activityLoading } = useQuery({
    queryKey: queryKeys.userActivity(leagueId!),
    queryFn: async (): Promise<UnreadCountData> => {
      if (!leagueId || !session?.user?.id) {
        return { unreadChatCount: 0 };
      }

      // Read fresh from localStorage on each query execution
      const freshActivity = getActivityTimestamps(leagueId);
      const lastRead = freshActivity.lastReadChatMessage || new Date(0).toISOString();
      const url = `/api/user/activity/${leagueId}?lastReadChatMessage=${encodeURIComponent(lastRead)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
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

  // Calculate results notification using localStorage (read fresh each render)
  const resultsNotification = (() => {
    if (!roundsData?.rounds || roundsData.rounds.length === 0) return false;
    if (!leagueId) return false;

    // Read fresh from localStorage on each calculation
    const freshActivity = getActivityTimestamps(leagueId);

    // Get the most recent completed round
    const latestRound = roundsData.rounds[0]; // Rounds are sorted by newest first

    // If user has never viewed results, show notification for any completed round
    if (!freshActivity.lastViewedResults) {
      return true;
    }

    // Show notification if latest round is newer than last viewed
    const latestRoundDate = new Date(latestRound.weekEnd);
    const lastViewedDate = new Date(freshActivity.lastViewedResults);

    return latestRoundDate > lastViewedDate;
  })();

  // Calculate chat notification from API unread count
  const chatNotification = (unreadCountData?.unreadChatCount || 0) > 0;

  return {
    challengeNotification,
    resultsNotification,
    chatNotification,
    isLoading: activityLoading,
  };
}
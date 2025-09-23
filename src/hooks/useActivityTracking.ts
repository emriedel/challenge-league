'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

/**
 * Hook for tracking user activity and updating notification states
 */
export function useActivityTracking() {
  const queryClient = useQueryClient();

  const updateActivity = useCallback(async (
    leagueId: string,
    activityType: 'lastViewedResults' | 'lastReadChatMessage'
  ) => {
    try {
      const response = await fetch(`/api/user/activity/${leagueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [activityType]: true,
        }),
      });

      if (response.ok) {
        // Invalidate the user activity query to update notifications
        queryClient.invalidateQueries({
          queryKey: queryKeys.userActivity(leagueId),
        });
      }
    } catch (error) {
      console.error(`Error updating ${activityType}:`, error);
      // Silent failure - don't show errors to user
    }
  }, [queryClient]);

  const markResultsAsViewed = useCallback((leagueId: string) => {
    updateActivity(leagueId, 'lastViewedResults');
  }, [updateActivity]);

  const markChatAsRead = useCallback((leagueId: string) => {
    updateActivity(leagueId, 'lastReadChatMessage');
  }, [updateActivity]);

  return {
    markResultsAsViewed,
    markChatAsRead,
  };
}
'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

/**
 * Local storage keys for activity tracking
 */
const STORAGE_PREFIX = 'challenge_league_activity_';

interface ActivityTimestamps {
  lastViewedResults?: string;
  lastReadChatMessage?: string;
}

/**
 * Hook for tracking user activity in localStorage
 * Provides local-only storage for "last viewed" timestamps to eliminate API calls
 */
export function useLocalActivityTracking() {
  const queryClient = useQueryClient();

  /**
   * Get activity timestamps for a specific league from localStorage
   */
  const getActivityTimestamps = useCallback((leagueId: string): ActivityTimestamps => {
    if (typeof window === 'undefined') return {};

    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${leagueId}`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading activity from localStorage:', error);
      return {};
    }
  }, []);

  /**
   * Update activity timestamp for a specific activity type
   * Also invalidates the user activity query to trigger notification updates
   */
  const updateActivity = useCallback((
    leagueId: string,
    activityType: 'lastViewedResults' | 'lastReadChatMessage'
  ) => {
    if (typeof window === 'undefined') return;

    try {
      const existing = getActivityTimestamps(leagueId);
      const updated = {
        ...existing,
        [activityType]: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_PREFIX}${leagueId}`, JSON.stringify(updated));

      // Invalidate the user activity query to trigger notification re-calculation
      queryClient.invalidateQueries({
        queryKey: queryKeys.userActivity(leagueId),
      });
    } catch (error) {
      console.error(`Error updating ${activityType} in localStorage:`, error);
    }
  }, [getActivityTimestamps, queryClient]);

  /**
   * Mark results as viewed for a specific league
   */
  const markResultsAsViewed = useCallback((leagueId: string) => {
    updateActivity(leagueId, 'lastViewedResults');
  }, [updateActivity]);

  /**
   * Mark chat as read for a specific league
   */
  const markChatAsRead = useCallback((leagueId: string) => {
    updateActivity(leagueId, 'lastReadChatMessage');
  }, [updateActivity]);

  /**
   * Clear all activity data for a specific league
   */
  const clearLeagueActivity = useCallback((leagueId: string) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${leagueId}`);
    } catch (error) {
      console.error('Error clearing league activity:', error);
    }
  }, []);

  /**
   * Clear all activity data for all leagues
   */
  const clearAllActivity = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing all activity:', error);
    }
  }, []);

  return {
    getActivityTimestamps,
    markResultsAsViewed,
    markChatAsRead,
    clearLeagueActivity,
    clearAllActivity,
  };
}

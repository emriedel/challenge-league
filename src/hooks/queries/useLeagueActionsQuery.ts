'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { queryKeys, cacheConfig } from '@/lib/queryClient';
import { updatePWABadgeFromLeagues, clearPWABadge } from '@/lib/pwaBadge';
import type { League } from '@/types/league';

interface LeagueActionsData {
  leagues: League[];
}

interface UseLeagueActionsReturn {
  leagues: League[];
  loading: boolean;
  error: string | null;
  hasAnyActions: boolean;
  refetch: () => void;
}

/**
 * Cached hook for user's leagues with action status and PWA badge management
 */
export function useLeagueActionsQuery(): UseLeagueActionsReturn {
  const { data: session, status } = useSession();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.userLeagues(),
    queryFn: async (): Promise<LeagueActionsData> => {
      const response = await fetch('/api/leagues/actions');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your leagues');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch leagues (${response.status})`);
      }

      return response.json();
    },
    enabled: status === 'authenticated' && !!session?.user,
    ...cacheConfig.user, // 2 minute stale time, 5 minute gc time
    refetchOnMount: false, // Don't refetch when component mounts if data is fresh
    refetchOnReconnect: true, // Refetch when network reconnects
  });

  // Memoize leagues array to prevent unnecessary re-renders
  const leagues = React.useMemo(() => data?.leagues || [], [data?.leagues]);

  // Update PWA badge whenever leagues data changes
  React.useEffect(() => {
    updatePWABadgeFromLeagues(leagues);
  }, [leagues]);

  // Clear badge when user signs out
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      clearPWABadge();
    }
  }, [status]);

  const hasAnyActions = leagues.some(league => league.needsAction);
  const errorMessage = error instanceof Error ? error.message : null;

  return {
    leagues,
    loading: isLoading,
    error: errorMessage,
    hasAnyActions,
    refetch
  };
}
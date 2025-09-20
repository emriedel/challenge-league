import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { League } from '@/types/league';

declare global {
  interface Navigator {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

interface UseLeagueActionsReturn {
  leagues: League[];
  loading: boolean;
  error: string | null;
  hasAnyActions: boolean;
  refetch: () => void;
}

export function useLeagueActions(): UseLeagueActionsReturn {
  const { data: session, status } = useSession();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to update PWA badge
  const updatePWABadge = useCallback((leagues: League[]) => {
    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
      try {
        const actionCount = leagues.filter(league => league.needsAction).length;
        if (actionCount > 0) {
          navigator.setAppBadge?.(actionCount);
        } else {
          navigator.clearAppBadge?.();
        }
      } catch (error) {
        console.warn('Failed to update PWA badge:', error);
      }
    }
  }, []);

  const fetchLeagues = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leagues/actions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leagues');
      }

      const fetchedLeagues = data.leagues || [];
      setLeagues(fetchedLeagues);
      updatePWABadge(fetchedLeagues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching league actions:', err);
    } finally {
      setLoading(false);
    }
  }, [status, session, updatePWABadge]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  // Listen for league actions refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchLeagues();
    };

    window.addEventListener('refreshLeagueActions', handleRefresh);
    return () => {
      window.removeEventListener('refreshLeagueActions', handleRefresh);
    };
  }, [fetchLeagues]);

  // Clear badge when user signs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      if ('clearAppBadge' in navigator) {
        try {
          navigator.clearAppBadge?.();
        } catch (error) {
          console.warn('Failed to clear PWA badge:', error);
        }
      }
    }
  }, [status]);

  const hasAnyActions = leagues.some(league => league.needsAction);

  return {
    leagues,
    loading,
    error,
    hasAnyActions,
    refetch: fetchLeagues
  };
}
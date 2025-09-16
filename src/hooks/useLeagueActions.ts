import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { League } from '@/types/league';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      setLeagues(data.leagues || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching league actions:', err);
    } finally {
      setLoading(false);
    }
  }, [status, session]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  const hasAnyActions = leagues.some(league => league.needsAction);

  return {
    leagues,
    loading,
    error,
    hasAnyActions,
    refetch: fetchLeagues
  };
}
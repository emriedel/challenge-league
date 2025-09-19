/**
 * Hook for listening to cache invalidation events and automatically refreshing data
 * This provides seamless UI updates across different pages when data changes
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

interface CacheEventDetail {
  pattern: unknown[];
  leagueId?: string;
  timestamp: number;
}

interface UseCacheEventListenerOptions {
  leagueId?: string;
  enableAutoRefresh?: boolean;
  onCacheInvalidated?: (detail: CacheEventDetail) => void;
}

/**
 * Hook that listens for cache invalidation events and automatically refreshes relevant queries
 * This ensures that all pages stay synchronized when data changes occur
 */
export function useCacheEventListener({
  leagueId,
  enableAutoRefresh = true,
  onCacheInvalidated
}: UseCacheEventListenerOptions = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enableAutoRefresh) return;

    const handleCacheInvalidated = (event: CustomEvent<CacheEventDetail>) => {
      const { detail } = event;

      // Only handle events for the current league if specified
      if (leagueId && detail.leagueId && detail.leagueId !== leagueId) {
        return;
      }

      // Call custom handler if provided
      onCacheInvalidated?.(detail);

      // Auto-refresh queries for the current page/league
      if (leagueId) {
        // Refresh core queries that most pages depend on
        queryClient.invalidateQueries({
          queryKey: queryKeys.league(leagueId)
        });
      }
    };

    const handleSubmissionUpdate = (event: CustomEvent<CacheEventDetail>) => {
      console.log('Submission update detected', event.detail);
      handleCacheInvalidated(event);
    };

    const handleVotingUpdate = (event: CustomEvent<CacheEventDetail>) => {
      console.log('Voting update detected', event.detail);
      handleCacheInvalidated(event);
    };

    const handlePhaseTransition = (event: CustomEvent<CacheEventDetail>) => {
      console.log('Phase transition detected', event.detail);
      handleCacheInvalidated(event);

      // Phase transitions are major events - refresh more aggressively
      if (leagueId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.leaguePrompt(leagueId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.votingData(leagueId)
        });
      }
    };

    const handleMembershipChange = (event: CustomEvent<CacheEventDetail>) => {
      console.log('Membership change detected', event.detail);
      handleCacheInvalidated(event);
    };

    const handleAdminUpdate = (event: CustomEvent<CacheEventDetail>) => {
      console.log('Admin update detected', event.detail);
      handleCacheInvalidated(event);
    };

    const handleLeagueRefresh = (event: CustomEvent<CacheEventDetail>) => {
      console.log('League refresh requested', event.detail);
      handleCacheInvalidated(event);

      // Nuclear option - refresh everything for this league
      if (leagueId) {
        [
          queryKeys.league(leagueId),
          queryKeys.leaguePrompt(leagueId),
          queryKeys.leagueRounds(leagueId),
          queryKeys.leagueSettings(leagueId),
          queryKeys.votingData(leagueId),
        ].forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    };

    // Add event listeners
    window.addEventListener('submissionUpdate', handleSubmissionUpdate as EventListener);
    window.addEventListener('votingUpdate', handleVotingUpdate as EventListener);
    window.addEventListener('phaseTransition', handlePhaseTransition as EventListener);
    window.addEventListener('membershipChange', handleMembershipChange as EventListener);
    window.addEventListener('adminUpdate', handleAdminUpdate as EventListener);
    window.addEventListener('leagueRefresh', handleLeagueRefresh as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('submissionUpdate', handleSubmissionUpdate as EventListener);
      window.removeEventListener('votingUpdate', handleVotingUpdate as EventListener);
      window.removeEventListener('phaseTransition', handlePhaseTransition as EventListener);
      window.removeEventListener('membershipChange', handleMembershipChange as EventListener);
      window.removeEventListener('adminUpdate', handleAdminUpdate as EventListener);
      window.removeEventListener('leagueRefresh', handleLeagueRefresh as EventListener);
    };
  }, [leagueId, enableAutoRefresh, onCacheInvalidated, queryClient]);
}

/**
 * Page-specific cache event listeners for targeted refreshing
 */

export function useChallengeCacheListener(leagueId: string) {
  useCacheEventListener({
    leagueId,
    onCacheInvalidated: (detail) => {
      // Challenge page cares about submissions, voting, and phase transitions
      console.log('Challenge page: Cache invalidated', detail);
    }
  });
}

export function useResultsCacheListener(leagueId: string) {
  const queryClient = useQueryClient();

  useCacheEventListener({
    leagueId,
    onCacheInvalidated: (detail) => {
      // Results page cares about completed rounds and new results
      console.log('Results page: Cache invalidated', detail);

      // Always refresh rounds data when anything changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.leagueRounds(leagueId)
      });
    }
  });
}

export function useStandingsCacheListener(leagueId: string) {
  const queryClient = useQueryClient();

  useCacheEventListener({
    leagueId,
    onCacheInvalidated: (detail) => {
      // Standings page cares about vote results and league changes
      console.log('Standings page: Cache invalidated', detail);

      // Always refresh league data for standings
      queryClient.invalidateQueries({
        queryKey: queryKeys.league(leagueId)
      });
    }
  });
}

export function useLeagueSettingsCacheListener(leagueId: string) {
  const queryClient = useQueryClient();

  useCacheEventListener({
    leagueId,
    onCacheInvalidated: (detail) => {
      // League Settings page cares about admin changes and queue updates
      console.log('League Settings page: Cache invalidated', detail);

      // Always refresh settings data
      queryClient.invalidateQueries({
        queryKey: queryKeys.leagueSettings(leagueId)
      });
    }
  });
}
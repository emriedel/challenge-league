/**
 * Enhanced Cache Invalidation System
 * Provides centralized, type-safe cache invalidation patterns for consistent UI updates
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

/**
 * Cache invalidation patterns for different user actions
 * Each pattern defines which queries need to be invalidated for specific actions
 */
export const invalidationPatterns = {
  // User submission actions
  submission: {
    submit: (leagueId: string) => [
      queryKeys.leaguePrompt(leagueId),     // Update challenge page
      queryKeys.votingData(leagueId),       // May enable voting phase
      queryKeys.league(leagueId),           // Update league stats
      queryKeys.submissionStats(leagueId),  // Update submission counts
      queryKeys.userLeagues(),              // Update action status (home page)
    ],
    update: (leagueId: string) => [
      queryKeys.leaguePrompt(leagueId),     // Update challenge page
      queryKeys.submissionStats(leagueId),  // Update submission counts
      queryKeys.userLeagues(),              // Update action status (home page)
    ],
  },

  // Voting actions
  voting: {
    submit: (leagueId: string) => [
      queryKeys.votingData(leagueId),       // Update voting interface
      queryKeys.league(leagueId),           // Update standings
      queryKeys.leagueRounds(leagueId),     // May complete round
      queryKeys.leaguePrompt(leagueId),     // May trigger next challenge
      queryKeys.userLeagues(),              // Update action status (home page)
    ],
  },

  // Phase transitions (ACTIVE → VOTING → COMPLETED)
  phaseTransition: {
    any: (leagueId: string) => [
      queryKeys.leaguePrompt(leagueId),     // Challenge state changes
      queryKeys.votingData(leagueId),       // Voting availability changes
      queryKeys.league(leagueId),           // League overview updates
      queryKeys.leagueRounds(leagueId),     // Results may be available
      queryKeys.leagueSettings(leagueId),   // Admin view updates
      queryKeys.userLeagues(),              // Update action status (home page)
    ],
  },

  // League membership changes
  membership: {
    join: (leagueId: string) => [
      queryKeys.userLeagues(),              // Update league selector
      queryKeys.league(leagueId),           // Update member count
      queryKeys.leagueSettings(leagueId),   // Update member list
    ],
    leave: (leagueId: string) => [
      queryKeys.userLeagues(),              // Update league selector
      queryKeys.league(leagueId),           // Update member count
      queryKeys.leagueSettings(leagueId),   // Update member list
    ],
  },

  // League settings/admin actions
  admin: {
    promptQueue: (leagueId: string) => [
      queryKeys.leagueSettings(leagueId),   // Update queue display
      queryKeys.leaguePrompt(leagueId),     // May affect current prompt
    ],
    leagueSettings: (leagueId: string) => [
      queryKeys.leagueSettings(leagueId),   // Update settings display
      queryKeys.league(leagueId),           // Update league info
    ],
    startLeague: (leagueId: string) => [
      queryKeys.league(leagueId),           // Update isStarted status
      queryKeys.leaguePrompt(leagueId),     // May activate first prompt
      queryKeys.leagueSettings(leagueId),   // Update admin view
    ],
  },

  // Cross-cutting invalidations for major events
  majorUpdate: {
    // When external cron job processes phase transitions
    cronPhaseTransition: (leagueId: string) => [
      ...invalidationPatterns.phaseTransition.any(leagueId),
      queryKeys.userLeagues(),              // Update action indicators
    ],
    // When results are calculated
    resultsCalculated: (leagueId: string) => [
      queryKeys.league(leagueId),           // Update standings
      queryKeys.leagueRounds(leagueId),     // Show new results
      queryKeys.votingData(leagueId),       // Clear voting state
    ],
  },
} as const;

/**
 * Enhanced cache invalidation utility with better patterns and event system
 */
export class CacheInvalidator {
  private broadcastChannel: BroadcastChannel | null = null;

  constructor(private queryClient: QueryClient) {
    // Initialize BroadcastChannel for cross-tab communication
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('cache-invalidation');
      this.setupBroadcastListener();
    }
  }

  /**
   * Set up listener for cross-tab cache invalidation events
   */
  private setupBroadcastListener() {
    if (!this.broadcastChannel) return;

    this.broadcastChannel.addEventListener('message', (event) => {
      const { type, leagueId, source } = event.data;

      if (type === 'INVALIDATE_LEAGUE_CACHE' && leagueId && source !== 'current-tab') {
        console.log(`🔄 Received cache invalidation broadcast for league ${leagueId}`);
        this.handleLeagueCacheInvalidation(leagueId);
      }
    });
  }

  /**
   * Handle league cache invalidation from broadcast events
   */
  private async handleLeagueCacheInvalidation(leagueId: string) {
    try {
      // Invalidate all league-related queries
      const allLeaguePatterns = [
        queryKeys.league(leagueId),
        queryKeys.leaguePrompt(leagueId),
        queryKeys.leagueRounds(leagueId),
        queryKeys.leagueSettings(leagueId),
        queryKeys.votingData(leagueId),
        queryKeys.userLeagues(),
        queryKeys.userActivity(leagueId), // Include user activity for notification updates
      ];

      await Promise.all(
        allLeaguePatterns.map(queryKey =>
          this.queryClient.invalidateQueries({ queryKey })
        )
      );

      // Trigger UI refresh events
      this.broadcastLeagueActionsRefresh();

      console.log(`✅ Cache invalidated for league ${leagueId} via broadcast`);
    } catch (error) {
      console.error('Failed to handle broadcast cache invalidation:', error);
    }
  }

  /**
   * Invalidate queries based on a predefined pattern
   */
  async invalidateByPattern(
    pattern: readonly unknown[][],
    options?: {
      broadcast?: boolean,
      eventType?: string,
      leagueId?: string,
      crossTab?: boolean
    }
  ) {
    // Invalidate all queries in the pattern
    await Promise.all(
      pattern.map(queryKey =>
        this.queryClient.invalidateQueries({ queryKey })
      )
    );

    // Broadcast event for components that need custom handling
    if (options?.broadcast && typeof window !== 'undefined') {
      const eventType = options.eventType || 'cacheInvalidated';
      window.dispatchEvent(new CustomEvent(eventType, {
        detail: {
          pattern: pattern as unknown[],
          leagueId: options.leagueId,
          timestamp: Date.now()
        }
      }));
    }

    // Broadcast to other tabs if requested
    if (options?.crossTab && options?.leagueId && this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'INVALIDATE_LEAGUE_CACHE',
        leagueId: options.leagueId,
        timestamp: Date.now(),
        source: 'current-tab'
      });
      console.log(`📡 Cache invalidation broadcast sent to other tabs for league ${options.leagueId}`);
    }
  }

  /**
   * Handle user submission actions
   */
  async handleSubmission(action: 'submit' | 'update', leagueId: string) {
    const pattern = invalidationPatterns.submission[action](leagueId);
    await this.invalidateByPattern(pattern, {
      broadcast: true,
      eventType: 'submissionUpdate',
      leagueId
    });

    // Always refresh league actions for nav updates
    this.broadcastLeagueActionsRefresh();
  }

  /**
   * Handle voting actions
   */
  async handleVoting(action: 'submit', leagueId: string) {
    const pattern = invalidationPatterns.voting[action](leagueId);
    await this.invalidateByPattern(pattern, {
      broadcast: true,
      eventType: 'votingUpdate',
      leagueId
    });

    // Always refresh league actions for nav updates
    this.broadcastLeagueActionsRefresh();
  }

  /**
   * Handle phase transitions (for admin actions or cron jobs)
   */
  async handlePhaseTransition(leagueId: string, source: 'admin' | 'cron' = 'admin') {
    const pattern = source === 'cron'
      ? invalidationPatterns.majorUpdate.cronPhaseTransition(leagueId)
      : invalidationPatterns.phaseTransition.any(leagueId);

    await this.invalidateByPattern(pattern, {
      broadcast: true,
      eventType: 'phaseTransition',
      leagueId
    });

    // Always refresh league actions for nav updates
    this.broadcastLeagueActionsRefresh();
  }

  /**
   * Handle league membership changes
   */
  async handleMembership(action: 'join' | 'leave', leagueId: string) {
    const pattern = invalidationPatterns.membership[action](leagueId);
    await this.invalidateByPattern(pattern, {
      broadcast: true,
      eventType: 'membershipChange',
      leagueId
    });

    // Always refresh league actions for nav updates
    this.broadcastLeagueActionsRefresh();
  }

  /**
   * Handle admin/settings actions
   */
  async handleAdmin(
    action: 'promptQueue' | 'leagueSettings' | 'startLeague',
    leagueId: string
  ) {
    const pattern = invalidationPatterns.admin[action](leagueId);

    // Enable cross-tab broadcasting for league start events
    const enableCrossTab = action === 'startLeague';

    await this.invalidateByPattern(pattern, {
      broadcast: true,
      eventType: 'adminUpdate',
      leagueId,
      crossTab: enableCrossTab
    });

    // Refresh league actions for nav updates when relevant
    if (action === 'startLeague' || action === 'promptQueue') {
      this.broadcastLeagueActionsRefresh();
    }
  }

  /**
   * Broadcast league actions refresh (maintains compatibility with existing system)
   */
  private broadcastLeagueActionsRefresh() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('refreshLeagueActions'));
    }
  }

  /**
   * Force refresh all queries for a specific league (nuclear option)
   */
  async refreshLeague(leagueId: string) {
    const allLeaguePatterns = [
      queryKeys.league(leagueId),
      queryKeys.leaguePrompt(leagueId),
      queryKeys.leagueRounds(leagueId),
      queryKeys.leagueSettings(leagueId),
      queryKeys.votingData(leagueId),
      queryKeys.userLeagues(),
      queryKeys.userActivity(leagueId), // Include user activity for notification updates
    ];

    await this.invalidateByPattern(allLeaguePatterns, {
      broadcast: true,
      eventType: 'leagueRefresh',
      leagueId
    });

    this.broadcastLeagueActionsRefresh();
  }
}

/**
 * Hook to get a configured cache invalidator instance
 */
import { useQueryClient } from '@tanstack/react-query';

export function useCacheInvalidator() {
  const queryClient = useQueryClient();
  return new CacheInvalidator(queryClient);
}

/**
 * Legacy compatibility - maintain existing refreshLeagueActions function
 */
export function refreshLeagueActions() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('refreshLeagueActions'));
  }
}
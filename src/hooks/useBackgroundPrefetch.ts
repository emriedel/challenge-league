'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

/**
 * Background prefetching hook for Chat and League Settings pages
 * Prefetches data for these pages when the user is on other tabs
 */
export function useBackgroundPrefetch(leagueId: string, currentPath?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!leagueId) return;

    const prefetchData = async () => {
      try {
        // Only prefetch if we're not already on these pages
        const isChatPage = currentPath?.includes('/chat');
        const isSettingsPage = currentPath?.includes('/league-settings');

        // Prefetch Chat data (messages and connection info)
        if (!isChatPage) {
          await queryClient.prefetchQuery({
            queryKey: ['league', leagueId, 'chat', 'initial'],
            queryFn: async () => {
              const response = await fetch(`/api/leagues/${leagueId}/chat`);
              if (!response.ok) throw new Error('Failed to fetch chat data');
              return response.json();
            },
            staleTime: 30 * 1000, // 30 seconds - chat data is relatively fresh
          });
        }

        // Prefetch League Settings data
        if (!isSettingsPage) {
          await queryClient.prefetchQuery({
            queryKey: queryKeys.leagueSettings(leagueId),
            queryFn: async () => {
              const response = await fetch(`/api/leagues/${leagueId}/settings`);
              if (!response.ok) throw new Error('Failed to fetch league settings');
              return response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes - settings change less frequently
          });
        }
      } catch (error) {
        // Silently fail prefetching - it's not critical
        console.debug('Background prefetch failed:', error);
      }
    };

    // Prefetch after a short delay to not interfere with current page loading
    const timer = setTimeout(prefetchData, 1000);
    return () => clearTimeout(timer);
  }, [leagueId, currentPath, queryClient]);
}

/**
 * Hook to prefetch all navigation targets for smoother transitions
 * Called from the main league layout or navigation components
 */
export function usePrefetchNavigationTargets(leagueId: string, currentPath?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!leagueId) return;

    const prefetchAllTargets = async () => {
      const isOnChallenge = currentPath === `/app/league/${leagueId}` || currentPath?.endsWith(`/league/${leagueId}`);
      const isOnResults = currentPath?.includes('/rounds');
      const isOnStandings = currentPath?.includes('/standings');
      const isOnChat = currentPath?.includes('/chat');
      const isOnSettings = currentPath?.includes('/league-settings');

      try {
        // Prefetch all major navigation targets that aren't currently active
        const prefetchPromises = [];

        if (!isOnChallenge) {
          prefetchPromises.push(
            queryClient.prefetchQuery({
              queryKey: queryKeys.leaguePrompt(leagueId),
              queryFn: async () => {
                const response = await fetch(`/api/leagues/${leagueId}/prompt`);
                if (!response.ok) throw new Error('Failed to prefetch challenge');
                return response.json();
              },
            })
          );
        }

        if (!isOnResults) {
          prefetchPromises.push(
            queryClient.prefetchQuery({
              queryKey: queryKeys.leagueRounds(leagueId),
              queryFn: async () => {
                const response = await fetch(`/api/responses?id=${leagueId}`);
                if (!response.ok) throw new Error('Failed to prefetch results');
                return response.json();
              },
            })
          );
        }

        if (!isOnStandings) {
          prefetchPromises.push(
            queryClient.prefetchQuery({
              queryKey: queryKeys.leagueStandings(leagueId),
              queryFn: async () => {
                const response = await fetch(`/api/leagues/${leagueId}/standings`);
                if (!response.ok) throw new Error('Failed to prefetch standings');
                return response.json();
              },
            })
          );
        }

        if (!isOnChat) {
          prefetchPromises.push(
            queryClient.prefetchQuery({
              queryKey: ['league', leagueId, 'chat', 'initial'],
              queryFn: async () => {
                const response = await fetch(`/api/leagues/${leagueId}/chat`);
                if (!response.ok) throw new Error('Failed to prefetch chat');
                return response.json();
              },
              staleTime: 30 * 1000,
            })
          );
        }

        if (!isOnSettings) {
          prefetchPromises.push(
            queryClient.prefetchQuery({
              queryKey: queryKeys.leagueSettings(leagueId),
              queryFn: async () => {
                const response = await fetch(`/api/leagues/${leagueId}/settings`);
                if (!response.ok) throw new Error('Failed to prefetch settings');
                return response.json();
              },
            })
          );
        }

        // Execute all prefetches in parallel
        await Promise.allSettled(prefetchPromises);
      } catch (error) {
        // Silently fail - prefetching is not critical
        console.debug('Navigation prefetch failed:', error);
      }
    };

    // Start prefetching after page is loaded
    const timer = setTimeout(prefetchAllTargets, 2000);
    return () => clearTimeout(timer);
  }, [leagueId, currentPath, queryClient]);
}
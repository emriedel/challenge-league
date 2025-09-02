import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query client configuration for optimal caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes when unused
      gcTime: 10 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2,
      // Don't refetch on window focus for better mobile experience
      refetchOnWindowFocus: false,
      // Refetch on reconnect to get fresh data
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on network errors
      retry: 1,
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  // League-related queries
  league: (leagueId: string) => ['league', leagueId],
  leaguePrompt: (leagueId: string) => ['league', leagueId, 'prompt'],
  leagueStandings: (leagueId: string) => ['league', leagueId, 'standings'],
  leagueRounds: (leagueId: string) => ['league', leagueId, 'rounds'],
  leagueSettings: (leagueId: string) => ['league', leagueId, 'settings'],
  
  // User-specific queries
  userLeagues: () => ['user', 'leagues'],
  userResponse: (promptId: string) => ['user', 'response', promptId],
  
  // Voting queries
  votingData: (leagueId: string) => ['voting', leagueId],
} as const;

/**
 * Cache time configurations for different data types
 */
export const cacheConfig = {
  // Static data that changes infrequently
  static: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  },
  
  // Dynamic data that changes regularly
  dynamic: {
    staleTime: 30 * 1000,      // 30 seconds
    gcTime: 2 * 60 * 1000,     // 2 minutes
  },
  
  // Real-time data during active periods (voting, submissions)
  realTime: {
    staleTime: 10 * 1000,      // 10 seconds
    gcTime: 30 * 1000,         // 30 seconds
  },
  
  // User-specific data
  user: {
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 5 * 60 * 1000,     // 5 minutes
  },
} as const;
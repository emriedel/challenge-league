'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/queryClient';

interface Prompt {
  id: string;
  text: string;
  phaseStartedAt: string | null;
  status: 'SCHEDULED' | 'ACTIVE' | 'VOTING' | 'COMPLETED';
  queueOrder: number;
  createdAt: string;
}

interface PromptQueue {
  active: Prompt[];
  voting: Prompt[];
  scheduled: Prompt[];
  completed: Prompt[];
}

interface PhaseTransitionInfo {
  currentPhase: {
    type: 'ACTIVE' | 'VOTING' | 'NONE';
    prompt?: string;
    endTime?: string;
  };
  nextPhase: {
    type: 'VOTING' | 'COMPLETED' | 'NEW_ACTIVE';
    prompt?: string;
  };
}

interface LeagueSettingsData {
  league: {
    id: string;
    name: string;
    description: string | null;
    isOwner: boolean;
    memberCount: number;
    inviteCode: string;
    // Configurable settings
    submissionDays: number;
    votingDays: number;
    votesPerPlayer: number;
  };
  queue: PromptQueue;
  phaseInfo: PhaseTransitionInfo;
}

/**
 * Cached hook for league settings data
 * Uses static cache config since league info doesn't change frequently
 */
export function useLeagueSettingsQuery(leagueId?: string) {
  return useQuery({
    queryKey: queryKeys.leagueSettings(leagueId!),
    queryFn: async (): Promise<LeagueSettingsData> => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/settings`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view league settings');
        }
        if (response.status === 403) {
          throw new Error('Access denied - member access only');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch league settings');
      }

      return response.json();
    },
    enabled: !!leagueId,
    ...cacheConfig.static, // League settings change infrequently
  });
}

/**
 * Mutation for creating a new prompt
 */
export function useCreatePromptMutation(leagueId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promptText: string) => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/admin/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: promptText.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create prompt');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refresh league settings data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leagueSettings(leagueId!) 
      });
    },
  });
}

/**
 * Mutation for updating a prompt
 */
export function useUpdatePromptMutation(leagueId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ promptId, text }: { promptId: string; text: string }) => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/admin/prompts/${promptId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update prompt');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leagueSettings(leagueId!) 
      });
    },
  });
}

/**
 * Mutation for deleting a prompt
 */
export function useDeletePromptMutation(leagueId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promptId: string) => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/admin/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete prompt');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leagueSettings(leagueId!) 
      });
    },
  });
}

/**
 * Mutation for reordering prompts
 */
export function useReorderPromptsMutation(leagueId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promptIds: string[]) => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/admin/prompts/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reorder prompts');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leagueSettings(leagueId!) 
      });
    },
  });
}

/**
 * Mutation for transitioning to next phase
 */
export function useTransitionPhaseMutation(leagueId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/admin/transition-phase`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to transition phase');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refresh multiple queries since phase transition affects various data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leagueSettings(leagueId!) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.league(leagueId!) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leaguePrompt(leagueId!) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.votingData(leagueId!) 
      });
    },
  });
}

/**
 * Mutation for updating league settings
 */
export function useUpdateLeagueSettingsMutation(leagueId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: { submissionDays?: number; votingDays?: number; votesPerPlayer?: number }) => {
      if (!leagueId) {
        throw new Error('League ID is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update league settings');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refresh league settings data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leagueSettings(leagueId!) 
      });
      // Refresh main league data since settings are part of league data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.league(leagueId!) 
      });
      // Also refresh voting data since votesPerPlayer might have changed
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.votingData(leagueId!) 
      });
      // Refresh league prompt data since phase calculations use the settings
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.leaguePrompt(leagueId!) 
      });
    },
  });
}
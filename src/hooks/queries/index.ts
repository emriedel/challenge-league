/**
 * Cached query hooks using TanStack Query
 * These replace the original hooks with smart caching for better performance
 */

// League data hooks
export {
  useLeagueQuery,
  useLeagueStandingsQuery,
  useJoinLeagueMutation,
} from './useLeagueQuery';

// Voting hooks
export {
  useVotingQuery,
  useSubmitVotesMutation,
} from './useVotingQuery';

// Rounds/Gallery hooks
export {
  useRoundsQuery,
  useRoundQuery,
} from './useRoundsQuery';

// Prompt hooks
export {
  useLeaguePromptQuery,
  useSubmitResponseMutation,
  useUserResponseQuery,
} from './usePromptQuery';

// League Settings hooks
export {
  useLeagueSettingsQuery,
  useCreatePromptMutation,
  useUpdatePromptMutation,
  useDeletePromptMutation,
  useReorderPromptsMutation,
  useTransitionPhaseMutation,
} from './useLeagueSettingsQuery';
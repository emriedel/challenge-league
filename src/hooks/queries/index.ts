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

// League actions hooks
export {
  useLeagueActionsQuery,
} from './useLeagueActionsQuery';

// Voting hooks
export {
  useVotingQuery,
  useSubmitVotesMutation,
} from './useVotingQuery';

// Rounds/Gallery hooks
export {
  useRoundsQuery,
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
  useUpdateLeagueSettingsMutation,
  useLeaveLeagueMutation,
  useDeleteLeagueMutation,
} from './useLeagueSettingsQuery';

// Chat hooks
export {
  useChatInitialQuery,
} from './useChatQuery';

// Submission hooks
export {
  useSubmissionStatsQuery,
} from './useSubmissionStatsQuery';
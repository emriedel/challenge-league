/**
 * Main type exports for Challenge League
 * 
 * This file provides a centralized way to import all types used throughout
 * the application. Import specific types from their modules or use this
 * barrel export for convenience.
 */

// User types
export type {
  BaseUser,
  User,
  UserStats,
  LeagueUser,
  UserProfile,
  AuthUser,
} from './user';

// League types
export type {
  League,
  LeagueData,
  LeaderboardEntry,
} from './league';

// Prompt/Challenge types
export type {
  BasePrompt,
  Prompt,
  VotingPrompt,
  ResultsPrompt,
  PromptWithStats,
  PromptQueue,
} from './prompt';

// Response/Submission types
export type {
  BaseResponse,
  Response,
  VotingResponse,
  ResultsResponse,
  GalleryResponse,
  UserResponse,
  ResponseSubmission,
  ResponseUpdate,
} from './response';

// Vote types
export type {
  BaseVote,
  Vote,
  VoteMap,
  ExistingVote,
  VoteSummary,
  VotingSession,
} from './vote';

// API types
export type {
  APIResponse,
  PaginatedResponse,
  APIError,
  RouteParams,
  LeagueRouteParams,
  RoundRouteParams,
  UploadResponse,
  AuthResponse,
  VoteSubmissionResponse,
} from './api';

// Hook types
export type {
  UseAsyncReturn,
  UseLeagueReturn,
  VotingData,
  UseVotingReturn,
  GalleryData,
  UseGalleryReturn,
  PromptData,
  UseLeaguePromptReturn,
  Message,
  UseMessagesReturn,
  UseSubmissionManagementReturn,
  UseVotingManagementReturn,
} from './hooks';

// Component types
export type {
  BaseComponentProps,
  VotingInterfaceProps,
  CurrentChallengeProps,
  UserSubmissionDisplayProps,
  ProfileAvatarProps,
  LeagueNavigationProps,
  PhotoUploadProps,
  SubmissionFormProps,
  ErrorBoundaryProps,
  PageErrorFallbackProps,
} from './components';

// Utility type helpers
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type PromptStatus = 'SCHEDULED' | 'ACTIVE' | 'VOTING' | 'COMPLETED';
export type MessageType = 'success' | 'error';
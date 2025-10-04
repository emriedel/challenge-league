/**
 * Hook-related type definitions
 */

import type { LeagueData } from './league';
import type { Response, VotingResponse, GalleryResponse, UserResponse } from './response';
import type { Prompt, VotingPrompt } from './prompt';
import type { VoteMap } from './vote';

// Base async hook return type
export interface UseAsyncReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// League hook return type
export interface UseLeagueReturn extends UseAsyncReturn<LeagueData> {}

// Voting hook data and return types
export interface VotingData {
  canVote: boolean;
  responses: VotingResponse[];
  prompt?: VotingPrompt | null;
  voteEnd?: string;
  userHasVoted: boolean;
  existingVotes: VoteMap;
  votableResponseIds?: string[]; // IDs of responses that can be voted on
  currentUserId?: string; // Current user's ID for frontend logic
  selfVote?: { responseId: string } | null; // User's self-vote (free vote for own submission)
}

export interface UseVotingReturn extends UseAsyncReturn<VotingData> {
  submitVotes: (votes: VoteMap) => Promise<{ success: boolean; error?: string }>;
}

// Gallery hook data and return types
export interface GalleryData {
  responses: GalleryResponse[];
  prompt?: {
    id: string;
    text: string;
    weekStart: string;
    weekEnd: string;
  };
  rounds: Array<{
    id: string;
    text: string;
    weekEnd: string;
    responses: GalleryResponse[];
  }>;
}

export interface UseGalleryReturn extends UseAsyncReturn<GalleryData> {}

// League prompt hook data and return types
export interface PromptData {
  prompt: Prompt | null;
  userResponse: UserResponse | null;
  canSubmit: boolean;
  isExpired: boolean;
}

export interface UseLeaguePromptReturn extends UseAsyncReturn<PromptData> {}

// Message hook types
export interface Message {
  type: 'success' | 'error';
  text: string;
}

export interface UseMessagesReturn {
  messages: { [key: string]: Message };
  addMessage: (key: string, message: Message) => void;
  clearMessage: (key: string) => void;
  clearAllMessages: () => void;
  setSubmissionMessage: (message: Message) => void;
  setVotingMessage: (message: Message) => void;
  submissionMessage?: Message;
  votingMessage?: Message;
}

// Submission management hook types
export interface UseSubmissionManagementReturn {
  isSubmitting: boolean;
  submitResponse: (data: { photo: File; caption: string }) => Promise<void>;
  updateResponse: (data: { photo?: File; caption: string }, currentImageUrl: string) => Promise<void>;
}

// Voting management hook types
export interface UseVotingManagementReturn {
  selectedVotes: VoteMap;
  isSubmitting: boolean;
  handleVoteSelection: (responseId: string, increment: boolean) => void;
  getTotalVotes: () => number;
  submitVotes: (votingData: { submitVotes: (votes: VoteMap) => Promise<{ success: boolean; error?: string }> }) => Promise<void>;
  resetVotes: () => void;
}
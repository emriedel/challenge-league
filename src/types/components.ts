/**
 * Component prop type definitions
 */

import type { Message } from './hooks';
import type { VotingData, GalleryData } from './hooks';
import type { BasePrompt, Prompt, VotingPrompt } from './prompt';
import type { ResultsResponse, UserResponse } from './response';
import type { BaseUser } from './user';
import type { VoteMap } from './vote';

// Common component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Voting Interface component props
export interface VotingInterfaceProps {
  votingData: VotingData;
  onSubmitVotes: (votes: VoteMap) => Promise<void>;
  isSubmitting: boolean;
  message?: Message | null;
  leagueSettings?: {
    submissionDays: number;
    votingDays: number;
    votesPerPlayer: number;
  };
  onVoteCountChange?: (count: number) => void;
  onVisibilityChange?: (isBottomVisible: boolean) => void;
}

// Current Challenge component props
export interface CurrentChallengeProps {
  votingData?: {
    prompt?: VotingPrompt | null;
    voteEnd?: string; // Calculated dynamically by API
    existingVotes?: any[]; // For determining userHasVoted
  };
  promptData?: {
    prompt: Prompt;
  };
  showVoting: boolean;
  showSubmission: boolean;
  showSubmitted: boolean;
  leagueSettings?: {
    submissionDays: number;
    votingDays: number;
    votesPerPlayer: number;
  };
  submissionFormSlot?: React.ReactNode;
}


// User Submission Display component props
export interface UserSubmissionDisplayProps {
  userResponse: UserResponse;
  user: BaseUser;
  onUpdate: (data: { photo?: File; caption: string }) => Promise<void>;
  isUpdating: boolean;
  message?: Message | null;
}


// Profile Avatar component props
export interface ProfileAvatarProps {
  username: string;
  profilePhoto?: string | null;
  size: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// League Navigation component props
export interface LeagueNavigationProps {
  leagueId: string;
  leagueName: string;
  isOwner?: boolean;
}

// Photo Upload component props
export interface PhotoUploadProps {
  onPhotoSelected: (file: File | null, previewUrl: string) => void;
  onError?: (error: string) => void;
  selectedPhoto?: File | null;
  previewUrl?: string | null;
  disabled?: boolean;
}

// Submission Form component props
export interface SubmissionFormProps {
  prompt: BasePrompt;
  onSubmit: (data: { photo: File; caption: string }) => void;
  isSubmitting?: boolean;
}

// Error Boundary props
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: ({ error, resetError }: { error: Error; resetError: () => void }) => React.ReactNode;
}

// Page Error Fallback props
export interface PageErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
}
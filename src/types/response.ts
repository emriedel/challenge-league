/**
 * Response/Submission-related type definitions
 */

import type { BaseUser } from './user';
import type { Comment } from './comment';

// Base response interface with core properties
export interface BaseResponse {
  id: string;
  caption: string;
  imageUrl: string;
  submittedAt: string;
  user: BaseUser;
}

// Full response with voting and ranking data
export interface Response extends BaseResponse {
  isPublished: boolean;
  publishedAt?: string | null;
  totalVotes: number;
  totalPoints: number;
  finalRank?: number | null;
  promptId: string;
}

// Response during voting phase
export interface VotingResponse extends BaseResponse {
  comments?: Comment[];
  commentCount?: number;
}

// Response for results display
export interface ResultsResponse extends BaseResponse {
  totalPoints: number;
  finalRank?: number;
  comments?: Comment[];
  commentCount?: number;
}

// Response for gallery display with full details
export interface GalleryResponse extends Response {
  publishedAt: string | null;
  votes: Array<{
    userId: string;
    points: number;
  }>;
}

// User's own response with edit capabilities
export interface UserResponse extends BaseResponse {
  canEdit: boolean;
  isOwn: boolean;
}

// Response submission data
export interface ResponseSubmission {
  promptId: string;
  photoUrl: string;
  caption: string;
  leagueId: string;
}

// Response update data
export interface ResponseUpdate {
  caption: string;
  photoUrl?: string;
}
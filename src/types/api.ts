/**
 * API-related type definitions
 */

// Standard API response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated API response
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// API error response
export interface APIError {
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, any>;
}

// Next.js route parameters
export interface RouteParams {
  params: { [key: string]: string };
}

// Common route parameter types
export interface LeagueRouteParams {
  params: { leagueId: string };
}

export interface RoundRouteParams {
  params: { leagueId: string; roundId: string };
}

// File upload response
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

// Authentication responses
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
  };
  token?: string;
}

// Vote submission response
export interface VoteSubmissionResponse extends APIResponse {
  votesSubmitted: number;
  totalVotes: number;
}
/**
 * League-related type definitions
 */

import type { BaseUser, UserStats } from './user';

export interface League {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  isOwner: boolean;
  isStarted?: boolean; // Whether the league has been started by the owner
  inviteCode?: string; // Only shown to owners
  owner?: {
    id: string;
    username: string;
  };
  // Configurable league settings
  submissionDays: number;
  votingDays: number;
  votesPerPlayer: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Action status
  needsAction?: boolean;
  actionType?: 'submission' | 'voting' | null;
  // Current prompt information
  currentPrompt?: {
    id: string;
    text: string;
    status: 'ACTIVE' | 'VOTING';
    challengeNumber: number;
    phaseEndsAt?: Date;
  } | null;
}

// Extended league type with additional member information
export interface LeagueWithMembers extends League {
  memberships?: {
    userId: string;
    leagueId: string;
    isActive: boolean;
    user: {
      id: string;
      username: string;
    };
  }[];
}

// Leaderboard entry for league standings
export interface LeaderboardEntry {
  user: BaseUser;
  stats: UserStats;
}

// League data with leaderboard
export interface LeagueData {
  league: League;
  leaderboard: LeaderboardEntry[];
}

// Type for league creation responses
export interface CreateLeagueResponse {
  league: League;
}

// Type for joining league responses
export interface JoinLeagueResponse {
  league: League;
}
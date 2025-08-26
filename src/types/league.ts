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
/**
 * User-related type definitions
 */

// Base user interface with core properties
export interface BaseUser {
  id: string;
  username: string;
  profilePhoto?: string | null;
}

// Full user interface with additional properties
export interface User extends BaseUser {
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// User statistics for leaderboards and profiles
export interface UserStats {
  totalVotes: number;
  totalSubmissions: number;
  wins: number;
  podiumFinishes: number;
  averageRank: number;
  leagueRank: number;
  // New fields for "no vote, no points" rule
  votingParticipation: number; // Number of rounds the user voted in
  totalCompletedRounds: number; // Total completed rounds in the league
}

// League member with user info and stats
export interface LeagueUser extends BaseUser {
  stats: UserStats;
}

// User profile data for editing/display
export interface UserProfile {
  username: string;
  email: string;
  profilePhoto?: string | null;
  createdAt: Date;
}

// Authentication user type (extends NextAuth User)
export interface AuthUser extends BaseUser {
  email: string;
}
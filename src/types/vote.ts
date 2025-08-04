/**
 * Vote-related type definitions
 */

// Base vote interface
export interface BaseVote {
  id: string;
  userId: string;
  responseId: string;
  points: number;
}

// Full vote with metadata
export interface Vote extends BaseVote {
  createdAt: string;
  promptId: string;
}

// Vote submission map (responseId -> points)
export interface VoteMap {
  [responseId: string]: number;
}

// Existing user vote for a prompt
export interface ExistingVote {
  responseId: string;
  points: number;
}

// Vote summary for a response
export interface VoteSummary {
  totalVotes: number;
  totalPoints: number;
  voterUsernames: string[];
}

// Voting session data
export interface VotingSession {
  promptId: string;
  userId: string;
  totalVotesUsed: number;
  maxVotes: number;
  votes: VoteMap;
  submittedAt?: string;
}
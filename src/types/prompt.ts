/**
 * Prompt/Challenge-related type definitions
 */

// Base prompt interface
export interface BasePrompt {
  id: string;
  text: string;
  phaseStartedAt: string | null;
  status: 'SCHEDULED' | 'ACTIVE' | 'VOTING' | 'COMPLETED';
}

// Full prompt with status and metadata
export interface Prompt extends BasePrompt {
  challengeNumber: number;
  createdAt: string;
  leagueId?: string;
}

// Simplified prompt for voting display
export interface VotingPrompt {
  id?: string;
  text: string;
  challengeNumber?: number; // Challenge number for display
}

// Simplified prompt for results display
export interface ResultsPrompt {
  id: string;
  text: string;
}

// Prompt with response count for admin views
export interface PromptWithStats extends Prompt {
  responseCount: number;
  completedAt?: string;
}

// Queue management types
export interface PromptQueue {
  active: Prompt[];
  voting: Prompt[];
  scheduled: Prompt[];
  completed: Prompt[];
}
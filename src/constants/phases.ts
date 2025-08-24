/**
 * Global phase duration configuration
 * Change these values to adjust how long each phase lasts
 */
export const PHASE_DURATIONS = {
  /** Duration of the submission phase in days */
  SUBMISSION_PHASE_DAYS: 7,
  
  /** Duration of the voting phase in days */
  VOTING_PHASE_DAYS: 2,
} as const;

/**
 * Global voting configuration
 * Change these values to adjust how voting works
 */
export const VOTING_CONFIG = {
  /** Number of votes each player gets per challenge */
  VOTES_PER_PLAYER: 3,
  
  /** Points awarded per vote */
  POINTS_PER_VOTE: 1,
} as const;

/** Total cycle duration in days */
export const TOTAL_CYCLE_DAYS = 
  PHASE_DURATIONS.SUBMISSION_PHASE_DAYS + 
  PHASE_DURATIONS.VOTING_PHASE_DAYS;

/** Phase duration in milliseconds for calculations */
export const PHASE_DURATIONS_MS = {
  SUBMISSION_PHASE: PHASE_DURATIONS.SUBMISSION_PHASE_DAYS * 24 * 60 * 60 * 1000,
  VOTING_PHASE: PHASE_DURATIONS.VOTING_PHASE_DAYS * 24 * 60 * 60 * 1000,
} as const;
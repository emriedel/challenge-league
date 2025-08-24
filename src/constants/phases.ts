/**
 * Global phase duration configuration
 * Change these values to adjust how long each phase lasts
 */
export const PHASE_DURATIONS = {
  /** Duration of the submission phase in days */
  SUBMISSION_PHASE_DAYS: 7,
  
  /** Duration of the voting phase in days */
  VOTING_PHASE_DAYS: 2,
  
  /** Duration of the results phase in days (before next challenge starts) */
  RESULTS_PHASE_DAYS: 5,
} as const;

/** Total cycle duration in days */
export const TOTAL_CYCLE_DAYS = 
  PHASE_DURATIONS.SUBMISSION_PHASE_DAYS + 
  PHASE_DURATIONS.VOTING_PHASE_DAYS + 
  PHASE_DURATIONS.RESULTS_PHASE_DAYS;

/** Phase duration in milliseconds for calculations */
export const PHASE_DURATIONS_MS = {
  SUBMISSION_PHASE: PHASE_DURATIONS.SUBMISSION_PHASE_DAYS * 24 * 60 * 60 * 1000,
  VOTING_PHASE: PHASE_DURATIONS.VOTING_PHASE_DAYS * 24 * 60 * 60 * 1000,
  RESULTS_PHASE: PHASE_DURATIONS.RESULTS_PHASE_DAYS * 24 * 60 * 60 * 1000,
} as const;
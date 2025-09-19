import { PHASE_DURATIONS_MS, CRON_CONFIG } from '@/constants/phases';

export interface PromptWithPhase {
  id: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'VOTING' | 'COMPLETED';
  phaseStartedAt: Date | null;
}

export interface LeagueSettings {
  submissionDays: number;
  votingDays: number;
  votesPerPlayer: number;
}

/**
 * Calculate when the current phase ends using league settings
 */
export function getPhaseEndTime(prompt: PromptWithPhase, leagueSettings?: LeagueSettings): Date | null {
  if (!prompt.phaseStartedAt) return null;

  const phaseStart = new Date(prompt.phaseStartedAt);
  let phaseDurationDays: number;

  switch (prompt.status) {
    case 'ACTIVE':
      phaseDurationDays = leagueSettings?.submissionDays ?? (PHASE_DURATIONS_MS.SUBMISSION_PHASE / (24 * 60 * 60 * 1000));
      break;
    case 'VOTING':
      phaseDurationDays = leagueSettings?.votingDays ?? (PHASE_DURATIONS_MS.VOTING_PHASE / (24 * 60 * 60 * 1000));
      break;
    default:
      return null;
  }

  const phaseDurationMs = phaseDurationDays * 24 * 60 * 60 * 1000;
  return new Date(phaseStart.getTime() + phaseDurationMs);
}

/**
 * Check if the current phase has expired
 */
export function isPhaseExpired(prompt: PromptWithPhase, leagueSettings?: LeagueSettings): boolean {
  const endTime = getPhaseEndTime(prompt, leagueSettings);
  if (!endTime) return false;
  
  return new Date() >= endTime;
}

/**
 * Check if submissions are currently open
 */
export function isSubmissionWindowOpen(prompt: PromptWithPhase, leagueSettings?: LeagueSettings): boolean {
  return prompt.status === 'ACTIVE' && !isPhaseExpired(prompt, leagueSettings);
}

/**
 * Get time remaining until current phase ends
 */
export function getTimeUntilPhaseEnd(prompt: PromptWithPhase, leagueSettings?: LeagueSettings): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const endTime = getPhaseEndTime(prompt, leagueSettings);
  
  if (!endTime) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, isExpired: false };
}

/**
 * Get time remaining until submission deadline (for backward compatibility)
 */
export function getTimeUntilSubmissionDeadline(prompt: PromptWithPhase, leagueSettings?: LeagueSettings) {
  return getTimeUntilPhaseEnd(prompt, leagueSettings);
}

/**
 * Get the next phase for a prompt
 */
export function getNextPhase(currentStatus: 'SCHEDULED' | 'ACTIVE' | 'VOTING' | 'COMPLETED'): 'ACTIVE' | 'VOTING' | 'COMPLETED' | null {
  switch (currentStatus) {
    case 'SCHEDULED':
      return 'ACTIVE';
    case 'ACTIVE':
      return 'VOTING';
    case 'VOTING':
      return 'COMPLETED';
    case 'COMPLETED':
      return null;
    default:
      return null;
  }
}

/**
 * Calculate when a phase will end based on when it started and the phase type
 */
export function calculatePhaseEndTime(phaseStartedAt: Date, status: 'ACTIVE' | 'VOTING', leagueSettings?: LeagueSettings): Date {
  let durationDays: number;
  
  if (status === 'ACTIVE') {
    durationDays = leagueSettings?.submissionDays ?? (PHASE_DURATIONS_MS.SUBMISSION_PHASE / (24 * 60 * 60 * 1000));
  } else {
    durationDays = leagueSettings?.votingDays ?? (PHASE_DURATIONS_MS.VOTING_PHASE / (24 * 60 * 60 * 1000));
  }
  
  const durationMs = durationDays * 24 * 60 * 60 * 1000;
  return new Date(phaseStartedAt.getTime() + durationMs);
}

/**
 * Get the next cron execution time at exact hour boundary (19:00 UTC)
 */
function getNextCronExecution(fromDate: Date = new Date()): Date {
  // Cron runs at 19:00 UTC daily (which is 12:00 PM PDT / 11:00 AM PST)
  const today = new Date(fromDate);
  const todayCronTime = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
    19, // 19:00 UTC = exact cron hour
    0,
    0,
    0
  ));

  // If we're past today's cron time, move to tomorrow
  if (fromDate >= todayCronTime) {
    const tomorrowCronTime = new Date(todayCronTime);
    tomorrowCronTime.setUTCDate(tomorrowCronTime.getUTCDate() + 1);
    return tomorrowCronTime;
  }

  return todayCronTime;
}

/**
 * Normalize a timestamp to the nearest cron execution hour (19:00 UTC)
 * This ensures all phase times align with actual cron execution times
 */
function normalizeToCronHour(timestamp: Date): Date {
  return new Date(Date.UTC(
    timestamp.getUTCFullYear(),
    timestamp.getUTCMonth(),
    timestamp.getUTCDate(),
    19, // Always normalize to 19:00 UTC (cron execution time)
    0,
    0,
    0
  ));
}

/**
 * Calculate when the phase will ACTUALLY end (next cron run after theoretical end time)
 * This is what should be displayed to users since phases only process during cron runs
 * Now always returns times at exact hour boundaries
 */
export function getRealisticPhaseEndTime(prompt: PromptWithPhase, leagueSettings?: LeagueSettings): Date | null {
  if (!prompt.phaseStartedAt) return null;

  // Normalize the phase start time to cron hour boundary
  const normalizedStart = normalizeToCronHour(new Date(prompt.phaseStartedAt));

  let phaseDurationDays: number;
  switch (prompt.status) {
    case 'ACTIVE':
      phaseDurationDays = leagueSettings?.submissionDays ?? (PHASE_DURATIONS_MS.SUBMISSION_PHASE / (24 * 60 * 60 * 1000));
      break;
    case 'VOTING':
      phaseDurationDays = leagueSettings?.votingDays ?? (PHASE_DURATIONS_MS.VOTING_PHASE / (24 * 60 * 60 * 1000));
      break;
    default:
      return null;
  }

  // Calculate end time based on normalized start + duration
  const phaseDurationMs = phaseDurationDays * 24 * 60 * 60 * 1000;
  const theoreticalEndTime = new Date(normalizedStart.getTime() + phaseDurationMs);

  // Return the theoretical end time (already aligned to cron hour boundary)
  return theoreticalEndTime;
}

/**
 * Check if a phase will expire in the next cron run (24 hours)
 * Used to determine when to send 24-hour warning notifications
 */
export function willPhaseExpireInNextCronRun(prompt: PromptWithPhase, leagueSettings?: LeagueSettings): boolean {
  const nextCronTime = getNextCronExecution();
  const phaseEndTime = getPhaseEndTime(prompt, leagueSettings);
  
  if (!phaseEndTime) return false;
  
  // Phase will expire if its end time is before or at the next cron run
  return phaseEndTime <= nextCronTime;
}
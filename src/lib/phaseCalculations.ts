import { PHASE_DURATIONS_MS, CRON_CONFIG } from '@/constants/phases';

export interface PromptWithPhase {
  id: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'VOTING' | 'COMPLETED';
  phaseStartedAt: Date | null;
}

/**
 * Calculate when the current phase ends
 */
export function getPhaseEndTime(prompt: PromptWithPhase): Date | null {
  if (!prompt.phaseStartedAt) return null;

  const phaseStart = new Date(prompt.phaseStartedAt);
  let phaseDuration: number;

  switch (prompt.status) {
    case 'ACTIVE':
      phaseDuration = PHASE_DURATIONS_MS.SUBMISSION_PHASE;
      break;
    case 'VOTING':
      phaseDuration = PHASE_DURATIONS_MS.VOTING_PHASE;
      break;
    default:
      return null;
  }

  return new Date(phaseStart.getTime() + phaseDuration);
}

/**
 * Check if the current phase has expired
 */
export function isPhaseExpired(prompt: PromptWithPhase): boolean {
  const endTime = getPhaseEndTime(prompt);
  if (!endTime) return false;
  
  return new Date() >= endTime;
}

/**
 * Check if submissions are currently open
 */
export function isSubmissionWindowOpen(prompt: PromptWithPhase): boolean {
  return prompt.status === 'ACTIVE' && !isPhaseExpired(prompt);
}

/**
 * Get time remaining until current phase ends
 */
export function getTimeUntilPhaseEnd(prompt: PromptWithPhase): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const endTime = getPhaseEndTime(prompt);
  
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
export function getTimeUntilSubmissionDeadline(prompt: PromptWithPhase) {
  return getTimeUntilPhaseEnd(prompt);
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
export function calculatePhaseEndTime(phaseStartedAt: Date, status: 'ACTIVE' | 'VOTING'): Date {
  const duration = status === 'ACTIVE' 
    ? PHASE_DURATIONS_MS.SUBMISSION_PHASE 
    : PHASE_DURATIONS_MS.VOTING_PHASE;
  
  return new Date(phaseStartedAt.getTime() + duration);
}

/**
 * Get the next cron execution time at 12 PM PT
 */
function getNextCronExecution(fromDate: Date = new Date()): Date {
  // Create a date object in PT timezone
  const ptDate = new Date(fromDate.toLocaleString("en-US", { timeZone: CRON_CONFIG.PROCESSING_TIMEZONE }));
  const utcDate = new Date(fromDate.toUTCString());
  
  // Calculate timezone offset
  const offsetMs = utcDate.getTime() - ptDate.getTime();
  
  // Start with today at 12 PM PT
  const today12PM = new Date(fromDate);
  today12PM.setHours(CRON_CONFIG.PROCESSING_HOUR + (offsetMs / (1000 * 60 * 60)), 0, 0, 0);
  
  // If we're past today's 12 PM PT, move to tomorrow
  if (fromDate >= today12PM) {
    const tomorrow12PM = new Date(today12PM);
    tomorrow12PM.setDate(tomorrow12PM.getDate() + 1);
    return tomorrow12PM;
  }
  
  return today12PM;
}

/**
 * Calculate when the phase will ACTUALLY end (next cron run after theoretical end time)
 * This is what should be displayed to users since phases only process during cron runs
 */
export function getRealisticPhaseEndTime(prompt: PromptWithPhase): Date | null {
  const theoreticalEndTime = getPhaseEndTime(prompt);
  if (!theoreticalEndTime) return null;
  
  // Find the next cron execution after the theoretical end time
  return getNextCronExecution(theoreticalEndTime);
}
import { PHASE_DURATIONS_MS } from '@/constants/phases';

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
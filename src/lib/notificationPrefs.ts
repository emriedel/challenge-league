/**
 * Notification preferences management
 * Stores user preferences in localStorage and provides utilities
 */

export interface NotificationPreferences {
  autoEnableRequested: boolean;
  lastAutoEnableAttempt?: string;
}

const PREFS_KEY = 'challenge_league_notification_prefs';

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') {
    return { autoEnableRequested: false };
  }

  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load notification preferences:', error);
  }

  return { autoEnableRequested: false };
}

export function setNotificationPreferences(prefs: Partial<NotificationPreferences>) {
  if (typeof window === 'undefined') return;

  try {
    const current = getNotificationPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save notification preferences:', error);
  }
}

export function shouldAttemptAutoEnable(): boolean {
  const prefs = getNotificationPreferences();
  
  // Don't attempt if we've already requested before
  if (prefs.autoEnableRequested) {
    return false;
  }

  // Don't attempt more than once per day
  if (prefs.lastAutoEnableAttempt) {
    const lastAttempt = new Date(prefs.lastAutoEnableAttempt);
    const daysSinceLastAttempt = (Date.now() - lastAttempt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastAttempt < 1) {
      return false;
    }
  }

  return true;
}

export function markAutoEnableAttempted() {
  setNotificationPreferences({
    autoEnableRequested: true,
    lastAutoEnableAttempt: new Date().toISOString()
  });
}

export function resetAutoEnablePreference() {
  setNotificationPreferences({
    autoEnableRequested: false,
    lastAutoEnableAttempt: undefined
  });
}
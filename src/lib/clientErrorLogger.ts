/**
 * Client-side error logging utility
 * Sends structured error logs to the backend for monitoring and debugging
 */

export interface ClientErrorContext {
  /** Error category (e.g., 'compression', 'network', 'storage') */
  category?: string;
  /** File size in bytes (for upload errors) */
  fileSize?: number;
  /** Image dimensions (for image processing errors) */
  dimensions?: { width: number; height: number };
  /** Browser information */
  browser?: string;
  /** Whether running as PWA */
  isPWA?: boolean;
  /** Additional metadata */
  [key: string]: any;
}

interface LogPayload {
  level: 'info' | 'error' | 'warn';
  message: string;
  userAgent: string;
  url: string;
  timestamp: string;
  context?: ClientErrorContext;
}

/**
 * Detect if the app is running as a PWA
 */
function isPWAMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if running in standalone mode (iOS/Android PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check if installed as PWA (some browsers)
  const isInstalled = (window.navigator as any).standalone === true;

  return isStandalone || isInstalled;
}

/**
 * Get browser information
 */
function getBrowserInfo(): string {
  if (typeof window === 'undefined') return 'Unknown';

  const ua = window.navigator.userAgent;

  // Detect common browsers
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edge')) return 'Edge';

  return 'Other';
}

/**
 * Log an error to the backend
 * Gracefully handles failures - never throws or blocks user flow
 */
export async function logClientError(
  message: string,
  error?: Error,
  context?: ClientErrorContext
): Promise<void> {
  try {
    // Enhance context with browser/PWA info
    const enhancedContext: ClientErrorContext = {
      ...context,
      browser: getBrowserInfo(),
      isPWA: isPWAMode(),
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines only
    };

    const payload: LogPayload = {
      level: 'error',
      message,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      timestamp: new Date().toISOString(),
      context: enhancedContext,
    };

    // Send to backend (don't await - fire and forget)
    fetch('/api/debug/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail - don't block user flow or spam console
      // The error is already logged to console by the caller
    });
  } catch (loggingError) {
    // Never throw - logging failures should not impact user experience
    console.debug('Failed to send error log to backend:', loggingError);
  }
}

/**
 * Log a warning to the backend
 */
export async function logClientWarning(
  message: string,
  context?: ClientErrorContext
): Promise<void> {
  try {
    const enhancedContext: ClientErrorContext = {
      ...context,
      browser: getBrowserInfo(),
      isPWA: isPWAMode(),
    };

    const payload: LogPayload = {
      level: 'warn',
      message,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      timestamp: new Date().toISOString(),
      context: enhancedContext,
    };

    fetch('/api/debug/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail
    });
  } catch (loggingError) {
    console.debug('Failed to send warning log to backend:', loggingError);
  }
}

/**
 * Log image processing errors with detailed context
 */
export async function logImageProcessingError(
  message: string,
  file: File,
  error?: Error,
  additionalContext?: ClientErrorContext
): Promise<void> {
  const context: ClientErrorContext = {
    category: 'image_processing',
    fileSize: file.size,
    fileName: file.name,
    fileType: file.type,
    ...additionalContext,
  };

  await logClientError(message, error, context);
}

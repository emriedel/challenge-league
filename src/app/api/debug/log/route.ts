import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';
import { logger } from '@/lib/monitoring';

interface DebugLogRequest {
  level: 'info' | 'error' | 'warn';
  message: string;
  userAgent: string;
  url: string;
  timestamp: string;
  context?: Record<string, any>;
}

const logDebugInfo = async ({ req, session }: AuthenticatedApiContext) => {
  const { level, message, userAgent, url, timestamp, context } = await req.json() as DebugLogRequest;

  // Prepare structured log context
  const logContext = {
    userId: session.user.id,
    username: session.user.username,
    userAgent,
    url,
    clientTimestamp: timestamp,
    category: 'client_error',
    ...context, // Include any additional context from client
  };

  // Use the centralized monitoring logger for consistency
  const logMessage = `Client: ${message}`;

  switch (level) {
    case 'error':
      // Create error object if we have error details in context
      const error = context?.errorMessage
        ? new Error(context.errorMessage)
        : undefined;
      if (error && context?.errorStack) {
        error.stack = context.errorStack;
      }
      logger.error(logMessage, error, logContext);
      break;
    case 'warn':
      logger.warn(logMessage, logContext);
      break;
    default:
      logger.info(logMessage, logContext);
  }

  return NextResponse.json({ success: true });
};

export const { POST } = createMethodHandlers({
  POST: logDebugInfo
});
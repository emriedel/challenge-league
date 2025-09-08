import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';

interface DebugLogRequest {
  level: 'info' | 'error' | 'warn';
  message: string;
  userAgent: string;
  url: string;
  timestamp: string;
}

const logDebugInfo = async ({ req, session }: AuthenticatedApiContext) => {
  const { level, message, userAgent, url, timestamp } = await req.json() as DebugLogRequest;

  // Log to server console with user context
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] User: ${session.user.username} (${session.user.id}) - ${url} - ${userAgent} - ${message}`;
  
  switch (level) {
    case 'error':
      console.error(`🐛 CLIENT ERROR: ${logMessage}`);
      break;
    case 'warn':
      console.warn(`⚠️  CLIENT WARNING: ${logMessage}`);
      break;
    default:
      console.log(`ℹ️  CLIENT INFO: ${logMessage}`);
  }

  return NextResponse.json({ success: true });
};

export const { POST } = createMethodHandlers({
  POST: logDebugInfo
});
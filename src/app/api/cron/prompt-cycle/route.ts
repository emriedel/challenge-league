import { NextResponse } from 'next/server';
import { createPublicMethodHandlers } from '@/lib/apiMethods';
import { processPromptQueue } from '@/lib/promptQueue';
import { sendBadgeRefreshNotificationToAllUsers } from '@/lib/pushNotifications';
import type { ApiContext } from '@/lib/apiHandler';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

const processCronJob = async ({ req }: ApiContext) => {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.get('authorization');

  // Enforce strong CRON_SECRET requirement in production
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set');
    const error = new Error('Server configuration error');
    (error as any).status = 500;
    throw error;
  }

  // In production, require a strong secret (at least 32 characters)
  if (process.env.NODE_ENV === 'production' && cronSecret.length < 32) {
    console.error('CRON_SECRET is too weak for production (must be at least 32 characters)');
    const error = new Error('Server configuration error');
    (error as any).status = 500;
    throw error;
  }

  // Check authorization header format and secret
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Missing or invalid authorization header');
    (error as any).status = 401;
    throw error;
  }

  const providedSecret = authHeader.replace('Bearer ', '');
  if (providedSecret !== cronSecret) {
    const error = new Error('Invalid CRON secret');
    (error as any).status = 401;
    throw error;
  }

  console.log('⏰ Cron job triggered: Processing prompt queue');

  const result = await processPromptQueue();

  if (result.success) {
    // Send badge refresh notifications to all users since league states may have changed
    console.log('🔔 Sending badge refresh notifications to all users');
    const badgeResult = await sendBadgeRefreshNotificationToAllUsers();

    return NextResponse.json({
      success: true,
      message: 'Prompt queue processed successfully',
      badgeNotifications: {
        sent: badgeResult.totalSent,
        failed: badgeResult.totalFailed
      },
      timestamp: new Date().toISOString()
    });
  } else {
    const errorMessage = result.error instanceof Error ? result.error.message : 'Processing failed';
    const error = new Error(errorMessage);
    (error as any).status = 500;
    throw error;
  }
};

export const { GET, POST } = createPublicMethodHandlers({
  GET: processCronJob,
  POST: processCronJob // Allow POST requests as well for flexibility
});
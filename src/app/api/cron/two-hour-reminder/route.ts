import { NextResponse } from 'next/server';
import { createPublicMethodHandlers } from '@/lib/apiMethods';
import { send2HourWarningNotifications } from '@/lib/twoHourReminders';
import type { ApiContext } from '@/lib/apiHandler';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

const process2HourReminderJob = async ({ req }: ApiContext) => {
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

  console.log('⏰ 2-hour reminder cron job triggered');

  const result = await send2HourWarningNotifications();

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: '2-hour reminder notifications sent successfully',
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
  GET: process2HourReminderJob,
  POST: process2HourReminderJob // Allow POST requests as well for flexibility
});

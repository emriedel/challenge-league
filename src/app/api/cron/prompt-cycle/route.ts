import { NextResponse } from 'next/server';
import { createPublicMethodHandlers } from '@/lib/apiMethods';
import { processPromptQueue } from '@/lib/promptQueue';
import type { ApiContext } from '@/lib/apiHandler';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

const processCronJob = async ({ req }: ApiContext) => {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    const error = new Error('Unauthorized');
    (error as any).status = 401;
    throw error;
  }

  console.log('⏰ Cron job triggered: Processing prompt queue');
  
  const result = await processPromptQueue();
  
  if (result.success) {
    return NextResponse.json({ 
      success: true, 
      message: 'Prompt queue processed successfully',
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
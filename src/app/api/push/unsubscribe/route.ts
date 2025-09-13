import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';

interface UnsubscribeRequest {
  endpoint: string;
}

const unsubscribe = async ({ req, session }: AuthenticatedApiContext) => {
  const { endpoint } = await req.json() as UnsubscribeRequest;

  if (!endpoint) {
    const error = new Error('Endpoint is required');
    (error as any).status = 400;
    throw error;
  }

  try {
    // Delete the push subscription
    const deleted = await db.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint: endpoint
      }
    });

    // Return success regardless of whether a subscription was found
    // This makes the operation idempotent - unsubscribing when already unsubscribed is a no-op
    return NextResponse.json({ 
      success: true,
      message: deleted.count > 0 
        ? 'Push subscription removed successfully'
        : 'No subscription found to remove',
      removed: deleted.count
    });

  } catch (error) {
    console.error('Error removing push subscription:', error);
    const apiError = new Error('Failed to remove push subscription');
    (apiError as any).status = 500;
    throw apiError;
  }
};

export const { POST } = createMethodHandlers({
  POST: unsubscribe
});
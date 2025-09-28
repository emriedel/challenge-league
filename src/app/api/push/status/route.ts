import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';

const checkStatus = async ({ session }: AuthenticatedApiContext) => {
  try {
    // Check if user has any active push subscriptions in the database
    const subscriptionCount = await db.pushSubscription.count({
      where: {
        userId: session.user.id
      }
    });

    const hasSubscription = subscriptionCount > 0;

    return NextResponse.json({
      isSubscribed: hasSubscription,
      subscriptionCount
    });

  } catch (error) {
    console.error('Error checking push subscription status:', error);
    const apiError = new Error('Failed to check subscription status');
    (apiError as any).status = 500;
    throw apiError;
  }
};

export const { GET } = createMethodHandlers({
  GET: checkStatus
});
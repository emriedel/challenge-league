import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';

interface SubscribeRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  userAgent?: string;
}

const subscribe = async ({ req, session }: AuthenticatedApiContext) => {
  const { subscription, userAgent } = await req.json() as SubscribeRequest;

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    const error = new Error('Invalid subscription object');
    (error as any).status = 400;
    throw error;
  }

  try {
    // Create or update push subscription
    await db.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: subscription.endpoint
        }
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Push subscription saved successfully'
    });

  } catch (error) {
    console.error('Error saving push subscription:', error);
    const apiError = new Error('Failed to save push subscription');
    (apiError as any).status = 500;
    throw apiError;
  }
};

export const { POST } = createMethodHandlers({
  POST: subscribe
});
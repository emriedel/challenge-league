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
    // First verify the user exists to avoid foreign key constraint violations
    const userExists = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!userExists) {
      console.error('User not found in database:', session.user.id);
      const error = new Error('User not found. Please sign in again.');
      (error as any).status = 401;
      throw error;
    }

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
    
    // Handle specific error types
    if (error instanceof Error && (error as any).status) {
      throw error; // Re-throw errors with status codes
    }
    
    // Check if it's a foreign key constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      const apiError = new Error('User session is invalid. Please sign in again.');
      (apiError as any).status = 401;
      throw apiError;
    }
    
    const apiError = new Error('Failed to save push subscription');
    (apiError as any).status = 500;
    throw apiError;
  }
};

export const { POST } = createMethodHandlers({
  POST: subscribe
});
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/unsubscribe
 * Unsubscribe a user from email notifications using their unsubscribe token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token is required' },
        { status: 400 }
      );
    }

    // Find user by unsubscribe token
    const user = await db.user.findUnique({
      where: { unsubscribeToken: token },
      include: {
        emailPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 404 }
      );
    }

    // Update or create email preferences to turn off all notifications
    await db.emailPreferences.upsert({
      where: {
        userId: user.id,
      },
      update: {
        challengeStarted: false,
        votingStarted: false,
        resultsReady: false,
        weeklyDigest: false,
      },
      create: {
        userId: user.id,
        challengeStarted: false,
        votingStarted: false,
        resultsReady: false,
        weeklyDigest: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from all email notifications',
    });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

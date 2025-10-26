import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/user/email-preferences
 * Fetch the current user's email preferences
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with email preferences
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        emailPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user doesn't have preferences yet, create default ones
    if (!user.emailPreferences) {
      const preferences = await db.emailPreferences.create({
        data: {
          userId: user.id,
          challengeStarted: true, // Default to ON for new users
        },
      });

      return NextResponse.json({
        challengeStarted: preferences.challengeStarted,
      });
    }

    return NextResponse.json({
      challengeStarted: user.emailPreferences.challengeStarted,
    });
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/email-preferences
 * Update the current user's email preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { challengeStarted } = body;

    if (typeof challengeStarted !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        emailPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or create email preferences
    const preferences = await db.emailPreferences.upsert({
      where: {
        userId: user.id,
      },
      update: {
        challengeStarted,
      },
      create: {
        userId: user.id,
        challengeStarted,
      },
    });

    return NextResponse.json({
      challengeStarted: preferences.challengeStarted,
    });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update email preferences' },
      { status: 500 }
    );
  }
}

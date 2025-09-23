import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/user/activity/[leagueId]
 * Get user activity data for notification calculations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leagueId } = params;

    if (!leagueId) {
      return NextResponse.json({ error: 'League ID is required' }, { status: 400 });
    }

    // Get user activity record
    const activity = await db.userActivity.findUnique({
      where: {
        userId_leagueId: {
          userId: session.user.id,
          leagueId,
        },
      },
    });

    // Count unread chat messages since user's last read time
    const lastReadTime = activity?.lastReadChatMessage || new Date(0); // Use epoch if never read

    const unreadChatCount = await db.chatMessage.count({
      where: {
        leagueId,
        createdAt: {
          gt: lastReadTime,
        },
        authorId: {
          not: session.user.id, // Don't count user's own messages
        },
      },
    });

    return NextResponse.json({
      lastViewedResults: activity?.lastViewedResults?.toISOString(),
      lastReadChatMessage: activity?.lastReadChatMessage?.toISOString(),
      unreadChatCount,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/activity/[leagueId]
 * Update user activity timestamps
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leagueId } = params;
    const body = await request.json();

    if (!leagueId) {
      return NextResponse.json({ error: 'League ID is required' }, { status: 400 });
    }

    // Validate body parameters
    const updateData: any = {};

    if (body.lastViewedResults) {
      updateData.lastViewedResults = new Date();
    }

    if (body.lastReadChatMessage) {
      updateData.lastReadChatMessage = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
    }

    // Upsert user activity record
    const activity = await db.userActivity.upsert({
      where: {
        userId_leagueId: {
          userId: session.user.id,
          leagueId,
        },
      },
      update: updateData,
      create: {
        userId: session.user.id,
        leagueId,
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      lastViewedResults: activity.lastViewedResults?.toISOString(),
      lastReadChatMessage: activity.lastReadChatMessage?.toISOString(),
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
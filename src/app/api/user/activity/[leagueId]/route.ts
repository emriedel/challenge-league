import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/user/activity/[leagueId]
 * Get unread chat count for notification calculations
 * Note: lastViewedResults and lastReadChatMessage are now tracked in localStorage
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

    // Get lastReadChatMessage from query params (passed from client via localStorage)
    const url = new URL(request.url);
    const lastReadParam = url.searchParams.get('lastReadChatMessage');
    const lastReadTime = lastReadParam ? new Date(lastReadParam) : new Date(0); // Use epoch if never read

    // Count unread chat messages since user's last read time
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
      unreadChatCount,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
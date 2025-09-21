import { NextRequest, NextResponse } from 'next/server';
import { withLeagueAccess } from '@/lib/leagueMiddleware';
import { db } from '@/lib/db';
import { processPromptQueue } from '@/lib/promptQueue';
import { sendNotificationToLeague, createNotificationData } from '@/lib/pushNotifications';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// POST /api/leagues/[id]/start - Start a league (owner only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Verify league access with owner requirement
    const accessResult = await withLeagueAccess(id, { requireOwnership: true });
    if (!accessResult.success) {
      return accessResult.response;
    }

    const { league } = accessResult.context;

    // Check if league is already started
    if (league.isStarted) {
      return NextResponse.json(
        { error: 'League is already started' },
        { status: 400 }
      );
    }

    // Start the league
    const updatedLeague = await db.league.update({
      where: { id: league.id },
      data: {
        isStarted: true,
        updatedAt: new Date()
      }
    });

    // Process the prompt queue to activate the first prompt if needed
    await processPromptQueue();

    // Send push notifications to all league members (excluding the admin who started it)
    try {
      const notificationData = createNotificationData('league-started', {
        leagueName: updatedLeague.name,
        leagueId: updatedLeague.id
      });

      const notificationResult = await sendNotificationToLeague(
        updatedLeague.id,
        notificationData,
        accessResult.context.session?.user?.id // Exclude the admin who started the league
      );

      console.log(`📱 League start notifications sent: ${notificationResult.totalSent} sent, ${notificationResult.totalFailed} failed`);
    } catch (notificationError) {
      console.error('Failed to send league start notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      league: {
        id: updatedLeague.id,
        name: updatedLeague.name,
        isStarted: updatedLeague.isStarted
      },
      message: 'League started successfully'
    });

  } catch (error) {
    console.error('Error starting league:', error);
    return NextResponse.json(
      { error: 'Failed to start league' },
      { status: 500 }
    );
  }
}
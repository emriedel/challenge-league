import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { processPromptQueue } from '@/lib/promptQueue';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// GET /api/leagues/[id]/prompt - Get current active prompt for a league
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Find the league and verify membership
    const league = await db.league.findUnique({
      where: { id }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
    }

    const userMembership = await db.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: session.user.id,
          leagueId: league.id
        }
      }
    });

    if (!userMembership || !userMembership.isActive) {
      return NextResponse.json({ 
        error: 'You are not a member of this league' 
      }, { status: 403 });
    }

    // Get current prompt (ACTIVE or VOTING) for this league first
    const currentPrompt = await db.prompt.findFirst({
      where: {
        status: {
          in: ['ACTIVE', 'VOTING']
        },
        leagueId: league.id,
      },
      include: {
        responses: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
            submittedAt: true,
            imageUrl: true,
            caption: true,
          },
        },
      },
    });

    if (!currentPrompt) {
      // Only process queue if no current prompt found - might need to start a new one
      await processPromptQueue();
      
      // Try to find current prompt again after processing
      const newCurrentPrompt = await db.prompt.findFirst({
        where: {
          status: {
            in: ['ACTIVE', 'VOTING']
          },
          leagueId: league.id,
        },
        include: {
          responses: {
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
              submittedAt: true,
              imageUrl: true,
              caption: true,
            },
          },
        },
      });
      
      if (!newCurrentPrompt) {
        return NextResponse.json({ error: 'No active prompt found for this league' }, { status: 404 });
      }
      
      const userResponse = newCurrentPrompt.responses[0];
      
      return NextResponse.json({
        prompt: {
          id: newCurrentPrompt.id,
          text: newCurrentPrompt.text,
          status: newCurrentPrompt.status,
          phaseStartedAt: newCurrentPrompt.phaseStartedAt,
          queueOrder: newCurrentPrompt.queueOrder,
        },
        userResponse: userResponse ? {
          id: userResponse.id,
          submittedAt: userResponse.submittedAt,
          imageUrl: userResponse.imageUrl,
          caption: userResponse.caption,
        } : null,
      });
    }

    const userResponse = currentPrompt.responses[0];
    
    return NextResponse.json({
      prompt: {
        id: currentPrompt.id,
        text: currentPrompt.text,
        status: currentPrompt.status,
        phaseStartedAt: currentPrompt.phaseStartedAt,
        queueOrder: currentPrompt.queueOrder,
      },
      userResponse: userResponse ? {
        id: userResponse.id,
        submittedAt: userResponse.submittedAt,
        imageUrl: userResponse.imageUrl,
        caption: userResponse.caption,
      } : null,
    });
  } catch (error) {
    console.error('Get current prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { processPromptQueue } from '@/lib/promptQueue';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get league slug from query params
    const { searchParams } = new URL(request.url);
    const leagueSlug = searchParams.get('slug');

    if (!leagueSlug) {
      return NextResponse.json({ 
        error: 'League slug is required' 
      }, { status: 400 });
    }

    // Find the league and verify membership
    const league = await db.league.findUnique({
      where: { slug: leagueSlug }
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

    // Process the prompt queue to handle any transitions
    await processPromptQueue();

    // Get current active prompt for this league
    const activePrompt = await db.prompt.findFirst({
      where: {
        status: 'ACTIVE',
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
          },
        },
      },
    });

    if (!activePrompt) {
      return NextResponse.json({ error: 'No active prompt found for this league' }, { status: 404 });
    }

    const userResponse = activePrompt.responses[0];
    
    return NextResponse.json({
      prompt: {
        id: activePrompt.id,
        text: activePrompt.text,
        weekStart: activePrompt.weekStart,
        weekEnd: activePrompt.weekEnd,
      },
      userResponse: userResponse ? {
        id: userResponse.id,
        submittedAt: userResponse.submittedAt,
      } : null,
    });
  } catch (error) {
    console.error('Get current prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
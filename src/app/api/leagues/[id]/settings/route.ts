import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getRealisticPhaseEndTime } from '@/lib/phaseCalculations';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// GET /api/leagues/[id]/settings - Get league settings data for members/admins
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Find the league and verify membership
    const league = await db.league.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memberships: {
              where: { isActive: true }
            }
          }
        }
      }
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
        error: 'Access denied - member access only' 
      }, { status: 403 });
    }

    // Get all prompts for this league
    const prompts = await db.prompt.findMany({
      where: {
        leagueId: league.id,
      },
      orderBy: [
        { status: 'asc' },
        { queueOrder: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    // Organize prompts by status
    const queue = {
      active: prompts.filter(p => p.status === 'ACTIVE'),
      voting: prompts.filter(p => p.status === 'VOTING'),
      scheduled: prompts.filter(p => p.status === 'SCHEDULED'),
      completed: prompts.filter(p => p.status === 'COMPLETED'),
    };

    // Determine current and next phase info
    let currentPhase: any = { type: 'NONE' };
    let nextPhase: any = { type: 'NEW_ACTIVE' };

    if (queue.active.length > 0) {
      const activePrompt = queue.active[0];
      const endTime = getRealisticPhaseEndTime({
        id: activePrompt.id,
        status: activePrompt.status,
        phaseStartedAt: activePrompt.phaseStartedAt ? new Date(activePrompt.phaseStartedAt) : null,
      });

      currentPhase = {
        type: 'ACTIVE',
        prompt: activePrompt.text,
        endTime: endTime?.toISOString(),
      };

      nextPhase = {
        type: 'VOTING',
        prompt: activePrompt.text,
      };
    } else if (queue.voting.length > 0) {
      const votingPrompt = queue.voting[0];
      const endTime = getRealisticPhaseEndTime({
        id: votingPrompt.id,
        status: votingPrompt.status,
        phaseStartedAt: votingPrompt.phaseStartedAt ? new Date(votingPrompt.phaseStartedAt) : null,
      });

      currentPhase = {
        type: 'VOTING',
        prompt: votingPrompt.text,
        endTime: endTime?.toISOString(),
      };

      if (queue.scheduled.length > 0) {
        nextPhase = {
          type: 'NEW_ACTIVE',
          prompt: queue.scheduled[0].text,
        };
      } else {
        nextPhase = { type: 'COMPLETED' };
      }
    } else if (queue.scheduled.length > 0) {
      nextPhase = {
        type: 'NEW_ACTIVE',
        prompt: queue.scheduled[0].text,
      };
    }

    const responseData = {
      league: {
        id: league.id,
        name: league.name,
        description: league.description,
        isOwner: league.ownerId === session.user.id,
        memberCount: league._count.memberships,
        inviteCode: league.inviteCode,
      },
      queue,
      phaseInfo: {
        currentPhase,
        nextPhase,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Get league settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
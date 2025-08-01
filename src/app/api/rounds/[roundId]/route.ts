import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { roundId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json({ 
        error: 'League ID is required' 
      }, { status: 400 });
    }

    if (!params.roundId) {
      return NextResponse.json({ 
        error: 'Round ID is required' 
      }, { status: 400 });
    }

    // Verify league membership
    const userMembership = await db.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: session.user.id,
          leagueId: leagueId
        }
      }
    });

    if (!userMembership || !userMembership.isActive) {
      return NextResponse.json({ 
        error: 'You are not a member of this league' 
      }, { status: 403 });
    }

    // Get the specific round with all its responses
    const round = await db.prompt.findUnique({
      where: { 
        id: params.roundId,
      },
      include: {
        responses: {
          where: { 
            isPublished: true 
          },
          include: {
            user: {
              select: {
                username: true,
                profilePhoto: true
              }
            }
          },
          orderBy: [
            { finalRank: 'asc' }, // Show ranked results first
            { totalPoints: 'desc' },
            { submittedAt: 'desc' }
          ]
        }
      }
    });

    if (!round) {
      return NextResponse.json({ 
        error: 'Round not found' 
      }, { status: 404 });
    }

    // Verify the round belongs to the specified league
    if (round.leagueId !== leagueId) {
      return NextResponse.json({ 
        error: 'Round does not belong to this league' 
      }, { status: 403 });
    }

    // Only return completed rounds
    if (round.status !== 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Round is not yet completed' 
      }, { status: 400 });
    }

    return NextResponse.json({
      round: {
        id: round.id,
        text: round.text,
        weekStart: round.weekStart,
        weekEnd: round.weekEnd,
        responses: round.responses
      }
    });

  } catch (error) {
    console.error('Error fetching round data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch round data' 
    }, { status: 500 });
  }
}
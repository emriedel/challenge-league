import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: { slug: string };
}

// GET /api/leagues/[slug] - Get specific league data
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;

    // Find the league
    const league = await db.league.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        memberships: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
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

    // Check if user is a member
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

    // Get league standings - calculate total points across all completed prompts in this league
    const leaderboard = await Promise.all(
      league.memberships.map(async (membership) => {
        const userResponses = await db.response.findMany({
          where: {
            userId: membership.userId,
            isPublished: true,
            prompt: {
              status: 'COMPLETED',
              leagueId: league.id // Only prompts from this league
            }
          },
          select: {
            totalPoints: true,
            finalRank: true,
            prompt: {
              select: {
                id: true,
                text: true
              }
            }
          }
        });

        const totalPoints = userResponses.reduce((sum, response) => sum + response.totalPoints, 0);
        const totalSubmissions = userResponses.length;
        const wins = userResponses.filter(r => r.finalRank === 1).length;
        const podiumFinishes = userResponses.filter(r => r.finalRank && r.finalRank <= 3).length;

        return {
          user: membership.user,
          stats: {
            totalPoints,
            totalSubmissions,
            wins,
            podiumFinishes,
            averageRank: totalSubmissions > 0 
              ? userResponses.reduce((sum, r) => sum + (r.finalRank || 0), 0) / totalSubmissions 
              : 0
          }
        };
      })
    );

    // Sort by total points descending
    leaderboard.sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);

    // Add league rank
    leaderboard.forEach((entry, index) => {
      (entry.stats as any).leagueRank = index + 1;
    });

    // Get recent activity - last 3 completed prompts from this league
    const recentPrompts = await db.prompt.findMany({
      where: {
        status: 'COMPLETED',
        leagueId: league.id
      },
      orderBy: {
        weekEnd: 'desc'
      },
      take: 3,
      include: {
        responses: {
          where: {
            isPublished: true,
            userId: { in: league.memberships.map(m => m.userId) }
          },
          include: {
            user: {
              select: {
                username: true
              }
            }
          },
          orderBy: {
            finalRank: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        slug: league.slug,
        description: league.description,
        inviteCode: league.ownerId === session.user.id ? league.inviteCode : undefined, // Only show to owner
        memberCount: league.memberships.length,
        isOwner: league.ownerId === session.user.id,
        owner: league.owner
      },
      leaderboard,
      recentActivity: recentPrompts
    });

  } catch (error) {
    console.error('Error fetching league data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch league data' 
    }, { status: 500 });
  }
}

// PUT /api/leagues/[slug] - Update league (owner only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;
    const { name, description } = await request.json();

    // Find the league
    const league = await db.league.findUnique({
      where: { slug }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
    }

    // Check if user is the owner
    if (league.ownerId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only the league owner can update league settings' 
      }, { status: 403 });
    }

    // Update the league
    const updatedLeague = await db.league.update({
      where: { id: league.id },
      data: {
        name: name || league.name,
        description: description || league.description,
      }
    });

    return NextResponse.json({ league: updatedLeague });

  } catch (error) {
    console.error('Error updating league:', error);
    return NextResponse.json({ 
      error: 'Failed to update league' 
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's leagues
    const userLeagues = await db.leagueMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        league: {
          include: {
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
        }
      }
    });

    if (userLeagues.length === 0) {
      return NextResponse.json({ 
        error: 'User not in any leagues' 
      }, { status: 404 });
    }

    // For now, just use the first league (Main League)
    const league = userLeagues[0].league;

    // Get league standings - calculate total points across all completed prompts
    const leaderboard = await Promise.all(
      league.memberships.map(async (membership) => {
        const userResponses = await db.response.findMany({
          where: {
            userId: membership.userId,
            isPublished: true,
            prompt: {
              status: 'COMPLETED'
            }
          },
          select: {
            totalPoints: true,
            finalRank: true,
            prompt: {
              select: {
                id: true,
                text: true,
                category: true
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

    // Get recent activity - last 3 completed prompts
    const recentPrompts = await db.prompt.findMany({
      where: {
        status: 'COMPLETED'
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
        description: league.description,
        memberCount: league.memberships.length
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
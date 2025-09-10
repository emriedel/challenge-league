import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

export const { GET } = createMethodHandlers({
  // GET /api/leagues/available - Get leagues available to join
  GET: async ({ session }) => {
    const userId = session!.user.id;

    // Get leagues the user is NOT already a member of
    const userLeagueIds = await db.leagueMembership.findMany({
      where: {
        userId,
        isActive: true
      },
      select: { leagueId: true }
    });

    const joinedLeagueIds = userLeagueIds.map(membership => membership.leagueId);

    // Get all active leagues excluding ones user is already in
    const availableLeagues = await db.league.findMany({
      where: {
        isActive: true,
        id: {
          notIn: joinedLeagueIds
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            memberships: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' } // Show newest leagues first
      ]
    });

    const leagues = availableLeagues.map(league => ({
      id: league.id,
      name: league.name,
      description: league.description,
      inviteCode: league.inviteCode,
      owner: league.owner,
      memberCount: league._count.memberships,
      createdAt: league.createdAt,
      isStarted: league.isStarted
    }));

    return NextResponse.json({ leagues });
  }
}, true); // requireAuth = true
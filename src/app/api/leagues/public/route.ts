import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

// GET /api/leagues/public - Get all public leagues
const getPublicLeagues = async () => {
  // Get all active leagues with basic information
  const leagues = await db.league.findMany({
    where: {
      isActive: true
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
      { createdAt: 'desc' }
    ]
  });

  const formattedLeagues = leagues.map(league => ({
    id: league.id,
    name: league.name,
    description: league.description,
    memberCount: league._count.memberships,
    owner: league.owner,
    createdAt: league.createdAt,
    // Don't expose invite codes or ownership status for public listings
    isOwner: false
  }));

  return NextResponse.json({ leagues: formattedLeagues });
};

export const { GET } = createMethodHandlers({
  GET: getPublicLeagues
}, false); // requireAuth = false, anyone can view public leagues
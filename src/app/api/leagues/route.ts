import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Exclude O and 0 for clarity
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Export handlers using the new centralized system
export const { GET, POST } = createMethodHandlers({
  // GET /api/leagues - Get user's leagues
  GET: async ({ session }) => {
    const userId = session!.user.id;

    // Get user's leagues
    const userLeagues = await db.leagueMembership.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        league: {
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
            },
            _count: {
              select: {
                memberships: {
                  where: { isActive: true }
                }
              }
            }
          }
        }
      }
    });

    const leagues = userLeagues.map(membership => ({
      ...membership.league,
      memberCount: membership.league._count.memberships,
      isOwner: membership.league.ownerId === userId
    }));

    return NextResponse.json({ leagues });
  },

  // POST /api/leagues - Create new league
  POST: async ({ session, req }) => {
    const userId = session!.user.id;
    const { name, description } = await req.json();

    if (!name || !description) {
      return NextResponse.json({ 
        error: 'Name and description are required' 
      }, { status: 400 });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    while (await db.league.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    // Create the league
    const league = await db.league.create({
      data: {
        name,
        slug: `league-${Date.now()}`, // Temporary slug until we can remove from schema
        description,
        inviteCode,
        ownerId: userId,
        isActive: true,
      },
    });

    // Add creator as a member
    await db.leagueMembership.create({
      data: {
        userId,
        leagueId: league.id,
        isActive: true,
      },
    });

    return NextResponse.json({ 
      league: {
        ...league,
        isOwner: true,
        memberCount: 1
      }
    });
  }
}, true); // requireAuth = true
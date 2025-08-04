import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

// POST /api/leagues/join - Join league via invite code
const joinLeague = async ({ req, session }: AuthenticatedApiContext) => {
  const { inviteCode } = await req.json();

  if (!inviteCode) {
    throw new Error('Invite code is required');
  }

    // Find the league by invite code
    const league = await db.league.findUnique({
      where: { 
        inviteCode: inviteCode.toUpperCase() 
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
      }
    });

  if (!league) {
    const error = new Error('Invalid invite code');
    (error as any).status = 404;
    throw error;
  }

  if (!league.isActive) {
    throw new Error('This league is no longer active');
  }

    // Check if user is already a member
    const existingMembership = await db.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: session.user.id,
          leagueId: league.id
        }
      }
    });

  if (existingMembership) {
    if (existingMembership.isActive) {
      throw new Error('You are already a member of this league');
    } else {
      // Reactivate existing membership
      await db.leagueMembership.update({
        where: { id: existingMembership.id },
        data: { isActive: true }
      });
    }
  } else {
    // Create new membership
    await db.leagueMembership.create({
      data: {
        userId: session.user.id,
        leagueId: league.id,
        isActive: true,
      },
    });
  }

  return NextResponse.json({ 
    league: {
      ...league,
      memberCount: league._count.memberships + 1,
      isOwner: league.ownerId === session.user.id
    }
  });
};

export const { POST } = createMethodHandlers({
  POST: joinLeague
});
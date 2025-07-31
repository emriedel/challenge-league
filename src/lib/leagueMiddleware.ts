import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export interface LeagueWithMembership {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    username: string;
  };
  memberships?: any[]; // Use any for now to avoid complex Prisma type matching
  _count?: {
    memberships: number;
  };
}

export interface LeagueAccessContext {
  session: any;
  league: LeagueWithMembership;
  userMembership: {
    userId: string;
    leagueId: string;
    isActive: boolean;
  };
}

/**
 * Middleware to verify league access and membership
 * Returns the league and user membership if valid, or an error response
 */
export async function withLeagueAccess(
  leagueId: string,
  options: {
    requireOwnership?: boolean;
    includeMembers?: boolean;
  } = {}
): Promise<{ success: true; context: LeagueAccessContext } | { success: false; response: NextResponse }> {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }

    // Find the league
    const league = await db.league.findUnique({
      where: { id: leagueId },
      include: {
        owner: options.includeMembers ? {
          select: {
            id: true,
            username: true
          }
        } : undefined,
        memberships: options.includeMembers ? {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        } : undefined,
        _count: options.includeMembers ? {
          select: {
            memberships: {
              where: { isActive: true }
            }
          }
        } : undefined
      }
    });

    if (!league) {
      return {
        success: false,
        response: NextResponse.json({ error: 'League not found' }, { status: 404 })
      };
    }

    // Check ownership if required
    if (options.requireOwnership && league.ownerId !== session.user.id) {
      return {
        success: false,
        response: NextResponse.json({ error: 'Only league owners can perform this action' }, { status: 403 })
      };
    }

    // Check membership (unless checking ownership, which implies access)
    if (!options.requireOwnership) {
      const userMembership = await db.leagueMembership.findUnique({
        where: {
          userId_leagueId: {
            userId: session.user.id,
            leagueId: league.id
          }
        }
      });

      if (!userMembership || !userMembership.isActive) {
        return {
          success: false,
          response: NextResponse.json({ error: 'You are not a member of this league' }, { status: 403 })
        };
      }

      return {
        success: true,
        context: {
          session,
          league,
          userMembership
        }
      };
    }

    // For ownership checks, create a dummy membership
    return {
      success: true,
      context: {
        session,
        league,
        userMembership: {
          userId: session.user.id,
          leagueId: league.id,
          isActive: true
        }
      }
    };

  } catch (error) {
    console.error('League access verification error:', error);
    return {
      success: false,
      response: NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    };
  }
}
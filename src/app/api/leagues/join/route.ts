import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/leagues/join - Join league via invite code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json({ 
        error: 'Invite code is required' 
      }, { status: 400 });
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
      return NextResponse.json({ 
        error: 'Invalid invite code' 
      }, { status: 404 });
    }

    if (!league.isActive) {
      return NextResponse.json({ 
        error: 'This league is no longer active' 
      }, { status: 400 });
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
        return NextResponse.json({ 
          error: 'You are already a member of this league' 
        }, { status: 400 });
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

  } catch (error) {
    console.error('Error joining league:', error);
    return NextResponse.json({ 
      error: 'Failed to join league' 
    }, { status: 500 });
  }
}
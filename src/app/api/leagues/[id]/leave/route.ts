import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// POST /api/leagues/[id]/leave - Leave a league
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leagueId } = params;

    // Find the league and check ownership
    const league = await db.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        ownerId: true
      }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
    }

    // Prevent league owner from leaving
    if (league.ownerId === session.user.id) {
      return NextResponse.json({ 
        error: 'League owners cannot leave their own league. You must transfer ownership or delete the league first.' 
      }, { status: 403 });
    }

    // Check if user is actually a member
    const membership = await db.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: session.user.id,
          leagueId: league.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ 
        error: 'You are not a member of this league' 
      }, { status: 400 });
    }

    // Perform all cleanup operations in a transaction
    await db.$transaction(async (tx) => {
      // 1. Get all user's responses in this league to delete associated photos
      const userResponses = await tx.response.findMany({
        where: {
          userId: session.user.id,
          prompt: {
            leagueId: league.id
          }
        },
        select: {
          id: true,
          imageUrl: true
        }
      });

      // 2. Keep votes cast by this user to preserve other players' vote totals
      // (We don't delete votes they cast - only votes they received)

      // 3. Delete all votes received by this user's responses in this league
      await tx.vote.deleteMany({
        where: {
          response: {
            userId: session.user.id,
            prompt: {
              leagueId: league.id
            }
          }
        }
      });

      // 4. Delete all user's responses in this league
      await tx.response.deleteMany({
        where: {
          userId: session.user.id,
          prompt: {
            leagueId: league.id
          }
        }
      });

      // 5. Remove the league membership
      await tx.leagueMembership.delete({
        where: {
          userId_leagueId: {
            userId: session.user.id,
            leagueId: league.id
          }
        }
      });

      // Note: Photo cleanup from storage (Vercel Blob/S3) would need to be handled separately
      // as it's typically an external service. For now, we'll just track the imageUrls
      return userResponses.map(r => r.imageUrl);
    });

    return NextResponse.json({ 
      message: `Successfully left ${league.name}`,
      success: true
    });

  } catch (error) {
    console.error('Error leaving league:', error);
    return NextResponse.json({ 
      error: 'Failed to leave league. Please try again.' 
    }, { status: 500 });
  }
}
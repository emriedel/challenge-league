import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// POST /api/leagues/[id]/admin/prompts/reorder - Reorder prompts (owner only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { promptIds } = await request.json();

    if (!Array.isArray(promptIds) || promptIds.length === 0) {
      return NextResponse.json({ 
        error: 'promptIds array is required' 
      }, { status: 400 });
    }

    // Find the league
    const league = await db.league.findUnique({
      where: { id }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
    }

    // Check if user is the league owner
    if (league.ownerId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only league owners can reorder prompts' 
      }, { status: 403 });
    }

    // Verify all prompts belong to this league and are scheduled (only queue prompts can be reordered)
    const prompts = await db.prompt.findMany({
      where: {
        id: { in: promptIds },
        leagueId: league.id,
        status: 'SCHEDULED' // Only SCHEDULED prompts can be reordered
      }
    });

    if (prompts.length !== promptIds.length) {
      return NextResponse.json({
        error: 'Some prompts not found or not schedulable (only queued prompts can be reordered)'
      }, { status: 400 });
    }

    // Update queue orders
    const updatePromises = promptIds.map((promptId, index) => 
      db.prompt.update({
        where: { id: promptId },
        data: { queueOrder: index + 1 }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error reordering league prompts:', error);
    return NextResponse.json({ 
      error: 'Failed to reorder prompts' 
    }, { status: 500 });
  }
}
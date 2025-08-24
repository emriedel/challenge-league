import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { manualPhaseTransition } from '@/lib/promptQueue';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// POST /api/leagues/[id]/admin/transition-phase - Manually transition to next phase (owner only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if user is the league owner
    const league = await db.league.findUnique({
      where: { id },
      select: { ownerId: true, name: true },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    if (league.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Only league owners can transition phases' }, { status: 403 });
    }

    // Perform the manual phase transition
    const result = await manualPhaseTransition(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Manual phase transition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
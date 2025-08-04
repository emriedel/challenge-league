import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// GET /api/leagues/[id]/admin/prompts - Get prompts queue for league (owner only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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
        error: 'Only league owners can access admin functionality' 
      }, { status: 403 });
    }

    // Get prompts for this league
    const prompts = await db.prompt.findMany({
      where: {
        leagueId: league.id
      },
      orderBy: [
        { status: 'asc' },
        { queueOrder: 'asc' },
        { weekStart: 'asc' }
      ]
    });

    // Group prompts by status
    const queue = {
      active: prompts.filter(p => p.status === 'ACTIVE'),
      voting: prompts.filter(p => p.status === 'VOTING'),
      scheduled: prompts.filter(p => p.status === 'SCHEDULED'),
      completed: prompts.filter(p => p.status === 'COMPLETED')
    };

    return NextResponse.json({ queue });

  } catch (error) {
    console.error('Error fetching league prompts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch prompts' 
    }, { status: 500 });
  }
}

// POST /api/leagues/[slug]/admin/prompts - Create new prompt for league (owner only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ 
        error: 'Prompt text is required' 
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
        error: 'Only league owners can create prompts' 
      }, { status: 403 });
    }

    // Get the next queue order for this league
    const lastPrompt = await db.prompt.findFirst({
      where: {
        leagueId: league.id,
        status: 'SCHEDULED'
      },
      orderBy: {
        queueOrder: 'desc'
      }
    });

    const nextQueueOrder = lastPrompt ? lastPrompt.queueOrder + 1 : 1;

    // Create the prompt
    const prompt = await db.prompt.create({
      data: {
        text: text.trim(),
        status: 'SCHEDULED',
        queueOrder: nextQueueOrder,
        leagueId: league.id,
        // These will be set when the prompt becomes active
        weekStart: new Date(),
        weekEnd: new Date(),
        voteStart: new Date(),
        voteEnd: new Date()
      }
    });

    return NextResponse.json({ prompt });

  } catch (error) {
    console.error('Error creating league prompt:', error);
    return NextResponse.json({ 
      error: 'Failed to create prompt' 
    }, { status: 500 });
  }
}
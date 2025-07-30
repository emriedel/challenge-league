import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: { slug: string; id: string };
}

// PATCH /api/leagues/[slug]/admin/prompts/[id] - Update prompt (owner only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, id } = params;
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ 
        error: 'Prompt text is required' 
      }, { status: 400 });
    }

    // Find the league
    const league = await db.league.findUnique({
      where: { slug }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
    }

    // Check if user is the league owner
    if (league.ownerId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only league owners can update prompts' 
      }, { status: 403 });
    }

    // Find the prompt and verify it belongs to this league
    const prompt = await db.prompt.findUnique({
      where: { id }
    });

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Prompt not found' 
      }, { status: 404 });
    }

    if (prompt.leagueId !== league.id) {
      return NextResponse.json({ 
        error: 'Prompt does not belong to this league' 
      }, { status: 403 });
    }

    // Only allow editing of scheduled prompts
    if (prompt.status !== 'SCHEDULED') {
      return NextResponse.json({ 
        error: 'Can only edit scheduled prompts' 
      }, { status: 400 });
    }

    // Update the prompt
    const updatedPrompt = await db.prompt.update({
      where: { id },
      data: {
        text: text.trim()
      }
    });

    return NextResponse.json({ prompt: updatedPrompt });

  } catch (error) {
    console.error('Error updating league prompt:', error);
    return NextResponse.json({ 
      error: 'Failed to update prompt' 
    }, { status: 500 });
  }
}

// DELETE /api/leagues/[slug]/admin/prompts/[id] - Delete prompt (owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, id } = params;

    // Find the league
    const league = await db.league.findUnique({
      where: { slug }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
    }

    // Check if user is the league owner
    if (league.ownerId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only league owners can delete prompts' 
      }, { status: 403 });
    }

    // Find the prompt and verify it belongs to this league
    const prompt = await db.prompt.findUnique({
      where: { id }
    });

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Prompt not found' 
      }, { status: 404 });
    }

    if (prompt.leagueId !== league.id) {
      return NextResponse.json({ 
        error: 'Prompt does not belong to this league' 
      }, { status: 403 });
    }

    // Only allow deleting of scheduled prompts
    if (prompt.status !== 'SCHEDULED') {
      return NextResponse.json({ 
        error: 'Can only delete scheduled prompts' 
      }, { status: 400 });
    }

    // Delete the prompt
    await db.prompt.delete({
      where: { id }
    });

    // Reorder remaining prompts
    const remainingPrompts = await db.prompt.findMany({
      where: {
        leagueId: league.id,
        status: 'SCHEDULED',
        queueOrder: { gt: prompt.queueOrder }
      },
      orderBy: { queueOrder: 'asc' }
    });

    // Update queue orders to fill the gap
    for (let i = 0; i < remainingPrompts.length; i++) {
      await db.prompt.update({
        where: { id: remainingPrompts[i].id },
        data: { queueOrder: prompt.queueOrder + i }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting league prompt:', error);
    return NextResponse.json({ 
      error: 'Failed to delete prompt' 
    }, { status: 500 });
  }
}
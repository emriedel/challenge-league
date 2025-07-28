import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPromptQueue } from '@/lib/promptQueue';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple admin check - in production you'd have proper role-based auth
    if (session.user.username !== 'player1') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const queue = await getPromptQueue();
    return NextResponse.json({ queue });
  } catch (error) {
    console.error('Get prompts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple admin check - in production you'd have proper role-based auth
    if (session.user.username !== 'player1') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Prompt text is required' }, { status: 400 });
    }

    // Get the next available queue order
    const lastScheduledPrompt = await db.prompt.findFirst({
      where: { status: 'SCHEDULED' },
      orderBy: { queueOrder: 'desc' },
    });

    const nextQueueOrder = lastScheduledPrompt ? lastScheduledPrompt.queueOrder + 1 : 2;

    // Create the scheduled prompt (dates will be set when it becomes active)
    const placeholder = new Date();
    const prompt = await db.prompt.create({
      data: {
        text,
        weekStart: placeholder, // Placeholder - will be updated when activated
        weekEnd: placeholder,   // Placeholder - will be updated when activated
        voteStart: placeholder, // Placeholder - will be updated when activated
        voteEnd: placeholder,   // Placeholder - will be updated when activated
        status: 'SCHEDULED',
        queueOrder: nextQueueOrder,
      },
    });

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Create prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
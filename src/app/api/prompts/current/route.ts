import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { processPromptQueue } from '@/lib/promptQueue';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process the prompt queue to handle any transitions
    await processPromptQueue();

    // Get current active prompt
    const activePrompt = await db.prompt.findFirst({
      where: {
        status: 'ACTIVE',
      },
      include: {
        responses: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
            submittedAt: true,
          },
        },
      },
    });

    if (!activePrompt) {
      return NextResponse.json({ error: 'No active prompt found' }, { status: 404 });
    }

    const userResponse = activePrompt.responses[0];
    
    return NextResponse.json({
      prompt: {
        id: activePrompt.id,
        text: activePrompt.text,
        weekStart: activePrompt.weekStart,
        weekEnd: activePrompt.weekEnd,
      },
      userResponse: userResponse ? {
        id: userResponse.id,
        submittedAt: userResponse.submittedAt,
      } : null,
    });
  } catch (error) {
    console.error('Get current prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
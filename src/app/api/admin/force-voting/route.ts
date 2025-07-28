import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple admin check - in production you'd have proper role-based auth
    if (session.user.username !== 'player1') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('🔧 Force voting mode triggered by admin');
    
    const now = new Date();
    
    // Find the current active prompt
    const activePrompt = await db.prompt.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        responses: true
      }
    });

    if (!activePrompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active prompt found to move to voting'
      }, { status: 400 });
    }

    // Check if there are any responses to vote on
    if (activePrompt.responses.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No submissions found for the active prompt. Add some test submissions first.'
      }, { status: 400 });
    }

    // Force the prompt into voting mode by:
    // 1. Publishing all responses
    const publishedCount = await db.response.updateMany({
      where: { promptId: activePrompt.id },
      data: { 
        isPublished: true,
        publishedAt: now,
      },
    });

    // 2. Setting the prompt status to VOTING
    // 3. Setting voteStart to now and voteEnd to 2 days from now
    const voteStart = new Date(now);
    const voteEnd = new Date(now);
    voteEnd.setDate(voteEnd.getDate() + 2); // Vote for 2 days

    await db.prompt.update({
      where: { id: activePrompt.id },
      data: { 
        status: 'VOTING',
        voteStart,
        voteEnd,
        weekEnd: now, // Mark submission period as ended
      },
    });

    console.log(`🗳️ FORCED voting for: "${activePrompt.text}" (${publishedCount.count} responses published)`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully moved "${activePrompt.text}" to voting mode`,
      promptId: activePrompt.id,
      responseCount: publishedCount.count,
      voteEnd: voteEnd.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Force voting error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reorderPrompts } from '@/lib/promptQueue';

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

    const { promptIds } = await request.json();

    if (!Array.isArray(promptIds)) {
      return NextResponse.json({ error: 'promptIds must be an array' }, { status: 400 });
    }

    const result = await reorderPrompts(promptIds);

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to reorder prompts' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder prompts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple admin check - in production you'd have proper role-based auth
    if (session.user.username !== 'testuser1') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if prompt exists and is scheduled (can only delete future prompts)
    const prompt = await db.prompt.findUnique({
      where: { id: params.id },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (prompt.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Can only delete scheduled prompts' }, { status: 400 });
    }

    // Delete the prompt
    await db.prompt.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple admin check - in production you'd have proper role-based auth
    if (session.user.username !== 'testuser1') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Prompt text is required' }, { status: 400 });
    }

    // Check if prompt exists and is scheduled (can only edit future prompts)
    const prompt = await db.prompt.findUnique({
      where: { id: params.id },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (prompt.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Can only edit scheduled prompts' }, { status: 400 });
    }

    // Update the prompt
    const updatedPrompt = await db.prompt.update({
      where: { id: params.id },
      data: { text },
    });

    return NextResponse.json({ prompt: updatedPrompt });
  } catch (error) {
    console.error('Update prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
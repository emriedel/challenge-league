import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processPromptQueue } from '@/lib/promptQueue';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple admin check - in production you'd have proper role-based auth
    if (session.user.username !== 'testuser1') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('🔧 Manual queue processing triggered by admin');
    
    const result = await processPromptQueue();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Prompt queue processed successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Manual queue processing error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
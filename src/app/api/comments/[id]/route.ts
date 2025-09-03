import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ValidationError, NotFoundError, ForbiddenError, validateLeagueMembership } from '@/lib/apiErrors';
import { isPhaseExpired } from '@/lib/phaseCalculations';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = params.id;

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

  // Get the comment with response and prompt info
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: {
      response: {
        include: {
          prompt: {
            select: { 
              id: true,
              leagueId: true, 
              status: true,
              phaseStartedAt: true
            }
          }
        }
      }
    }
  });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Validate that the user owns this comment
    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }

    // Validate league membership
    await validateLeagueMembership(db, session.user.id, comment.response.prompt.leagueId);

    // Only allow deletion during VOTING phase
    if (comment.response.prompt.status !== 'VOTING') {
      return NextResponse.json({ error: 'Comments can only be deleted during the voting phase' }, { status: 403 });
    }

    // Get league settings to check if voting window is still open
    const league = await db.league.findUnique({
      where: { id: comment.response.prompt.leagueId },
      select: { 
        submissionDays: true, 
        votingDays: true, 
        votesPerPlayer: true 
      }
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    const leagueSettings = {
      submissionDays: league.submissionDays,
      votingDays: league.votingDays,
      votesPerPlayer: league.votesPerPlayer
    };

    // Check if voting window is still open
    if (isPhaseExpired(comment.response.prompt, leagueSettings)) {
      return NextResponse.json({ error: 'Commenting window has closed' }, { status: 403 });
    }

    // Delete the comment
    await db.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
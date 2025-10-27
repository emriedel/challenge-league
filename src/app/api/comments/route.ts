import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { ValidationError, NotFoundError, ForbiddenError, validateRequired, validateLeagueMembership } from '@/lib/apiErrors';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';
import { isPhaseExpired } from '@/lib/phaseCalculations';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

const getComments = async ({ req, session }: AuthenticatedApiContext) => {
  const { searchParams } = new URL(req.url);
  const responseId = searchParams.get('responseId');

  if (!responseId) {
    throw new ValidationError('Response ID is required');
  }

  // Get the response with prompt info to validate league membership
  const response = await db.response.findUnique({
    where: { id: responseId },
    include: {
      prompt: {
        select: { 
          id: true,
          leagueId: true, 
          status: true,
          phaseStartedAt: true
        }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profilePhoto: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  if (!response) {
    throw new NotFoundError('Response not found');
  }

  // Validate league membership
  await validateLeagueMembership(db, session.user.id, response.prompt.leagueId);

  // Get league settings to check if prompt is still in voting phase
  const league = await db.league.findUnique({
    where: { id: response.prompt.leagueId },
    select: { 
      submissionDays: true, 
      votingDays: true, 
      votesPerPlayer: true 
    }
  });

  if (!league) {
    throw new NotFoundError('League not found');
  }

  const leagueSettings = {
    submissionDays: league.submissionDays,
    votingDays: league.votingDays,
    votesPerPlayer: league.votesPerPlayer
  };

  // Only show comments if the prompt is in VOTING phase or completed
  const canViewComments = response.prompt.status === 'VOTING' || response.prompt.status === 'COMPLETED';

  if (!canViewComments) {
    return NextResponse.json({
      comments: [],
      canComment: false,
      message: 'Comments not available during submission phase'
    });
  }

  // Check if user can still comment
  // During VOTING: can comment on others' submissions (not own)
  // During COMPLETED: can comment on any submission (including own)
  const canComment = response.prompt.status === 'COMPLETED' ||
    (response.prompt.status === 'VOTING' &&
     !isPhaseExpired(response.prompt, leagueSettings) &&
     response.userId !== session.user.id);

  // Filter comments based on prompt status:
  // - During VOTING: only show user's own comments
  // - During COMPLETED: show all comments
  let visibleComments = response.comments;
  if (response.prompt.status === 'VOTING') {
    visibleComments = response.comments.filter(comment => comment.authorId === session.user.id);
  }

  return NextResponse.json({
    comments: visibleComments.map(comment => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author,
      canEdit: comment.authorId === session.user.id && canComment,
      isOwn: comment.authorId === session.user.id
    })),
    canComment,
    responseId: response.id
  });
};

const createOrUpdateComment = async ({ req, session }: AuthenticatedApiContext) => {
  const { responseId, text } = await req.json();

  // Validate required fields
  validateRequired({ responseId, text }, ['responseId', 'text']);

  if (!text.trim()) {
    throw new ValidationError('Comment text cannot be empty');
  }

  if (text.length > 500) {
    throw new ValidationError('Comment text cannot exceed 500 characters');
  }

  // Get the response with prompt info
  const response = await db.response.findUnique({
    where: { id: responseId },
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
  });

  if (!response) {
    throw new NotFoundError('Response not found');
  }

  // Validate league membership
  await validateLeagueMembership(db, session.user.id, response.prompt.leagueId);

  // Allow comments during VOTING or COMPLETED phase
  if (response.prompt.status !== 'VOTING' && response.prompt.status !== 'COMPLETED') {
    throw new ForbiddenError('Comments can only be made during the voting phase or after completion');
  }

  // Get league settings to check if voting window is still open (for VOTING phase only)
  const league = await db.league.findUnique({
    where: { id: response.prompt.leagueId },
    select: {
      submissionDays: true,
      votingDays: true,
      votesPerPlayer: true
    }
  });

  if (!league) {
    throw new NotFoundError('League not found');
  }

  const leagueSettings = {
    submissionDays: league.submissionDays,
    votingDays: league.votingDays,
    votesPerPlayer: league.votesPerPlayer
  };

  // Check if voting window is still open (only for VOTING phase, COMPLETED is always open)
  if (response.prompt.status === 'VOTING' && isPhaseExpired(response.prompt, leagueSettings)) {
    throw new ForbiddenError('Commenting window has closed');
  }

  // Check if user already has a comment on this response
  const existingComment = await db.comment.findUnique({
    where: {
      authorId_responseId: {
        authorId: session.user.id,
        responseId: responseId
      }
    }
  });

  let comment;
  if (existingComment) {
    // Update existing comment
    comment = await db.comment.update({
      where: { id: existingComment.id },
      data: { text: text.trim() },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        }
      }
    });
  } else {
    // Create new comment
    comment = await db.comment.create({
      data: {
        text: text.trim(),
        authorId: session.user.id,
        responseId: responseId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        }
      }
    });
  }

  return NextResponse.json({
    comment: {
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author,
      canEdit: true,
      isOwn: true
    },
    message: existingComment ? 'Comment updated successfully' : 'Comment created successfully'
  });
};

export const { GET, POST } = createMethodHandlers({
  GET: getComments,
  POST: createOrUpdateComment
});
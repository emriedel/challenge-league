import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { processPromptQueue } from '@/lib/promptQueue';
import { ValidationError, NotFoundError, ForbiddenError, validateRequired, validateLeagueMembership } from '@/lib/apiErrors';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

const getResponses = async ({ req, session }: AuthenticatedApiContext) => {
  // Get league ID from query params
  const { searchParams } = new URL(req.url);
  const leagueId = searchParams.get('id');

  if (!leagueId) {
    throw new ValidationError('League ID is required');
  }

  // Validate league membership
  await validateLeagueMembership(db, session.user.id, leagueId);

  // Get league with member info
  const league = await db.league.findUnique({
    where: { id: leagueId },
    include: {
      memberships: {
        where: { isActive: true },
        select: { userId: true }
      }
    }
  });

  if (!league) {
    throw new NotFoundError('League');
  }

  // Get all league member IDs
  const leagueMemberIds = league.memberships.map(m => m.userId);

  // Get all completed prompts from this league with their responses
  const completedPrompts = await db.prompt.findMany({
    where: { 
      status: 'COMPLETED',
      leagueId: league.id
    },
    include: {
      responses: {
        where: {
          userId: { in: leagueMemberIds },
          isPublished: true
        },
        include: {
          user: {
            select: {
              username: true,
              profilePhoto: true
            }
          },
          votes: {
            include: {
              voter: {
                select: {
                  username: true
                }
              }
            }
          }
        },
        orderBy: [
          { finalRank: 'asc' }, // Show ranked results first
          { totalPoints: 'desc' },
          { submittedAt: 'desc' }
        ]
      }
    },
    orderBy: { weekEnd: 'desc' } // Most recent rounds first
  });

  return NextResponse.json({
    rounds: completedPrompts
  });
};

const createResponse = async ({ req, session }: AuthenticatedApiContext) => {
  // Process prompt queue to ensure current state is correct
  await processPromptQueue();

  const { promptId, photoUrl, caption, leagueId } = await req.json();

  // Validate required fields
  validateRequired(
    { promptId, photoUrl, caption: caption?.trim(), leagueId },
    ['promptId', 'photoUrl', 'caption', 'leagueId']
  );

  // Validate league membership
  await validateLeagueMembership(db, session.user.id, leagueId);

  // Verify prompt exists, is active, and belongs to this league
  const prompt = await db.prompt.findUnique({
    where: { id: promptId }
  });

  if (!prompt) {
    throw new NotFoundError('Prompt');
  }

  if (prompt.leagueId !== leagueId) {
    throw new ForbiddenError('This prompt does not belong to the specified league');
  }

  if (prompt.status !== 'ACTIVE') {
    throw new ValidationError('This prompt is no longer accepting submissions');
  }

  // Check if submission window is still open
  if (new Date() >= new Date(prompt.weekEnd)) {
    throw new ValidationError('Submission window has closed');
  }

  // Check if user has already submitted for this prompt
  const existingResponse = await db.response.findFirst({
    where: {
      userId: session.user.id,
      promptId: promptId
    }
  });

  // Create or update the response
  let response;
  if (existingResponse) {
    // Update existing response
    response = await db.response.update({
      where: { id: existingResponse.id },
      data: {
        imageUrl: photoUrl,
        caption: caption.trim(),
        submittedAt: new Date(), // Update submission time
      },
      include: {
        user: {
          select: {
            username: true,
            profilePhoto: true
          }
        },
        prompt: {
          select: {
            text: true,
            weekEnd: true
          }
        }
      }
    });
  } else {
    // Create new response
    response = await db.response.create({
      data: {
        userId: session.user.id,
        promptId: promptId,
        imageUrl: photoUrl,
        caption: caption.trim(),
        isPublished: false // Will be published when prompt ends
      },
      include: {
        user: {
          select: {
            username: true,
            profilePhoto: true
          }
        },
        prompt: {
          select: {
            text: true,
            weekEnd: true
          }
        }
      }
    });
  }

  return NextResponse.json({
    success: true,
    response: {
      id: response.id,
      photoUrl: response.imageUrl,
      caption: response.caption,
      createdAt: response.submittedAt,
      user: response.user,
      prompt: response.prompt
    }
  });
};

export const { GET, POST } = createMethodHandlers({
  GET: getResponses,
  POST: createResponse
});
import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { ValidationError, NotFoundError, ForbiddenError, validateRequired, validateLeagueMembership } from '@/lib/apiErrors';
import { calculatePhaseEndTime } from '@/lib/phaseCalculations';
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
                  username: true,
                  id: true
                }
              }
            }
          }
        },
        orderBy: [
          { finalRank: 'asc' }, // Show ranked results first
          { totalVotes: 'desc' },
          { submittedAt: 'desc' }
        ]
      }
    },
    orderBy: { updatedAt: 'desc' } // Most recent rounds first
  });

  // Add calculated dates, challenge numbers, and voting participation analysis to completed prompts
  const roundsWithDates = await Promise.all(completedPrompts.map(async (prompt, index) => {
    // For completed prompts, calculate when the submission phase ended
    const submissionEndDate = prompt.phaseStartedAt
      ? calculatePhaseEndTime(new Date(prompt.phaseStartedAt), 'ACTIVE')
      : null;

    // Calculate challenge number based on completion order
    // Since rounds are ordered by updatedAt DESC, the most recent is index 0
    // So the challenge number is (total completed - current index)
    const challengeNumber = completedPrompts.length - index;

    // Get all users who voted in this prompt
    const votersInThisRound = await db.vote.findMany({
      where: {
        response: {
          promptId: prompt.id
        }
      },
      select: {
        voterId: true
      },
      distinct: ['voterId']
    });

    const voterIds = new Set(votersInThisRound.map(v => v.voterId));

    // Enhance responses with voting participation data
    const enhancedResponses = prompt.responses.map(response => {
      // Check if this response's author voted in this round
      const authorVoted = voterIds.has(response.userId);

      // Count votes from users who also voted in this round (eligible votes for standings)
      const standingVotes = response.votes.filter(vote => voterIds.has(vote.voter.id));
      const eligibleVoteCount = standingVotes.length;

      return {
        ...response,
        // Add voting participation metadata
        votingMetadata: {
          authorVoted,
          totalVotes: response.totalVotes, // Raw vote count (all votes)
          standingVotes: eligibleVoteCount, // Votes from users who voted (counts for standings)
          votersWhoVoted: standingVotes.length // Number of voters who also participated
        }
      };
    });

    return {
      ...prompt,
      responses: enhancedResponses,
      weekEnd: submissionEndDate ? submissionEndDate.toISOString() : null,
      weekStart: prompt.phaseStartedAt ? new Date(prompt.phaseStartedAt).toISOString() : null,
      challengeNumber
    };
  }));

  return NextResponse.json({
    rounds: roundsWithDates
  });
};

const createResponse = async ({ req, session }: AuthenticatedApiContext) => {
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

  // Check if submission window is still open using dynamic calculation
  const { isSubmissionWindowOpen } = await import('@/lib/phaseCalculations');
  if (!isSubmissionWindowOpen(prompt)) {
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
            phaseStartedAt: true,
            status: true
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
            phaseStartedAt: true,
            status: true
          }
        }
      }
    });
  }

  // Refresh PWA badge since user action completed
  const responseData = NextResponse.json({
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

  // Set a custom header to trigger badge refresh on client
  responseData.headers.set('X-Refresh-PWA-Badge', 'true');

  return responseData;
};

export const { GET, POST } = createMethodHandlers({
  GET: getResponses,
  POST: createResponse
});
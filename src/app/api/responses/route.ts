import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { ValidationError, NotFoundError, ForbiddenError, validateRequired, validateLeagueMembership } from '@/lib/apiErrors';
import { calculatePhaseEndTime } from '@/lib/phaseCalculations';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';
import { sanitizeCaption, sanitizeText } from '@/lib/sanitize';
import { del } from '@vercel/blob';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

/**
 * Helper function to safely delete old photo from storage
 */
async function deleteOldPhoto(photoUrl: string) {
  if (!photoUrl) return;

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasValidBlobToken = blobToken && blobToken.startsWith('vercel_blob_rw_') && !isDevelopment;

    if (hasValidBlobToken && photoUrl.includes('vercel-storage.com')) {
      // Delete from Vercel Blob
      await del(photoUrl, { token: blobToken });
      console.log(`Deleted old challenge photo blob: ${photoUrl}`);
    } else if (photoUrl.startsWith('/uploads/')) {
      // Delete from local storage
      const filename = photoUrl.replace('/uploads/', '');
      const filepath = join(process.cwd(), 'public', 'uploads', filename);
      await unlink(filepath);
      console.log(`Deleted old challenge photo local file: ${filepath}`);
    }
  } catch (error) {
    // Log but don't fail - orphaned files are acceptable
    console.error('Failed to delete old challenge photo (non-critical):', error);
  }
}

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
    // For completed prompts, use the actual completion timestamp instead of calculating it
    // This fixes the bug where calculated times could show in the future
    const challengeEndDate = prompt.completedAt || (
      // Fallback for older prompts that don't have completedAt yet
      prompt.phaseStartedAt ? calculatePhaseEndTime(new Date(prompt.phaseStartedAt), 'ACTIVE') : null
    );

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
      weekEnd: challengeEndDate ? challengeEndDate.toISOString() : null,
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

  // Sanitize user inputs
  const sanitizedCaption = sanitizeCaption(caption || '');
  const sanitizedPhotoUrl = sanitizeText(photoUrl || '');
  const sanitizedPromptId = sanitizeText(promptId || '');
  const sanitizedLeagueId = sanitizeText(leagueId || '');

  // Validate required fields (using sanitized values)
  validateRequired(
    { promptId: sanitizedPromptId, photoUrl: sanitizedPhotoUrl, caption: sanitizedCaption, leagueId: sanitizedLeagueId },
    ['promptId', 'photoUrl', 'caption', 'leagueId']
  );

  // Validate league membership (using sanitized leagueId)
  await validateLeagueMembership(db, session.user.id, sanitizedLeagueId);

  // Verify prompt exists, is active, and belongs to this league
  const prompt = await db.prompt.findUnique({
    where: { id: sanitizedPromptId }
  });

  if (!prompt) {
    throw new NotFoundError('Prompt');
  }

  if (prompt.leagueId !== sanitizedLeagueId) {
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
      promptId: sanitizedPromptId
    }
  });

  // Create or update the response
  let response;
  if (existingResponse) {
    // Store old image URL for cleanup
    const oldImageUrl = existingResponse.imageUrl;

    // Update existing response (using sanitized values)
    response = await db.response.update({
      where: { id: existingResponse.id },
      data: {
        imageUrl: sanitizedPhotoUrl,
        caption: sanitizedCaption,
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

    // Delete old photo only after successful DB update and if URL changed
    if (oldImageUrl && oldImageUrl !== sanitizedPhotoUrl) {
      await deleteOldPhoto(oldImageUrl);
    }
  } else {
    // Create new response (using sanitized values)
    response = await db.response.create({
      data: {
        userId: session.user.id,
        promptId: sanitizedPromptId,
        imageUrl: sanitizedPhotoUrl,
        caption: sanitizedCaption,
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
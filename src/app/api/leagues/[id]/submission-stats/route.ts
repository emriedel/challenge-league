import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { ValidationError, NotFoundError, validateLeagueMembership } from '@/lib/apiErrors';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

interface RouteParams {
  params: { id: string };
}

const getSubmissionStats = async ({ req, session, params }: AuthenticatedApiContext) => {
  if (!params?.id) {
    throw new ValidationError('League ID is required');
  }
  const leagueId = params.id;

  // Validate league membership
  await validateLeagueMembership(db, session.user.id, leagueId);

  // Get current active prompt for this league
  const activePrompt = await db.prompt.findFirst({
    where: {
      status: 'ACTIVE',
      leagueId: leagueId
    },
    include: {
      responses: {
        // During ACTIVE phase, show ALL submissions for participation stats
        // Don't filter by isPublished since we're just counting participation
        select: {
          id: true,
          submittedAt: true,
          userId: true,
          isPublished: true,
          user: {
            select: {
              username: true,
              profilePhoto: true
            }
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      }
    }
  });

  if (!activePrompt) {
    return NextResponse.json({
      hasActiveChallenge: false,
      submissionCount: 0,
      submitters: [],
      totalMembers: 0
    });
  }

  // Get total active members count
  const totalMembers = await db.leagueMembership.count({
    where: {
      leagueId: leagueId,
      isActive: true
    }
  });

  // For ACTIVE phase: count ALL submissions for participation stats
  // isPublished is only for controlling voting visibility, not participation tracking
  const allResponses = activePrompt.responses;

  // Shuffle and pick up to 6 random submitters for display
  const shuffledSubmissions = [...allResponses].sort(() => Math.random() - 0.5);
  const displaySubmitters = shuffledSubmissions.slice(0, 6);

  return NextResponse.json({
    hasActiveChallenge: true,
    submissionCount: allResponses.length,
    totalMembers,
    submitters: displaySubmitters.map(response => ({
      id: response.id,
      userId: response.userId,
      submittedAt: response.submittedAt,
      user: {
        username: response.user.username,
        profilePhoto: response.user.profilePhoto
      }
    }))
  });
};

export const { GET } = createMethodHandlers({
  GET: getSubmissionStats,
});
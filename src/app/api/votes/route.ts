import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { ValidationError, NotFoundError, ForbiddenError, validateRequired, validateLeagueMembership } from '@/lib/apiErrors';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';
import { getRealisticPhaseEndTime } from '@/lib/phaseCalculations';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

const getVotingData = async ({ req, session }: AuthenticatedApiContext) => {
  // Get league ID from query params
  const { searchParams } = new URL(req.url);
  const leagueId = searchParams.get('id');

  if (!leagueId) {
    throw new ValidationError('League ID is required');
  }

  // Validate league membership
  await validateLeagueMembership(db, session.user.id, leagueId);

  // Get current voting prompt for this league
  const votingPrompt = await db.prompt.findFirst({
    where: { 
      status: 'VOTING',
      leagueId: leagueId
    },
    include: {
      responses: {
        where: { isPublished: true },
        select: {
          id: true,
          caption: true,
          imageUrl: true,
          submittedAt: true,
          userId: true, // Explicitly include userId for frontend logic
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

  if (!votingPrompt) {
    return NextResponse.json({
      prompt: null,
      responses: [],
      canVote: false,
      message: 'No voting session currently active'
    });
  }

  // Get league settings for dynamic calculations
  const league = await db.league.findUnique({
    where: { id: leagueId },
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

  // Trust database state - if prompt status is VOTING, allow voting
  const realisticVoteEndTime = getRealisticPhaseEndTime(votingPrompt, leagueSettings);

  // Get user's existing votes for this prompt (excluding self-votes)
  const existingVotes = await db.vote.findMany({
    where: {
      voterId: session.user.id,
      isSelfVote: false, // Exclude self-votes from user's votable votes
      response: {
        promptId: votingPrompt.id
      }
    },
    include: {
      response: {
        select: {
          id: true
        }
      }
    }
  });

  // Get self-vote separately (for UI display)
  const selfVote = await db.vote.findFirst({
    where: {
      voterId: session.user.id,
      isSelfVote: true,
      response: {
        promptId: votingPrompt.id
      }
    },
    include: {
      response: {
        select: {
          id: true
        }
      }
    }
  });

  // Include all responses but track which ones are votable
  const allResponses = votingPrompt.responses;
  const votableResponses = votingPrompt.responses.filter(
    response => response.userId !== session.user.id
  );

  return NextResponse.json({
    prompt: votingPrompt,
    responses: allResponses, // Include all responses
    votableResponseIds: votableResponses.map(r => r.id), // Track which ones can be voted on
    existingVotes: existingVotes,
    selfVote: selfVote ? { responseId: selfVote.response.id } : null, // Include self-vote info
    canVote: true,
    voteEnd: realisticVoteEndTime?.toISOString(),
    currentUserId: session.user.id // Include current user ID for frontend logic
  });
};

const submitVotes = async ({ req, session }: AuthenticatedApiContext) => {
  const { votes, leagueId } = await req.json();

  // Validate required fields
  validateRequired({ votes, leagueId }, ['votes', 'leagueId']);

  // Validate league membership
  await validateLeagueMembership(db, session.user.id, leagueId);

  if (!votes || typeof votes !== 'object') {
    throw new ValidationError('Invalid votes format');
  }

  // Get league settings to validate vote count
  const league = await db.league.findUnique({
    where: { id: leagueId },
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

  // Get current voting prompt for this league
  const votingPrompt = await db.prompt.findFirst({
    where: { 
      status: 'VOTING',
      leagueId: leagueId
    },
    include: {
      responses: {
        where: { isPublished: true }
      }
    }
  });

  if (!votingPrompt) {
    throw new NotFoundError('No voting session currently active');
  }

  // Get votable responses (excluding user's own submission)
  const votableResponses = votingPrompt.responses.filter(
    response => response.userId !== session.user.id
  );
  
  // Calculate required votes as minimum of available submissions and max votes allowed
  const requiredVotes = Math.min(votableResponses.length, leagueSettings.votesPerPlayer);
  
  // Calculate total votes - should be exactly the required votes
  const totalVotes = Object.values(votes).reduce((sum: number, count) => sum + (count as number), 0);
  if (totalVotes !== requiredVotes) {
    throw new ValidationError(`Must use exactly ${requiredVotes} votes`);
  }

  // Validate that each vote is exactly 1 (one vote per submission)
  for (const count of Object.values(votes)) {
    if (count !== 1) {
      throw new ValidationError('Each submission can receive only one vote');
    }
  }

  // Trust database state - if prompt status is VOTING, allow vote submission

  // Validate that responses exist and user isn't voting for their own
  const responseIds = votingPrompt.responses.map(r => r.id);
  const userResponseIds = votingPrompt.responses
    .filter(r => r.userId === session.user.id)
    .map(r => r.id);

  for (const responseId of Object.keys(votes)) {
    if (!responseIds.includes(responseId)) {
      throw new ValidationError('Invalid response ID');
    }
    
    if (userResponseIds.includes(responseId)) {
      throw new ForbiddenError('Cannot vote for your own submission');
    }
  }

  // Remove existing votes for this prompt (excluding self-votes which are permanent)
  await db.vote.deleteMany({
    where: {
      voterId: session.user.id,
      isSelfVote: false, // Don't delete self-votes
      response: {
        promptId: votingPrompt.id
      }
    }
  });

  // Create new votes - each vote counts as 1
  const createdVotes = [];
  for (const [responseId, count] of Object.entries(votes)) {
    const voteCount = count as number;
    if (voteCount === 1) { // Should always be 1 due to validation above
      const vote = await db.vote.create({
        data: {
          voterId: session.user.id,
          responseId: responseId
        }
      });
      createdVotes.push(vote);
    }
  }

  // Create self-vote if user has a submission for this prompt
  const userSubmission = votingPrompt.responses.find(r => r.userId === session.user.id);
  if (userSubmission) {
    await db.vote.create({
      data: {
        voterId: session.user.id,
        responseId: userSubmission.id,
        isSelfVote: true
      }
    });
  }

  // Refresh PWA badge since user action completed
  const responseData = NextResponse.json({
    success: true,
    votes: createdVotes,
    message: 'Votes submitted successfully'
  });

  // Set a custom header to trigger badge refresh on client
  responseData.headers.set('X-Refresh-PWA-Badge', 'true');

  return responseData;
};

export const { GET, POST } = createMethodHandlers({
  GET: getVotingData,
  POST: submitVotes
});
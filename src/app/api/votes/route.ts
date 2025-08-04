import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

const getVotingData = async ({ req, session }: AuthenticatedApiContext) => {
  // Get league ID from query params
  const { searchParams } = new URL(req.url);
  const leagueId = searchParams.get('id');

  if (!leagueId) {
    throw new Error('League ID is required');
  }

  // Find the league and verify membership
  const league = await db.league.findUnique({
    where: { id: leagueId }
  });

  if (!league) {
    const error = new Error('League not found');
    (error as any).status = 404;
    throw error;
  }

  const userMembership = await db.leagueMembership.findUnique({
    where: {
      userId_leagueId: {
        userId: session.user.id,
        leagueId: league.id
      }
    }
  });

  if (!userMembership || !userMembership.isActive) {
    const error = new Error('You are not a member of this league');
    (error as any).status = 403;
    throw error;
  }

  // Get current voting prompt for this league
  const votingPrompt = await db.prompt.findFirst({
    where: { 
      status: 'VOTING',
      leagueId: league.id
    },
    include: {
      responses: {
        where: { isPublished: true },
        include: {
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

  // Check if voting window is still open
  const now = new Date();
  const voteEnd = new Date(votingPrompt.voteEnd);
  if (now >= voteEnd) {
    return NextResponse.json({
      prompt: votingPrompt,
      responses: votingPrompt.responses,
      canVote: false,
      message: 'Voting window has closed'
    });
  }

  // Get user's existing votes for this prompt
  const existingVotes = await db.vote.findMany({
    where: {
      voterId: session.user.id,
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

  // Filter out user's own response from voting options
  const votableResponses = votingPrompt.responses.filter(
    response => response.userId !== session.user.id
  );

  return NextResponse.json({
    prompt: votingPrompt,
    responses: votableResponses,
    existingVotes: existingVotes,
    canVote: true,
    voteEnd: votingPrompt.voteEnd
  });
};

const submitVotes = async ({ req, session }: AuthenticatedApiContext) => {
  const { votes, leagueId } = await req.json();

  if (!leagueId) {
    throw new Error('League ID is required');
  }

  // Find the league and verify membership
  const league = await db.league.findUnique({
    where: { id: leagueId }
  });

  if (!league) {
    const error = new Error('League not found');
    (error as any).status = 404;
    throw error;
  }

  const userMembership = await db.leagueMembership.findUnique({
    where: {
      userId_leagueId: {
        userId: session.user.id,
        leagueId: league.id
      }
    }
  });

  if (!userMembership || !userMembership.isActive) {
    const error = new Error('You are not a member of this league');
    (error as any).status = 403;
    throw error;
  }

  if (!votes || typeof votes !== 'object') {
    throw new Error('Invalid votes format');
  }

  // Calculate total votes - should be exactly 3
  const totalVotes = Object.values(votes).reduce((sum: number, count) => sum + (count as number), 0);
  if (totalVotes !== 3) {
    throw new Error('Must use exactly 3 votes');
  }

  // Get current voting prompt for this league
  const votingPrompt = await db.prompt.findFirst({
    where: { 
      status: 'VOTING',
      leagueId: league.id
    },
    include: {
      responses: {
        where: { isPublished: true }
      }
    }
  });

  if (!votingPrompt) {
    throw new Error('No voting session currently active');
  }

  // Check if voting window is still open
  const now = new Date();
  if (now >= new Date(votingPrompt.voteEnd)) {
    throw new Error('Voting window has closed');
  }

  // Validate that responses exist and user isn't voting for their own
  const responseIds = votingPrompt.responses.map(r => r.id);
  const userResponseIds = votingPrompt.responses
    .filter(r => r.userId === session.user.id)
    .map(r => r.id);

  for (const responseId of Object.keys(votes)) {
    if (!responseIds.includes(responseId)) {
      throw new Error('Invalid response ID');
    }
    
    if (userResponseIds.includes(responseId)) {
      throw new Error('Cannot vote for your own submission');
    }
  }

  // Remove existing votes for this prompt
  await db.vote.deleteMany({
    where: {
      voterId: session.user.id,
      response: {
        promptId: votingPrompt.id
      }
    }
  });

  // Create new votes - each vote is worth 1 point
  const createdVotes = [];
  for (const [responseId, count] of Object.entries(votes)) {
    const voteCount = count as number;
    if (voteCount > 0) {
      for (let i = 0; i < voteCount; i++) {
        const vote = await db.vote.create({
          data: {
            voterId: session.user.id,
            responseId: responseId,
            points: 1 // Each vote worth 1 point
          }
        });
        createdVotes.push(vote);
      }
    }
  }

  return NextResponse.json({
    success: true,
    votes: createdVotes,
    message: 'Votes submitted successfully'
  });
};

export const { GET, POST } = createMethodHandlers({
  GET: getVotingData,
  POST: submitVotes
});
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get league ID from query params
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('id');

    if (!leagueId) {
      return NextResponse.json({ 
        error: 'League ID is required' 
      }, { status: 400 });
    }

    // Find the league and verify membership
    const league = await db.league.findUnique({
      where: { id: leagueId }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
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
      return NextResponse.json({ 
        error: 'You are not a member of this league' 
      }, { status: 403 });
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
                username: true
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

  } catch (error) {
    console.error('Error fetching voting data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch voting data' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { votes, leagueId } = await request.json();

    if (!leagueId) {
      return NextResponse.json({ 
        error: 'League ID is required' 
      }, { status: 400 });
    }

    // Find the league and verify membership
    const league = await db.league.findUnique({
      where: { id: leagueId }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
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
      return NextResponse.json({ 
        error: 'You are not a member of this league' 
      }, { status: 403 });
    }

    if (!votes || typeof votes !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid votes format' 
      }, { status: 400 });
    }

    // Calculate total votes - should be exactly 3
    const totalVotes = Object.values(votes).reduce((sum: number, count) => sum + (count as number), 0);
    if (totalVotes !== 3) {
      return NextResponse.json({ 
        error: 'Must use exactly 3 votes' 
      }, { status: 400 });
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
      return NextResponse.json({ 
        error: 'No voting session currently active' 
      }, { status: 400 });
    }

    // Check if voting window is still open
    const now = new Date();
    if (now >= new Date(votingPrompt.voteEnd)) {
      return NextResponse.json({ 
        error: 'Voting window has closed' 
      }, { status: 400 });
    }

    // Validate that responses exist and user isn't voting for their own
    const responseIds = votingPrompt.responses.map(r => r.id);
    const userResponseIds = votingPrompt.responses
      .filter(r => r.userId === session.user.id)
      .map(r => r.id);

    for (const responseId of Object.keys(votes)) {
      if (!responseIds.includes(responseId)) {
        return NextResponse.json({ 
          error: 'Invalid response ID' 
        }, { status: 400 });
      }
      
      if (userResponseIds.includes(responseId)) {
        return NextResponse.json({ 
          error: 'Cannot vote for your own submission' 
        }, { status: 400 });
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
              rank: 1, // All votes have equal rank
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

  } catch (error) {
    console.error('Vote submission error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit votes' 
    }, { status: 500 });
  }
}
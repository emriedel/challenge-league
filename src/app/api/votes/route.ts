import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current voting prompt
    const votingPrompt = await db.prompt.findFirst({
      where: { status: 'VOTING' },
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

    const { votes } = await request.json();

    if (!votes || !Array.isArray(votes) || votes.length !== 3) {
      return NextResponse.json({ 
        error: 'Must provide exactly 3 votes with ranks 1, 2, and 3' 
      }, { status: 400 });
    }

    // Validate vote structure
    const requiredRanks = [1, 2, 3];
    const providedRanks = votes.map(v => v.rank).sort();
    
    if (JSON.stringify(providedRanks) !== JSON.stringify(requiredRanks)) {
      return NextResponse.json({ 
        error: 'Votes must have ranks 1, 2, and 3' 
      }, { status: 400 });
    }

    // Get current voting prompt
    const votingPrompt = await db.prompt.findFirst({
      where: { status: 'VOTING' },
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

    for (const vote of votes) {
      if (!responseIds.includes(vote.responseId)) {
        return NextResponse.json({ 
          error: 'Invalid response ID' 
        }, { status: 400 });
      }
      
      if (userResponseIds.includes(vote.responseId)) {
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

    // Create new votes
    const createdVotes = await Promise.all(
      votes.map(vote => 
        db.vote.create({
          data: {
            voterId: session.user.id,
            responseId: vote.responseId,
            rank: vote.rank,
            points: 4 - vote.rank // 1st = 3pts, 2nd = 2pts, 3rd = 1pt
          }
        })
      )
    );

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
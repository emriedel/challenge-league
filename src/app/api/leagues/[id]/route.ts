import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withLeagueAccess } from '@/lib/leagueMiddleware';
import { db } from '@/lib/db';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// GET /api/leagues/[id] - Get specific league data
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Verify league access and get members
    const accessResult = await withLeagueAccess(id, { includeMembers: true });
    if (!accessResult.success) {
      return accessResult.response;
    }

    const { session, league } = accessResult.context;

    // OPTIMIZED: Get league standings with batched queries to fix N+1 performance issue
    const memberUserIds = (league.memberships || []).map(m => m.userId);

    // Batch query 1: Get all completed prompts for this league (single query instead of N)
    const completedPrompts = await db.prompt.findMany({
      where: {
        status: 'COMPLETED',
        leagueId: league.id
      },
      select: {
        id: true,
        text: true
      }
    });

    const completedPromptIds = completedPrompts.map(p => p.id);

    // Batch query 2: Get all responses from league members for completed prompts (single query)
    const allResponses = await db.response.findMany({
      where: {
        userId: { in: memberUserIds },
        isPublished: true,
        promptId: { in: completedPromptIds }
      },
      select: {
        userId: true,
        totalVotes: true,
        finalRank: true,
        promptId: true
      }
    });

    // Batch query 3: Get all votes from league members for completed prompts (single query)
    const allVotes = await db.vote.findMany({
      where: {
        voterId: { in: memberUserIds },
        response: {
          promptId: { in: completedPromptIds }
        }
      },
      select: {
        voterId: true,
        response: {
          select: {
            promptId: true
          }
        }
      }
    });

    // Get current active or voting prompt to check who has submitted
    const currentPrompt = await db.prompt.findFirst({
      where: {
        leagueId: league.id,
        status: { in: ['ACTIVE', 'VOTING'] }
      },
      select: {
        id: true,
        responses: {
          where: {
            userId: { in: memberUserIds }
            // Don't filter by isPublished - we want to show icon for users who submitted
            // even during ACTIVE phase (before responses are published)
          },
          select: {
            userId: true
          }
        }
      }
    });

    // Create a set of user IDs who have submitted to the current prompt
    const currentSubmitters = new Set(
      currentPrompt?.responses.map(r => r.userId) || []
    );

    // Get votes for the current prompt to check who has voted
    const currentVoters = currentPrompt ? await db.vote.findMany({
      where: {
        voterId: { in: memberUserIds },
        response: {
          promptId: currentPrompt.id
        }
      },
      select: {
        voterId: true
      },
      distinct: ['voterId']
    }) : [];

    const currentVoterIds = new Set(currentVoters.map(v => v.voterId));

    // Process data in memory to calculate leaderboard stats
    const leaderboard = (league.memberships || []).map((membership) => {
      const userId = membership.userId;

      // Get user's responses
      const userResponses = allResponses.filter(r => r.userId === userId);

      // Get prompts where user voted
      const userVotedPromptIds = new Set(
        allVotes
          .filter(v => v.voterId === userId)
          .map(v => v.response.promptId)
      );

      // Only count votes from responses in rounds where the user voted
      const eligibleResponses = userResponses.filter(response =>
        userVotedPromptIds.has(response.promptId)
      );

      const totalVotes = eligibleResponses.reduce((sum, response) => sum + response.totalVotes, 0);
      const totalSubmissions = userResponses.length;
      const wins = eligibleResponses.filter(r => r.finalRank === 1).length;
      const podiumFinishes = eligibleResponses.filter(r => r.finalRank && r.finalRank <= 3).length;

      return {
        user: membership.user,
        stats: {
          totalVotes,
          totalSubmissions,
          wins,
          podiumFinishes,
          averageRank: eligibleResponses.length > 0
            ? eligibleResponses.reduce((sum, r) => sum + (r.finalRank || 0), 0) / eligibleResponses.length
            : 0,
          votingParticipation: userVotedPromptIds.size,
          totalCompletedRounds: completedPrompts.length
        },
        hasSubmittedCurrent: currentSubmitters.has(userId),
        hasVotedCurrent: currentVoterIds.has(userId)
      };
    });

    // Sort by total votes descending
    leaderboard.sort((a, b) => b.stats.totalVotes - a.stats.totalVotes);

    // Add league rank
    leaderboard.forEach((entry, index) => {
      (entry.stats as any).leagueRank = index + 1;
    });

    // Get recent activity - last 3 completed prompts from this league
    const recentPrompts = await db.prompt.findMany({
      where: {
        status: 'COMPLETED',
        leagueId: league.id
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 3,
      include: {
        responses: {
          where: {
            isPublished: true,
            userId: { in: (league.memberships || []).map(m => m.userId) }
          },
          include: {
            user: {
              select: {
                username: true
              }
            }
          },
          orderBy: {
            finalRank: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        description: league.description,
        inviteCode: league.ownerId === session.user.id ? league.inviteCode : undefined, // Only show to owner
        memberCount: league.memberships?.length || 0,
        isOwner: league.ownerId === session.user.id,
        isStarted: league.isStarted,
        owner: league.owner,
        // Include configurable league settings
        submissionDays: league.submissionDays,
        votingDays: league.votingDays,
        votesPerPlayer: league.votesPerPlayer
      },
      leaderboard,
      recentActivity: recentPrompts
    });

  } catch (error) {
    console.error('Error fetching league data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch league data' 
    }, { status: 500 });
  }
}

// PUT /api/leagues/[id] - Update league (owner only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { name, description } = await request.json();

    // Find the league
    const league = await db.league.findUnique({
      where: { id }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
    }

    // Check if user is the owner
    if (league.ownerId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only the league owner can update league settings' 
      }, { status: 403 });
    }

    // Update the league
    const updatedLeague = await db.league.update({
      where: { id: league.id },
      data: {
        name: name || league.name,
        description: description || league.description,
      }
    });

    return NextResponse.json({ league: updatedLeague });

  } catch (error) {
    console.error('Error updating league:', error);
    return NextResponse.json({ 
      error: 'Failed to update league' 
    }, { status: 500 });
  }
}
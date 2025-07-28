import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { processPromptQueue } from '@/lib/promptQueue';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get league slug from query params
    const { searchParams } = new URL(request.url);
    const leagueSlug = searchParams.get('slug');

    if (!leagueSlug) {
      return NextResponse.json({ 
        error: 'League slug is required' 
      }, { status: 400 });
    }

    // Find the league and verify membership
    const league = await db.league.findUnique({
      where: { slug: leagueSlug },
      include: {
        memberships: {
          where: { isActive: true },
          select: { userId: true }
        }
      }
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

    // Get all league member IDs
    const leagueMemberIds = league.memberships.map(m => m.userId);

    // Get published responses from league members for the most recent completed prompt in this league
    const latestCompletedPrompt = await db.prompt.findFirst({
      where: { 
        status: 'COMPLETED',
        leagueId: league.id
      },
      orderBy: { weekEnd: 'desc' }
    });

    if (!latestCompletedPrompt) {
      return NextResponse.json({
        responses: [],
        prompt: null
      });
    }

    const responses = await db.response.findMany({
      where: {
        promptId: latestCompletedPrompt.id,
        userId: { in: leagueMemberIds },
        isPublished: true
      },
      include: {
        user: {
          select: {
            username: true
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
    });

    return NextResponse.json({
      responses: responses,
      prompt: latestCompletedPrompt
    });

  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch responses' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process prompt queue to ensure current state is correct
    await processPromptQueue();

    const { promptId, photoUrl, caption, leagueSlug } = await request.json();

    if (!promptId || !photoUrl || !caption?.trim()) {
      return NextResponse.json({ 
        error: 'Missing required fields: promptId, photoUrl, and caption' 
      }, { status: 400 });
    }

    if (!leagueSlug) {
      return NextResponse.json({ 
        error: 'League slug is required' 
      }, { status: 400 });
    }

    // Find the league and verify membership
    const league = await db.league.findUnique({
      where: { slug: leagueSlug }
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

    // Verify prompt exists, is active, and belongs to this league
    const prompt = await db.prompt.findUnique({
      where: { id: promptId }
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (prompt.leagueId !== league.id) {
      return NextResponse.json({ 
        error: 'This prompt does not belong to the specified league' 
      }, { status: 400 });
    }

    if (prompt.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: 'This prompt is no longer accepting submissions' 
      }, { status: 400 });
    }

    // Check if submission window is still open
    if (new Date() >= new Date(prompt.weekEnd)) {
      return NextResponse.json({ 
        error: 'Submission window has closed' 
      }, { status: 400 });
    }

    // Check if user has already submitted for this prompt
    const existingResponse = await db.response.findFirst({
      where: {
        userId: session.user.id,
        promptId: promptId
      }
    });

    if (existingResponse) {
      return NextResponse.json({ 
        error: 'You have already submitted a response to this prompt' 
      }, { status: 400 });
    }

    // Create the response
    const response = await db.response.create({
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
            username: true
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

  } catch (error) {
    console.error('Response submission error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit response' 
    }, { status: 500 });
  }
}
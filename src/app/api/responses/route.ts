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

    // Get user's friends
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { senderId: session.user.id, status: 'ACCEPTED' },
          { receiverId: session.user.id, status: 'ACCEPTED' },
        ],
      },
      include: {
        sender: { select: { id: true } },
        receiver: { select: { id: true } },
      },
    });

    const friendIds = friendships.map(friendship => 
      friendship.senderId === session.user.id 
        ? friendship.receiverId 
        : friendship.senderId
    );

    // Get published responses from friends for the most recent completed prompt
    const responses = await db.response.findMany({
      where: {
        userId: { in: friendIds },
        isPublished: true,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        prompt: {
          select: {
            text: true,
            weekStart: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50, // Limit to recent responses
    });

    // Shuffle responses for random order
    const shuffledResponses = responses.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      responses: shuffledResponses.map(response => ({
        id: response.id,
        caption: response.caption,
        imageUrl: response.imageUrl,
        submittedAt: response.submittedAt,
        publishedAt: response.publishedAt,
        user: {
          username: response.user.username,
        },
        prompt: {
          text: response.prompt.text,
          weekStart: response.prompt.weekStart,
        },
      })),
    });
  } catch (error) {
    console.error('Get responses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caption, imageUrl, promptId } = await request.json();

    if (!caption || !imageUrl || !promptId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify prompt exists and is active
    const prompt = await db.prompt.findFirst({
      where: {
        id: promptId,
        isActive: true,
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Invalid or inactive prompt' }, { status: 400 });
    }

    // Check if submission window is still open
    const now = new Date();
    if (now >= prompt.weekEnd) {
      return NextResponse.json({ error: 'Submission window has closed' }, { status: 400 });
    }

    // Check if user already submitted for this prompt
    const existingResponse = await db.response.findUnique({
      where: {
        userId_promptId: {
          userId: session.user.id,
          promptId: promptId,
        },
      },
    });

    if (existingResponse) {
      return NextResponse.json({ error: 'You have already submitted a response for this prompt' }, { status: 400 });
    }

    // Create response
    const response = await db.response.create({
      data: {
        caption,
        imageUrl,
        userId: session.user.id,
        promptId,
      },
    });

    return NextResponse.json({
      response: {
        id: response.id,
        caption: response.caption,
        imageUrl: response.imageUrl,
        submittedAt: response.submittedAt,
      },
    });
  } catch (error) {
    console.error('Create response error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
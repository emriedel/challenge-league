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

    // Get user's friendships
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const friends = friendships.map(friendship => {
      const isCurrentUserSender = friendship.senderId === session.user.id;
      const friend = isCurrentUserSender ? friendship.receiver : friendship.sender;
      
      return {
        id: friendship.id,
        status: friendship.status,
        friend: {
          id: friend.id,
          username: friend.username,
        },
        isSentByCurrentUser: isCurrentUserSender,
        createdAt: friendship.createdAt,
      };
    });

    return NextResponse.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Find user by username
    const targetUser = await db.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot add yourself as a friend' }, { status: 400 });
    }

    // Check if friendship already exists
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: session.user.id },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'Friendship already exists' }, { status: 400 });
    }

    // Create friendship request
    const friendship = await db.friendship.create({
      data: {
        senderId: session.user.id,
        receiverId: targetUser.id,
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      friendship: {
        id: friendship.id,
        status: friendship.status,
        friend: friendship.receiver,
        isSentByCurrentUser: true,
        createdAt: friendship.createdAt,
      },
    });
  } catch (error) {
    console.error('Add friend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
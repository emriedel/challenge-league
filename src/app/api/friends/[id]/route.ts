import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    
    if (!['ACCEPTED', 'DECLINED', 'BLOCKED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find the friendship
    const friendship = await db.friendship.findUnique({
      where: { id: params.id },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Only the receiver can accept/decline a pending request
    if (friendship.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'You can only respond to friend requests sent to you' }, { status: 403 });
    }

    // Update friendship status
    const updatedFriendship = await db.friendship.update({
      where: { id: params.id },
      data: { status },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
    });

    const friend = updatedFriendship.senderId === session.user.id 
      ? updatedFriendship.receiver 
      : updatedFriendship.sender;

    return NextResponse.json({
      friendship: {
        id: updatedFriendship.id,
        status: updatedFriendship.status,
        friend,
        isSentByCurrentUser: updatedFriendship.senderId === session.user.id,
        createdAt: updatedFriendship.createdAt,
      },
    });
  } catch (error) {
    console.error('Update friendship error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the friendship
    const friendship = await db.friendship.findUnique({
      where: { id: params.id },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Only participants can delete the friendship
    if (friendship.senderId !== session.user.id && friendship.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own friendships' }, { status: 403 });
    }

    // Delete friendship
    await db.friendship.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete friendship error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../lib/auth'
import { db } from '../../../../../../../lib/db'
import { broadcastToLeague } from '../../../../../../../lib/chatBroadcast'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leagueId = params.id
    const messageId = params.messageId

    // Verify user is a member of the league
    const membership = await db.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: session.user.id,
          leagueId: leagueId
        }
      }
    })

    if (!membership || !membership.isActive) {
      return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 })
    }

    // Get the league to check if user is owner (admin)
    const league = await db.league.findUnique({
      where: { id: leagueId },
      select: { ownerId: true }
    })

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Get the message
    const message = await db.chatMessage.findFirst({
      where: {
        id: messageId,
        leagueId: leagueId
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: 'Message already deleted' }, { status: 400 })
    }

    // Check permissions: user must be the author OR league owner
    const isAuthor = message.authorId === session.user.id
    const isLeagueOwner = league.ownerId === session.user.id

    if (!isAuthor && !isLeagueOwner) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      )
    }

    // Soft delete the message
    const deletedMessage = await db.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    })

    // Broadcast the deletion to all connected clients in this league
    broadcastToLeague(leagueId, {
      type: 'message_deleted',
      messageId: messageId,
      deletedBy: session.user.id
    })

    return NextResponse.json(
      { success: true, message: deletedMessage },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}

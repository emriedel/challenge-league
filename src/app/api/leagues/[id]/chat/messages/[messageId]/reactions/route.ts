import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../../lib/auth'
import { db } from '../../../../../../../../lib/db'
import { broadcastToLeague } from '../../../../../../../../lib/chatBroadcast'

// Valid emoji reactions
const VALID_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏']

export async function POST(
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
    const { emoji } = await request.json()

    // Validate emoji
    if (!emoji || !VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: 'Invalid emoji. Must be one of: ' + VALID_EMOJIS.join(', ') },
        { status: 400 }
      )
    }

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

    // Verify message exists and belongs to this league
    const message = await db.chatMessage.findFirst({
      where: {
        id: messageId,
        leagueId: leagueId,
        isDeleted: false // Can't react to deleted messages
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Create or update the reaction (upsert)
    const reaction = await db.messageReaction.upsert({
      where: {
        userId_messageId_emoji: {
          userId: session.user.id,
          messageId: messageId,
          emoji: emoji
        }
      },
      update: {
        // No fields to update, just touching the record
      },
      create: {
        userId: session.user.id,
        messageId: messageId,
        emoji: emoji
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        }
      }
    })

    // Broadcast the reaction to all connected clients in this league
    broadcastToLeague(leagueId, {
      type: 'reaction_added',
      messageId: messageId,
      reaction: {
        emoji: reaction.emoji,
        userId: reaction.user.id,
        username: reaction.user.username
      }
    })

    return NextResponse.json(reaction, { status: 201 })
  } catch (error) {
    console.error('Error adding reaction:', error)
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    )
  }
}

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
    const url = new URL(request.url)
    const emoji = url.searchParams.get('emoji')

    // Validate emoji
    if (!emoji || !VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: 'Invalid emoji. Must be one of: ' + VALID_EMOJIS.join(', ') },
        { status: 400 }
      )
    }

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

    // Delete the reaction
    const deleted = await db.messageReaction.deleteMany({
      where: {
        userId: session.user.id,
        messageId: messageId,
        emoji: emoji
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 })
    }

    // Broadcast the reaction removal to all connected clients in this league
    broadcastToLeague(leagueId, {
      type: 'reaction_removed',
      messageId: messageId,
      reaction: {
        emoji: emoji,
        userId: session.user.id
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error removing reaction:', error)
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    )
  }
}

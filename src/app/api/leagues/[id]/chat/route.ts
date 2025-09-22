import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { db } from '../../../../../lib/db'
import { broadcastToLeague } from '../../../../../lib/chatBroadcast'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leagueId = params.id

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

    // Get URL parameters for pagination
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const before = url.searchParams.get('before') // ISO string for cursor-based pagination

    // Build query
    const whereClause: any = { leagueId }
    if (before) {
      whereClause.createdAt = { lt: new Date(before) }
    }

    // Fetch messages with pagination
    const messages = await db.chatMessage.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Reverse to show oldest first
    const orderedMessages = messages.reverse()

    return NextResponse.json({
      messages: orderedMessages,
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leagueId = params.id
    const { content } = await request.json()

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
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

    // Create the message
    const message = await db.chatMessage.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        leagueId: leagueId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePhoto: true
          }
        }
      }
    })

    // Broadcast the new message to all connected clients in this league
    broadcastToLeague(leagueId, {
      type: 'new_message',
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        author: {
          id: message.author.id,
          username: message.author.username,
          profilePhoto: message.author.profilePhoto
        }
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating chat message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { db } from '../../../../../../lib/db'
import { addConnection, removeConnection } from '../../../../../../lib/chatBroadcast'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
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
    return new Response('Not a member of this league', { status: 403 })
  }

  const connectionKey = `${leagueId}:${session.user.id}`

  const stream = new ReadableStream({
    start(controller) {
      // Store the connection
      addConnection(connectionKey, controller)

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to chat'
      })}\n\n`)

      console.log(`SSE connection established for user ${session.user.username} in league ${leagueId}`)
    },
    cancel() {
      // Clean up when client disconnects
      removeConnection(connectionKey)
      console.log(`SSE connection closed for user ${session.user.username} in league ${leagueId}`)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}


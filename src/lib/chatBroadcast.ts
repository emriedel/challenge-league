// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>()

// Add a connection
export function addConnection(connectionKey: string, controller: ReadableStreamDefaultController) {
  connections.set(connectionKey, controller)
  console.log(`[ChatBroadcast] Connection added: ${connectionKey}. Total connections: ${connections.size}`)
}

// Remove a connection
export function removeConnection(connectionKey: string) {
  connections.delete(connectionKey)
  console.log(`[ChatBroadcast] Connection removed: ${connectionKey}. Total connections: ${connections.size}`)
}

// Broadcast message to all connections in a league
export function broadcastToLeague(leagueId: string, message: any) {
  const messageData = `data: ${JSON.stringify(message)}\n\n`

  // Use Array.from to handle the iterator properly
  const connectionEntries = Array.from(connections.entries())

  console.log(`[ChatBroadcast] Broadcasting to league ${leagueId}. Total connections: ${connections.size}`)

  let sentCount = 0
  for (const [connectionKey, controller] of connectionEntries) {
    if (connectionKey.startsWith(`${leagueId}:`)) {
      try {
        controller.enqueue(messageData)
        sentCount++
        console.log(`[ChatBroadcast] Message sent to: ${connectionKey}`)
      } catch (error) {
        // Connection is closed, remove it
        console.error(`[ChatBroadcast] Failed to send to ${connectionKey}:`, error)
        connections.delete(connectionKey)
      }
    }
  }

  console.log(`[ChatBroadcast] Broadcast complete. Sent to ${sentCount} connection(s)`)
}
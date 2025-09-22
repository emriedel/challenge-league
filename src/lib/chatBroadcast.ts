// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>()

// Add a connection
export function addConnection(connectionKey: string, controller: ReadableStreamDefaultController) {
  connections.set(connectionKey, controller)
}

// Remove a connection
export function removeConnection(connectionKey: string) {
  connections.delete(connectionKey)
}

// Broadcast message to all connections in a league
export function broadcastToLeague(leagueId: string, message: any) {
  const messageData = `data: ${JSON.stringify(message)}\n\n`

  // Use Array.from to handle the iterator properly
  const connectionEntries = Array.from(connections.entries())

  for (const [connectionKey, controller] of connectionEntries) {
    if (connectionKey.startsWith(`${leagueId}:`)) {
      try {
        controller.enqueue(messageData)
      } catch (error) {
        // Connection is closed, remove it
        connections.delete(connectionKey)
      }
    }
  }
}
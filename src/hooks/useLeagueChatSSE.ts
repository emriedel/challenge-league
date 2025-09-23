'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface Author {
  id: string
  username: string
  profilePhoto?: string | null
}

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  author: Author
}

interface UseChatReturn {
  messages: ChatMessage[]
  isConnected: boolean
  isLoading: boolean
  sendMessage: (content: string) => void
  loadMoreMessages: () => void
  hasMore: boolean
  error: string | null
}

// Global cache for messages to persist across component mounts
const messagesCache = new Map<string, ChatMessage[]>()
const hasMoreCache = new Map<string, boolean>()

export function useLeagueChatSSE(leagueId: string): UseChatReturn {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>(() => messagesCache.get(leagueId) || [])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(() => hasMoreCache.get(leagueId) ?? true)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  // Update ref and cache when messages change
  useEffect(() => {
    messagesRef.current = messages
    messagesCache.set(leagueId, messages)
  }, [messages, leagueId])

  // Cache hasMore state
  useEffect(() => {
    hasMoreCache.set(leagueId, hasMore)
  }, [hasMore, leagueId])

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    if (!session?.user?.id) return

    // Skip loading if we already have cached messages
    if (messagesCache.get(leagueId)?.length && messagesCache.get(leagueId)!.length > 0) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/leagues/${leagueId}/chat?limit=50`)
      if (!response.ok) {
        throw new Error('Failed to load messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
      setHasMore(data.hasMore || false)
    } catch (err) {
      console.error('Error loading messages:', err)
      // Silent failure - don't set error state
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, leagueId])

  // Initialize SSE connection with retry logic
  const connectSSE = useCallback(() => {
    if (!session?.user?.id) return

    console.log('Initializing SSE connection...')

    const eventSource = new EventSource(`/api/leagues/${leagueId}/chat/sse`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setIsConnected(true)
      retryCountRef.current = 0 // Reset retry count on successful connection
      // Load initial messages when connection is established
      loadInitialMessages()
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE message received:', data)

        if (data.type === 'new_message') {
          // Add message if not already present (deduplication)
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === data.message.id)
            if (messageExists) {
              console.log('Message already exists, skipping duplicate')
              return prev
            }
            return [...prev, data.message]
          })
        } else if (data.type === 'connected') {
          console.log('Connected to chat server')
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      setIsConnected(false)
      eventSource.close()

      // Implement exponential backoff retry
      retryCountRef.current += 1
      const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000) // Max 30s delay

      console.log(`Retrying SSE connection in ${retryDelay}ms (attempt ${retryCountRef.current})`)

      retryTimeoutRef.current = setTimeout(() => {
        connectSSE()
      }, retryDelay)
    }

    return () => {
      console.log('Closing SSE connection')
      eventSource.close()
      setIsConnected(false)
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [session?.user?.id, leagueId, loadInitialMessages])

  useEffect(() => {
    const cleanup = connectSSE()
    return cleanup
  }, [connectSSE])

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!session?.user?.id || isLoading || !hasMore) return

    setIsLoading(true)

    try {
      const oldestMessage = messagesRef.current[0]
      const beforeDate = oldestMessage ? oldestMessage.createdAt : undefined

      const url = new URL(`/api/leagues/${leagueId}/chat`, window.location.origin)
      url.searchParams.set('limit', '25')
      if (beforeDate) {
        url.searchParams.set('before', beforeDate)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to load more messages')
      }

      const data = await response.json()

      if (data.messages && data.messages.length > 0) {
        setMessages(prev => [...data.messages, ...prev])
        setHasMore(data.hasMore || false)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more messages:', err)
      // Silent failure - don't set error state
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, leagueId, isLoading, hasMore])

  // Send message with optimistic updates
  const sendMessage = useCallback(async (content: string) => {
    if (!session?.user?.id || !content.trim()) return

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      content: content.trim(),
      createdAt: new Date().toISOString(),
      author: {
        id: session.user.id,
        username: session.user.username,
        profilePhoto: session.user.profilePhoto
      }
    }

    // Optimistically add message to UI
    setMessages(prev => [...prev, optimisticMessage])

    try {
      console.log('Sending message:', content)

      const response = await fetch(`/api/leagues/${leagueId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to send message')
      }

      const realMessage = await response.json()
      console.log('Message sent successfully')

      // Replace optimistic message with real message from server
      setMessages(prev => prev.map(msg =>
        msg.id === optimisticMessage.id
          ? {
              id: realMessage.id,
              content: realMessage.content,
              createdAt: realMessage.createdAt,
              author: realMessage.author
            }
          : msg
      ))

    } catch (err) {
      console.error('Error sending message:', err)

      // Remove optimistic message on error - silent failure
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
    }
  }, [session?.user?.id, session?.user?.username, session?.user?.profilePhoto, leagueId])

  return {
    messages,
    isConnected,
    isLoading,
    sendMessage,
    loadMoreMessages,
    hasMore,
    error
  }
}
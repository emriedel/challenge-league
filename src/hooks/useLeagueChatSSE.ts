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

export function useLeagueChatSSE(leagueId: string): UseChatReturn {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])

  // Update ref when messages change
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Initialize SSE connection
  useEffect(() => {
    if (!session?.user?.id) return

    console.log('Initializing SSE connection...')

    const eventSource = new EventSource(`/api/leagues/${leagueId}/chat/sse`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setIsConnected(true)
      setError(null)
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
      setError('Connection to chat server lost')
    }

    return () => {
      console.log('Closing SSE connection')
      eventSource.close()
      setIsConnected(false)
    }
  }, [session?.user?.id, leagueId, loadInitialMessages])

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    setError(null)

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
      setError('Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, leagueId])

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!session?.user?.id || isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

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
      setError('Failed to load more messages')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, leagueId, isLoading, hasMore])

  // Send message with optimistic updates
  const sendMessage = useCallback(async (content: string) => {
    if (!session?.user?.id || !content.trim()) return

    // Clear any existing errors
    setError(null)

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))

      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
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
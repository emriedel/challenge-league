'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { ChatMessage, MessageReaction } from '@/types/chat'

interface UseChatReturn {
  messages: ChatMessage[]
  isConnected: boolean
  isLoading: boolean
  sendMessage: (content: string) => void
  loadMoreMessages: () => void
  hasMore: boolean
  error: string | null
  refreshMessages: () => Promise<void>
  toggleReaction: (messageId: string, emoji: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
}

// Global cache for messages to persist across component mounts
const messagesCache = new Map<string, ChatMessage[]>()
const hasMoreCache = new Map<string, boolean>()

export function useLeagueChatSSE(leagueId: string): UseChatReturn {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
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

  // Load initial messages - use ref to avoid dependency issues
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

    // Set a timeout to detect if connection hangs
    const connectionTimeout = setTimeout(() => {
      if (!eventSource || eventSource.readyState !== EventSource.OPEN) {
        console.warn('SSE connection timeout - closing and retrying')
        eventSource.close()
        setIsConnected(false)

        // Retry if under max attempts
        if (retryCountRef.current < 5) {
          retryCountRef.current += 1
          const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
          console.log(`Retrying SSE connection in ${retryDelay}ms (attempt ${retryCountRef.current})`)
          retryTimeoutRef.current = setTimeout(() => {
            connectSSE()
          }, retryDelay)
        } else {
          setError('Connection failed. Please refresh the page.')
        }
      }
    }, 10000) // 10 second timeout

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      clearTimeout(connectionTimeout)
      setIsConnected(true)
      setError(null)
      retryCountRef.current = 0 // Reset retry count on successful connection
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE message received:', data)

        if (data.type === 'new_message') {
          // Add message if not already present (enhanced deduplication)
          setMessages(prev => {
            // Check for exact ID match first
            const exactMatch = prev.some(msg => msg.id === data.message.id)
            if (exactMatch) {
              console.log('Message already exists (ID match), skipping duplicate')
              return prev
            }

            // Check for content/author/time match to catch race conditions
            const contentMatch = prev.some(msg =>
              msg.content === data.message.content &&
              msg.author.id === data.message.author.id &&
              Math.abs(new Date(msg.createdAt).getTime() - new Date(data.message.createdAt).getTime()) < 5000
            )
            if (contentMatch) {
              console.log('Message already exists (content match), skipping duplicate')
              return prev
            }

            // Invalidate notification query to update badge
            queryClient.invalidateQueries({
              queryKey: queryKeys.userActivity(leagueId)
            })

            return [...prev, data.message]
          })
        } else if (data.type === 'reaction_added') {
          // Handle reaction added event
          setMessages(prev => prev.map(msg => {
            if (msg.id === data.messageId) {
              // Check if reaction already exists
              const existingReaction = msg.reactions.find(
                r => r.emoji === data.reaction.emoji && r.user.id === data.reaction.userId
              )
              if (existingReaction) return msg

              // Add new reaction
              return {
                ...msg,
                reactions: [
                  ...msg.reactions,
                  {
                    emoji: data.reaction.emoji,
                    user: {
                      id: data.reaction.userId,
                      username: data.reaction.username,
                      profilePhoto: null
                    }
                  }
                ]
              }
            }
            return msg
          }))
        } else if (data.type === 'reaction_removed') {
          // Handle reaction removed event
          setMessages(prev => prev.map(msg => {
            if (msg.id === data.messageId) {
              return {
                ...msg,
                reactions: msg.reactions.filter(
                  r => !(r.emoji === data.reaction.emoji && r.user.id === data.reaction.userId)
                )
              }
            }
            return msg
          }))
        } else if (data.type === 'message_deleted') {
          // Handle message deleted event
          setMessages(prev => prev.map(msg => {
            if (msg.id === data.messageId) {
              return {
                ...msg,
                isDeleted: true,
                deletedAt: new Date().toISOString()
              }
            }
            return msg
          }))
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

      // Don't retry excessively - max 5 attempts
      if (retryCountRef.current >= 5) {
        console.error('Max SSE retry attempts reached. Please refresh the page.')
        setError('Connection lost. Please refresh the page.')
        return
      }

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
  }, [leagueId, session?.user?.id, loadInitialMessages])

  useEffect(() => {
    const cleanup = connectSSE()
    return cleanup
  }, [connectSSE])

  // Load initial messages when connection is established
  useEffect(() => {
    if (isConnected && session?.user?.id) {
      loadInitialMessages()
    }
  }, [isConnected, session?.user?.id, loadInitialMessages])

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
      isDeleted: false,
      author: {
        id: session.user.id,
        username: session.user.username,
        profilePhoto: session.user.profilePhoto
      },
      reactions: []
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
          ? realMessage
          : msg
      ))

    } catch (err) {
      console.error('Error sending message:', err)

      // Remove optimistic message on error - silent failure
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
    }
  }, [session?.user?.id, session?.user?.username, session?.user?.profilePhoto, leagueId])

  // Toggle reaction (add or remove)
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!session?.user?.id) return

    // Check if user already reacted with this emoji
    const message = messagesRef.current.find(m => m.id === messageId)
    if (!message) return

    const existingReaction = message.reactions.find(
      r => r.emoji === emoji && r.user.id === session.user.id
    )

    if (existingReaction) {
      // Remove reaction
      // Optimistically update UI
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: msg.reactions.filter(
              r => !(r.emoji === emoji && r.user.id === session.user.id)
            )
          }
        }
        return msg
      }))

      try {
        const response = await fetch(
          `/api/leagues/${leagueId}/chat/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          throw new Error('Failed to remove reaction')
        }
      } catch (err) {
        console.error('Error removing reaction:', err)
        // Revert optimistic update
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: [...msg.reactions, {
                emoji,
                user: {
                  id: session.user.id,
                  username: session.user.username,
                  profilePhoto: session.user.profilePhoto
                }
              }]
            }
          }
          return msg
        }))
      }
    } else {
      // Add reaction
      // Optimistically update UI
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: [...msg.reactions, {
              emoji,
              user: {
                id: session.user.id,
                username: session.user.username,
                profilePhoto: session.user.profilePhoto
              }
            }]
          }
        }
        return msg
      }))

      try {
        const response = await fetch(
          `/api/leagues/${leagueId}/chat/messages/${messageId}/reactions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emoji })
          }
        )

        if (!response.ok) {
          throw new Error('Failed to add reaction')
        }
      } catch (err) {
        console.error('Error adding reaction:', err)
        // Revert optimistic update
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: msg.reactions.filter(
                r => !(r.emoji === emoji && r.user.id === session.user.id)
              )
            }
          }
          return msg
        }))
      }
    }
  }, [session?.user?.id, session?.user?.username, session?.user?.profilePhoto, leagueId])

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!session?.user?.id) return

    // Optimistically mark as deleted
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          isDeleted: true,
          deletedAt: new Date().toISOString()
        }
      }
      return msg
    }))

    try {
      const response = await fetch(
        `/api/leagues/${leagueId}/chat/messages/${messageId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete message')
      }
    } catch (err) {
      console.error('Error deleting message:', err)
      // Revert optimistic update
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            isDeleted: false,
            deletedAt: undefined
          }
        }
        return msg
      }))
    }
  }, [session?.user?.id, leagueId])

  // Refresh messages function for pull-to-refresh
  const refreshMessages = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/leagues/${leagueId}/chat?limit=50`)
      if (!response.ok) {
        throw new Error('Failed to refresh messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
      setHasMore(data.hasMore || false)

      // Clear any error state
      setError(null)
    } catch (err) {
      console.error('Error refreshing messages:', err)
      // Silent failure for pull-to-refresh - don't set error state
    }
  }, [session?.user?.id, leagueId])

  // Handle app resume from background (iOS PWA fix)
  useEffect(() => {
    if (!session?.user?.id) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App resumed from background, refreshing messages and reconnecting SSE...')

        // Force refresh messages when app comes back to foreground
        refreshMessages()

        // Reconnect SSE if disconnected
        if (!isConnected && eventSourceRef.current) {
          console.log('Reconnecting SSE after app resume...')
          eventSourceRef.current.close()
          connectSSE()
        }

        // Also invalidate notification query to update badge
        queryClient.invalidateQueries({
          queryKey: queryKeys.userActivity(leagueId)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session?.user?.id, leagueId, refreshMessages, queryClient, isConnected, connectSSE])

  return {
    messages,
    isConnected,
    isLoading,
    sendMessage,
    loadMoreMessages,
    hasMore,
    error,
    refreshMessages,
    toggleReaction,
    deleteMessage
  }
}
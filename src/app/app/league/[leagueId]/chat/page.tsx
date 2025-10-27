'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLeagueChatSSE } from '../../../../../hooks/useLeagueChatSSE'
import { useChatInitialQuery } from '../../../../../hooks/queries/useChatQuery'
import { useLeagueQuery } from '../../../../../hooks/queries'
import { MessageBubble } from '../../../../../components/chat/MessageBubble'
import { MessageInput } from '../../../../../components/chat/MessageInput'
import LeagueNavigation from '../../../../../components/LeagueNavigation'
import { useLocalActivityTracking } from '../../../../../hooks/useLocalActivityTracking'
import { useNavigationRefreshHandlers } from '../../../../../lib/navigationRefresh'

interface ChatPageProps {
  params: {
    leagueId: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isInitialScrollComplete, setIsInitialScrollComplete] = useState(false)
  const prevMessageCountRef = useRef(0)

  // Try to use prefetched data for faster initial load
  const { data: prefetchedData } = useChatInitialQuery(params.leagueId)
  const { data: leagueData } = useLeagueQuery(params.leagueId)

  const {
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
  } = useLeagueChatSSE(params.leagueId)

  const { markChatAsRead, getActivityTimestamps } = useLocalActivityTracking()

  // Get the last read message timestamp - capture it ONCE on mount and don't update it
  // This ensures the "new messages" line stays visible even after we mark messages as read
  const [lastReadTimestamp] = useState(() => {
    const activityTimestamps = getActivityTimestamps(params.leagueId)
    return activityTimestamps.lastReadChatMessage
      ? new Date(activityTimestamps.lastReadChatMessage).getTime()
      : null
  })


  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/app/auth/signin')
    }
  }, [status, router])

  // Mark chat as read after a short delay while viewing messages
  // This ensures the timestamp updates even if user closes app without navigating away
  useEffect(() => {
    if (!session?.user?.id || messages.length === 0) return

    // Debounce the read marking - wait 2 seconds of viewing before marking as read
    // Only trigger on messages.length change to avoid excessive re-renders
    const timer = setTimeout(() => {
      markChatAsRead(params.leagueId)
    }, 2000)

    return () => clearTimeout(timer)
  // Only depend on message count, not the entire messages array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, messages.length, params.leagueId])

  // Auto-scroll to bottom on new messages and initial load
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      const currentMessageCount = messages.length
      const hasNewMessages = currentMessageCount > prevMessageCountRef.current

      if (isInitialLoad) {
        // Immediate scroll to bottom without animation to avoid visible scroll
        messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        setIsInitialLoad(false);
        setIsInitialScrollComplete(true);
        prevMessageCountRef.current = currentMessageCount
      } else if (hasNewMessages) {
        // Only smooth scroll when new messages are added (not for reactions/edits)
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        prevMessageCountRef.current = currentMessageCount
      }
      // If no new messages, do nothing - don't interfere with manual scrolling
    }
  }, [messages.length, isInitialLoad]) // Only depend on message count, not entire messages array

  // Handle case where messages are empty initially
  useEffect(() => {
    if (messages.length === 0 && !isLoading && !isInitialLoad) {
      setIsInitialScrollComplete(true);
    }
  }, [messages.length, isLoading, isInitialLoad])

  // Register navigation handlers for bottom nav tap behavior
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [])

  const refreshChat = useCallback(() => {
    refreshMessages();
  }, [refreshMessages])

  useNavigationRefreshHandlers('chat', scrollToBottom, refreshChat)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app-bg">
        <div className="text-app-text-secondary">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <>
      {/* Desktop Navigation - hidden on mobile for full-screen chat */}
      <div className="hidden md:block">
        <LeagueNavigation
          leagueId={params.leagueId}
          leagueName={leagueData?.league?.name || 'League'}
          isOwner={leagueData?.league?.isOwner}
        />
      </div>

      {/* Messages Container - scrollable area */}
      <div className={`pb-20 md:pb-4 transition-opacity duration-200 ${isInitialScrollComplete ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMoreMessages}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-app-surface text-app-text border border-app-border rounded-lg hover:bg-app-surface-light transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load older messages'}
              </button>
            </div>
          )}


          {/* Messages */}
          {messages.length === 0 && !isLoading && !isInitialLoad && (
            <div className="text-center text-app-text-muted py-8">
              <p>No messages yet. Be the first to start the conversation!</p>
            </div>
          )}

          {messages.map((message, index) => {
            const isOwnMessage = message.author.id === session.user.id
            const previousMessage = index > 0 ? messages[index - 1] : null
            const showAvatar = !previousMessage || previousMessage.author.id !== message.author.id

            // Check if we need a date separator
            const currentDate = new Date(message.createdAt).toDateString()
            const previousDate = previousMessage ? new Date(previousMessage.createdAt).toDateString() : null
            const showDateSeparator = currentDate !== previousDate

            // Check if we need an unread separator (only for other people's messages)
            const messageTimestamp = new Date(message.createdAt).getTime()
            const previousMessageTimestamp = previousMessage ? new Date(previousMessage.createdAt).getTime() : null
            const showUnreadSeparator = !isOwnMessage &&
              lastReadTimestamp &&
              messageTimestamp > lastReadTimestamp &&
              (!previousMessageTimestamp || previousMessageTimestamp <= lastReadTimestamp)

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-2">
                    <div className="bg-app-surface-dark px-3 py-1 rounded-full">
                      <span className="text-xs text-app-text-muted font-medium">
                        {new Date(message.createdAt).toLocaleDateString([], {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                )}
                {showUnreadSeparator && (
                  <div className="flex items-center gap-3 my-4 px-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-blue-500/30" />
                    <span className="text-xs text-blue-400/70 font-medium whitespace-nowrap">New Messages</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-blue-500/30 via-blue-500/30 to-transparent" />
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showAvatar={showAvatar}
                  currentUserId={session.user.id}
                  isLeagueOwner={leagueData?.league?.isOwner || false}
                  onReactionToggle={toggleReaction}
                  onDeleteMessage={deleteMessage}
                />
              </div>
            )
          })}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - fixed position on mobile, regular on desktop */}
      <div className="fixed bottom-20 left-0 right-0 md:relative md:bottom-auto bg-app-bg z-10">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 pt-2 pb-4">
          <MessageInput
            onSendMessage={sendMessage}
            disabled={!isConnected}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            error={error}
          />
        </div>
      </div>
    </>
  )
}
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLeagueChatSSE } from '../../../../../hooks/useLeagueChatSSE'
import { MessageBubble } from '../../../../../components/chat/MessageBubble'
import { MessageInput } from '../../../../../components/chat/MessageInput'
import ProfileAvatar from '../../../../../components/ProfileAvatar'
import { useActivityTracking } from '../../../../../hooks/useActivityTracking'
import DocumentPullToRefresh from '../../../../../components/DocumentPullToRefresh'

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

  const {
    messages,
    isConnected,
    isLoading,
    sendMessage,
    loadMoreMessages,
    hasMore,
    error,
    refreshMessages
  } = useLeagueChatSSE(params.leagueId)

  const { markChatAsRead } = useActivityTracking()

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refreshMessages()
  }, [refreshMessages])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/app/auth/signin')
    }
  }, [status, router])

  // Mark chat as read when user visits this page and when new messages arrive
  useEffect(() => {
    if (session?.user?.id && messages.length > 0) {
      markChatAsRead(params.leagueId)
    }
  }, [session?.user?.id, messages.length, markChatAsRead, params.leagueId])

  // Auto-scroll to bottom on new messages and initial load
  useEffect(() => {
    if (messagesEndRef.current) {
      if (isInitialLoad) {
        // Immediate scroll to bottom on initial load
        messagesEndRef.current.scrollIntoView({ behavior: 'instant' })
        setIsInitialLoad(false)
      } else {
        // Smooth scroll for new messages
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages, isInitialLoad])

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
    <DocumentPullToRefresh onRefresh={handleRefresh}>
      {/* Messages Container - scrollable area */}
      <div className="pb-24 md:pb-4">
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

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
              />
            )
          })}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - fixed position on mobile, regular on desktop */}
      <div className="fixed bottom-20 left-0 right-0 md:relative md:bottom-auto bg-app-bg z-10">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
          <MessageInput
            onSendMessage={sendMessage}
            disabled={!isConnected}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            error={error}
          />
        </div>
      </div>
    </DocumentPullToRefresh>
  )
}
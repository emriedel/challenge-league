'use client'

import { useState, useRef, useEffect } from 'react'
import ProfileAvatar from '../ProfileAvatar'
import { MessageReactions } from './MessageReactions'
import { MessageActionsMenu } from './MessageActionsMenu'
import { MessageReaction } from '../../types/chat'

interface Author {
  id: string
  username: string
  profilePhoto?: string | null
}

interface Message {
  id: string
  content: string
  createdAt: string
  isDeleted: boolean
  deletedAt?: string | null
  author: Author
  reactions: MessageReaction[]
}

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  showAvatar: boolean
  currentUserId: string
  isLeagueOwner: boolean
  onReactionToggle: (messageId: string, emoji: string) => void
  onDeleteMessage: (messageId: string) => void
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  currentUserId,
  isLeagueOwner,
  onReactionToggle,
  onDeleteMessage
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)
  const messageBubbleRef = useRef<HTMLDivElement>(null) // Ref for just the message bubble
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef(false)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Determine if user can delete this message
  const canDelete = isOwnMessage || isLeagueOwner

  // Long press handlers for mobile
  const handleTouchStart = () => {
    if (message.isDeleted) return

    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      openMenuRelativeToMessage()
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchMove = () => {
    // Cancel long press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // Add non-passive touch listeners to properly prevent default behaviors
  useEffect(() => {
    const messageElement = messageRef.current
    if (!messageElement) return

    let touchStartTime = 0

    const touchStartHandler = (e: TouchEvent) => {
      if (message.isDeleted) return
      touchStartTime = Date.now()

      // Always prevent default to stop browser context menu
      if (e.cancelable) {
        e.preventDefault()
      }
    }

    const touchEndHandler = (e: TouchEvent) => {
      const touchDuration = Date.now() - touchStartTime

      // Always prevent default to stop browser context menu
      if (e.cancelable) {
        e.preventDefault()
      }
    }

    // Add with { passive: false } to allow preventDefault when needed
    messageElement.addEventListener('touchstart', touchStartHandler, { passive: false })
    messageElement.addEventListener('touchend', touchEndHandler, { passive: false })

    return () => {
      messageElement.removeEventListener('touchstart', touchStartHandler)
      messageElement.removeEventListener('touchend', touchEndHandler)
    }
  }, [message.isDeleted])

  // Right-click handler for desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    if (message.isDeleted) return

    e.preventDefault()
    openMenuRelativeToMessage()
  }

  // Three-dot button handler for desktop
  const handleMenuButtonClick = (e: React.MouseEvent) => {
    if (message.isDeleted) return

    e.stopPropagation()
    openMenuRelativeToMessage()
  }

  const openMenuRelativeToMessage = () => {
    if (!messageBubbleRef.current) return

    // Haptic feedback when opening menu (mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate(10) // Light tap feedback
    }

    // Use the bubble rect (just the message text, not reactions/timestamp)
    const bubbleRect = messageBubbleRef.current.getBoundingClientRect()
    const menuWidth = 240 // Match min-w-[240px] from MessageActionsMenu
    const menuHeight = 150 // Approximate height (emoji grid is smaller now)

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x: number
    let y: number

    if (isOwnMessage) {
      // For own messages (right-aligned), position menu to the right edge
      x = bubbleRect.right - menuWidth
      // If that would go off left edge, position at left edge with padding
      if (x < 10) {
        x = 10
      }
    } else {
      // For other messages (left-aligned), position menu aligned with left edge
      x = bubbleRect.left
      // If that would go off right edge, position at right edge with padding
      if (x + menuWidth > viewportWidth - 10) {
        x = viewportWidth - menuWidth - 10
      }
    }

    // Position menu directly below the message bubble (not reactions/timestamp)
    y = bubbleRect.bottom + 2

    // If menu would go off bottom of screen, position above instead
    if (y + menuHeight > viewportHeight - 10) {
      y = bubbleRect.top - menuHeight - 2
      // If still off screen (message at very top), just position at top with padding
      if (y < 10) {
        y = 10
      }
    }

    setMenuPosition({ x, y })
    setShowMenu(true)
  }

  const handleReactionSelect = (emoji: string) => {
    onReactionToggle(message.id, emoji)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDeleteMessage(message.id)
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  // Render deleted message placeholder
  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'items-start space-x-3'}`}>
        {!isOwnMessage && (
          <div className="w-8 h-8 flex-shrink-0">
            {showAvatar ? (
              <ProfileAvatar
                username={message.author.username}
                profilePhoto={message.author.profilePhoto}
                size="sm"
              />
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        )}
        <div className="max-w-[70%] space-y-1">
          {!isOwnMessage && showAvatar && (
            <div className="text-xs text-app-text-secondary font-medium px-1">
              {message.author.username}
            </div>
          )}
          <div className="bg-app-surface-dark border border-app-border-dark rounded-2xl px-4 py-2 opacity-60">
            <p className="text-sm text-app-text-muted italic">Message deleted</p>
          </div>
          <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-app-text-muted px-1">
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (isOwnMessage) {
    // Own messages aligned to the right
    return (
      <>
        <div
          ref={messageRef}
          className="flex justify-end group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          data-message-container
          data-message-id={message.id}
        >
          {/* Desktop three-dot menu button */}
          <button
            onClick={handleMenuButtonClick}
            className={`
              hidden md:flex items-center justify-center w-6 h-6 rounded-full
              hover:bg-app-surface-light transition-opacity mr-2 self-center flex-shrink-0
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
            aria-label="Message actions"
          >
            <svg className="w-4 h-4 text-app-text-secondary" fill="currentColor" viewBox="0 0 16 16">
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="13" cy="8" r="1.5" />
            </svg>
          </button>

          <div
            className="max-w-[70%] space-y-1 select-none"
            style={{
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              touchAction: 'manipulation' // Better for preventing long-press menu
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onContextMenu={handleContextMenu}
          >
            <div
              ref={messageBubbleRef}
              className="bg-blue-700 text-white rounded-2xl rounded-tr-md px-4 py-2"
            >
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
            </div>

            {/* Reactions */}
            <MessageReactions
              reactions={message.reactions}
              currentUserId={currentUserId}
              onReactionClick={handleReactionSelect}
            />

            <div className="flex justify-end">
              <span className="text-xs text-app-text-muted">
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions menu */}
        {showMenu && (
          <MessageActionsMenu
            onReactionSelect={handleReactionSelect}
            onDelete={canDelete ? handleDelete : undefined}
            onClose={() => setShowMenu(false)}
            position={menuPosition}
            showDelete={canDelete}
            selectedEmojis={message.reactions
              .filter(r => r.user.id === currentUserId)
              .map(r => r.emoji)
            }
            selectedMessageId={message.id}
          />
        )}
      </>
    )
  }

  // Other users' messages aligned to the left with avatar
  return (
    <>
      <div
        ref={messageRef}
        className="flex items-start space-x-3 select-none group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-message-container
        data-message-id={message.id}
      >
        {/* Avatar (only show for first message in sequence) */}
        <div className="w-8 h-8 flex-shrink-0">
          {showAvatar ? (
            <ProfileAvatar
              username={message.author.username}
              profilePhoto={message.author.profilePhoto}
              size="sm"
            />
          ) : (
            <div className="w-8 h-8" /> // Spacer to maintain alignment
          )}
        </div>

        {/* Message content */}
        <div
          className="max-w-[70%] space-y-1 select-none"
          style={{
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            touchAction: 'manipulation' // Better for preventing long-press menu
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onContextMenu={handleContextMenu}
        >
          {/* Username (only show for first message in sequence) */}
          {showAvatar && (
            <div className="text-xs text-app-text-secondary font-medium px-1">
              {message.author.username}
            </div>
          )}

          {/* Message bubble */}
          <div
            ref={messageBubbleRef}
            className="bg-app-surface border border-app-border rounded-2xl rounded-tl-md px-4 py-2"
          >
            <p className="text-sm text-app-text leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
          </div>

          {/* Reactions */}
          <MessageReactions
            reactions={message.reactions}
            currentUserId={currentUserId}
            onReactionClick={handleReactionSelect}
          />

          {/* Timestamp */}
          <div className="flex justify-start">
            <span className="text-xs text-app-text-muted px-1">
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>

        {/* Desktop three-dot menu button */}
        <button
          onClick={handleMenuButtonClick}
          className={`
            hidden md:flex items-center justify-center w-6 h-6 rounded-full
            hover:bg-app-surface-light transition-opacity ml-2 self-center flex-shrink-0
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          aria-label="Message actions"
        >
          <svg className="w-4 h-4 text-app-text-secondary" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Actions menu */}
      {showMenu && (
        <MessageActionsMenu
          onReactionSelect={handleReactionSelect}
          onDelete={canDelete ? handleDelete : undefined}
          onClose={() => setShowMenu(false)}
          position={menuPosition}
          showDelete={canDelete}
          selectedEmojis={message.reactions
            .filter(r => r.user.id === currentUserId)
            .map(r => r.emoji)
          }
          selectedMessageId={message.id}
        />
      )}
    </>
  )
}
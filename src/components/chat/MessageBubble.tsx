'use client'

import ProfileAvatar from '../ProfileAvatar'

interface Author {
  id: string
  username: string
  profilePhoto?: string | null
}

interface Message {
  id: string
  content: string
  createdAt: string
  author: Author
}

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  showAvatar: boolean
}

export function MessageBubble({ message, isOwnMessage, showAvatar }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isOwnMessage) {
    // Own messages aligned to the right
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] space-y-1">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-2">
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
          </div>
          <div className="flex justify-end">
            <span className="text-xs text-app-text-muted">
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Other users' messages aligned to the left with avatar
  return (
    <div className="flex items-end space-x-3">
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
      <div className="max-w-[70%] space-y-1">
        {/* Username (only show for first message in sequence) */}
        {showAvatar && (
          <div className="text-xs text-app-text-secondary font-medium px-1">
            {message.author.username}
          </div>
        )}

        {/* Message bubble */}
        <div className="bg-app-surface border border-app-border rounded-2xl rounded-tl-md px-4 py-2">
          <p className="text-sm text-app-text leading-relaxed break-words">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <div className="flex justify-start">
          <span className="text-xs text-app-text-muted px-1">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
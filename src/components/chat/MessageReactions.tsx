'use client'

import { MessageReaction } from '../../types/chat'

interface MessageReactionsProps {
  reactions: MessageReaction[]
  currentUserId: string
  onReactionClick: (emoji: string) => void
}

// Group reactions by emoji and count them
interface ReactionGroup {
  emoji: string
  count: number
  users: Array<{ id: string; username: string }>
  hasCurrentUser: boolean
}

export function MessageReactions({ reactions, currentUserId, onReactionClick }: MessageReactionsProps) {
  if (reactions.length === 0) {
    return null
  }

  // Group reactions by emoji
  const reactionGroups: ReactionGroup[] = []
  const emojiMap = new Map<string, ReactionGroup>()

  reactions.forEach(reaction => {
    const existing = emojiMap.get(reaction.emoji)
    const isCurrentUser = reaction.user.id === currentUserId

    if (existing) {
      existing.count++
      existing.users.push({ id: reaction.user.id, username: reaction.user.username })
      if (isCurrentUser) {
        existing.hasCurrentUser = true
      }
    } else {
      const group: ReactionGroup = {
        emoji: reaction.emoji,
        count: 1,
        users: [{ id: reaction.user.id, username: reaction.user.username }],
        hasCurrentUser: isCurrentUser
      }
      emojiMap.set(reaction.emoji, group)
      reactionGroups.push(group)
    }
  })

  // Format tooltip text
  const formatTooltip = (group: ReactionGroup): string => {
    if (group.count <= 3) {
      return group.users.map(u => u.username).join(', ')
    }
    const displayUsers = group.users.slice(0, 3).map(u => u.username).join(', ')
    const remaining = group.count - 3
    return `${displayUsers} +${remaining} more`
  }

  return (
    <div className="flex flex-wrap gap-1 justify-end -mt-1">
      {reactionGroups.map(group => (
        <button
          key={group.emoji}
          onClick={() => onReactionClick(group.emoji)}
          className={`
            flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
            transition-all duration-150
            ${group.hasCurrentUser
              ? 'bg-blue-700/30 border border-blue-600 hover:bg-blue-700/40'
              : 'bg-app-surface border border-app-border hover:bg-app-surface-light'
            }
          `}
          title={formatTooltip(group)}
          aria-label={`${group.emoji} reaction by ${formatTooltip(group)}`}
        >
          <span className="text-sm leading-none">{group.emoji}</span>
          {group.count > 1 && (
            <span className={`text-xs leading-none ${group.hasCurrentUser ? 'text-blue-300' : 'text-app-text-secondary'}`}>
              {group.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

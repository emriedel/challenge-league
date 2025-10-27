// Chat message types

export interface MessageReactionUser {
  id: string
  username: string
  profilePhoto?: string | null
}

export interface MessageReaction {
  emoji: string
  user: MessageReactionUser
}

export interface ChatMessageAuthor {
  id: string
  username: string
  profilePhoto?: string | null
}

export interface ChatMessage {
  id: string
  content: string
  createdAt: string
  isDeleted: boolean
  deletedAt?: string | null
  author: ChatMessageAuthor
  reactions: MessageReaction[]
}

// SSE event types for real-time updates
export interface ChatSSENewMessageEvent {
  type: 'new_message'
  message: ChatMessage
}

export interface ChatSSEReactionAddedEvent {
  type: 'reaction_added'
  messageId: string
  reaction: {
    emoji: string
    userId: string
    username: string
  }
}

export interface ChatSSEReactionRemovedEvent {
  type: 'reaction_removed'
  messageId: string
  reaction: {
    emoji: string
    userId: string
  }
}

export interface ChatSSEMessageDeletedEvent {
  type: 'message_deleted'
  messageId: string
  deletedBy: string
}

export type ChatSSEEvent =
  | ChatSSENewMessageEvent
  | ChatSSEReactionAddedEvent
  | ChatSSEReactionRemovedEvent
  | ChatSSEMessageDeletedEvent

// Constants
export const VALID_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'] as const
export type ValidEmoji = typeof VALID_EMOJIS[number]

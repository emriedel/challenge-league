'use client'

import { useEffect, useRef } from 'react'
import { VALID_EMOJIS } from '../../types/chat'

interface MessageActionsMenuProps {
  onReactionSelect: (emoji: string) => void
  onDelete?: () => void
  onClose: () => void
  position: { x: number; y: number }
  showDelete: boolean
  selectedEmojis: string[] // Array of emojis the current user has already reacted with
  selectedMessageId: string // ID of the message this menu is for
}

export function MessageActionsMenu({
  onReactionSelect,
  onDelete,
  onClose,
  position,
  showDelete,
  selectedEmojis,
  selectedMessageId
}: MessageActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Apply backdrop blur to everything except selected message
  useEffect(() => {
    // Find all message containers and apply blur except the selected one
    const allMessages = document.querySelectorAll('[data-message-container]')
    allMessages.forEach(msg => {
      const messageElement = msg as HTMLElement
      if (messageElement.dataset.messageId !== selectedMessageId) {
        messageElement.style.filter = 'blur(1px)'
        messageElement.style.opacity = '0.6'
      }
    })

    return () => {
      // Remove blur from all messages on cleanup
      allMessages.forEach(msg => {
        const messageElement = msg as HTMLElement
        messageElement.style.filter = ''
        messageElement.style.opacity = ''
      })
    }
  }, [selectedMessageId])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Close on escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position if menu would overflow viewport
  const adjustedPosition = { ...position }
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Adjust horizontal position
    if (adjustedPosition.x + rect.width > viewportWidth) {
      adjustedPosition.x = viewportWidth - rect.width - 10
    }
    if (adjustedPosition.x < 10) {
      adjustedPosition.x = 10
    }

    // Adjust vertical position
    if (adjustedPosition.y + rect.height > viewportHeight) {
      adjustedPosition.y = viewportHeight - rect.height - 10
    }
    if (adjustedPosition.y < 10) {
      adjustedPosition.y = 10
    }
  }

  const handleReactionClick = (emoji: string) => {
    onReactionSelect(emoji)
    onClose()
  }

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete()
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop with subtle fade (no blur - handled per-message) */}
      <div
        className="fixed inset-0 bg-black/20 transition-opacity duration-150"
        style={{
          zIndex: 9998,
          animation: 'fadeIn 150ms ease-out'
        }}
        onClick={onClose}
      />

      {/* Menu with animation */}
      <div
        ref={menuRef}
        className="fixed bg-app-surface border border-app-border rounded-lg shadow-2xl p-2 min-w-[240px]"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          zIndex: 9999, // Ensure it's above bottom nav (which is typically z-50)
          animation: 'scaleIn 150ms ease-out'
        }}
      >
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
        {/* Emoji reactions */}
        <div className={showDelete ? 'mb-2' : ''}>
          <div className="grid grid-cols-4 gap-1">
            {VALID_EMOJIS.map(emoji => {
              const isSelected = selectedEmojis.includes(emoji)
              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={`
                    flex items-center justify-center p-2 rounded-lg transition-colors text-xl
                    ${isSelected
                      ? 'bg-blue-700/30 border border-blue-600 hover:bg-blue-700/40'
                      : 'hover:bg-app-surface-light'
                    }
                  `}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        </div>

        {/* Delete option */}
        {showDelete && (
          <>
            <div className="h-px bg-app-border my-2" />
            <button
              onClick={handleDeleteClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete message
            </button>
          </>
        )}
      </div>
    </>
  )
}

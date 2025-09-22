'use client'

import { useState, KeyboardEvent } from 'react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
  error?: string | null
}

// Send icon SVG
const SendIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

export function MessageInput({ onSendMessage, disabled = false, placeholder = "Type a message...", error }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage)
      setMessage('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-2">
      {/* Error message */}
      {error && (
        <div className="text-sm text-app-error bg-app-error-bg border border-red-500 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Input container */}
      <div className="flex items-center space-x-3 bg-app-surface border border-app-border rounded-lg p-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-app-text placeholder-app-text-muted focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed max-h-32"
          style={{
            height: 'auto',
            minHeight: '24px'
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 128) + 'px'
          }}
        />

        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="flex-shrink-0 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors"
          aria-label="Send message"
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
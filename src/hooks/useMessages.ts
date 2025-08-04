'use client';

import { useState, useCallback, useEffect } from 'react';
import { UI_TIMEOUTS } from '@/constants/app';

export interface Message {
  type: 'success' | 'error';
  text: string;
}

interface UseMessagesProps {
  autoCleanMs?: number;
}

export function useMessages({ autoCleanMs = UI_TIMEOUTS.MESSAGE_AUTO_CLEAR_MS }: UseMessagesProps = {}) {
  const [messages, setMessages] = useState<{ [key: string]: Message }>({});

  const addMessage = useCallback((key: string, message: Message) => {
    setMessages(prev => ({ ...prev, [key]: message }));
  }, []);

  const clearMessage = useCallback((key: string) => {
    setMessages(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllMessages = useCallback(() => {
    setMessages({});
  }, []);

  // Auto-clear success messages
  useEffect(() => {
    const timers: { [key: string]: NodeJS.Timeout } = {};

    Object.entries(messages).forEach(([key, message]) => {
      if (message.type === 'success') {
        timers[key] = setTimeout(() => {
          clearMessage(key);
        }, autoCleanMs);
      }
    });

    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [messages, autoCleanMs, clearMessage]);

  return {
    messages,
    addMessage,
    clearMessage,
    clearAllMessages,
    // Convenience methods for common message keys
    setSubmissionMessage: (message: Message) => addMessage('submission', message),
    setVotingMessage: (message: Message) => addMessage('voting', message),
    submissionMessage: messages.submission,
    votingMessage: messages.voting,
  };
}
'use client';

import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Debug panel for testing push notifications in production
 * Only shows in development or when explicitly enabled
 */
export default function NotificationDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe
  } = usePushNotifications();

  // Only show in development or if explicitly enabled with query param
  if (typeof window !== 'undefined') {
    const isDev = process.env.NODE_ENV === 'development';
    const isDebugMode = new URLSearchParams(window.location.search).has('debug');
    if (!isDev && !isDebugMode) {
      return null;
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs shadow-lg"
        >
          🔧 Debug Notifications
        </button>
      </div>
    );
  }

  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new-prompt-available',
          promptText: 'Production test notification!'
        })
      });
      
      if (response.ok) {
        alert('Test notification sent!');
      } else {
        alert('Failed to send test notification');
      }
    } catch (error) {
      alert('Error sending test notification');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-sm text-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">🔧 Notification Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 mb-3">
        <div>
          <strong>Environment:</strong> {process.env.NODE_ENV}
        </div>
        <div>
          <strong>Supported:</strong> {isSupported ? '✅' : '❌'}
        </div>
        <div>
          <strong>Permission:</strong> {permission} {
            permission === 'granted' ? '✅' : 
            permission === 'denied' ? '❌' : '⚠️'
          }
        </div>
        <div>
          <strong>Subscribed:</strong> {isSubscribed ? '✅' : '❌'}
        </div>
        <div>
          <strong>VAPID Key:</strong> {
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY 
              ? '✅ Set' 
              : '❌ Missing'
          }
        </div>
        {error && (
          <div className="text-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {!isSubscribed ? (
          <button
            onClick={subscribe}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-xs disabled:opacity-50"
          >
            {isLoading ? 'Subscribing...' : 'Enable Notifications'}
          </button>
        ) : (
          <>
            <button
              onClick={sendTestNotification}
              className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs"
            >
              Send Test Notification
            </button>
            <button
              onClick={unsubscribe}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-xs disabled:opacity-50"
            >
              {isLoading ? 'Unsubscribing...' : 'Disable Notifications'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
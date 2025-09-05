'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function NotificationSettings() {
  const { data: session } = useSession();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe
  } = usePushNotifications();

  if (!session?.user) {
    return null;
  }

  const handleEnableNotifications = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    await subscribe();
  };

  const handleDisableNotifications = async () => {
    await unsubscribe();
  };

  if (!isSupported) {
    return (
      <div className="bg-app-surface-dark rounded-lg p-6 shadow-sm border border-app-border">
        <h3 className="text-lg font-medium text-app-text mb-2">🔔 Push Notifications</h3>
        <p className="text-app-text-muted text-sm">
          Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-app-surface-dark rounded-lg p-6 shadow-sm border border-app-border">
      <h3 className="text-lg font-medium text-app-text mb-2">🔔 Push Notifications</h3>
      
      <div className="space-y-3">
        <p className="text-app-text-muted text-sm">
          Get notified about new challenges, voting periods, and deadlines.
        </p>

        {error && (
          <div className="text-app-error text-sm bg-app-error-bg border border-app-error rounded p-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              {permission === 'granted' && isSubscribed && (
                <span className="text-app-success text-sm">✅ Enabled</span>
              )}
              {permission === 'granted' && !isSubscribed && (
                <span className="text-yellow-400 text-sm">⚠️ Available</span>
              )}
              {permission === 'denied' && (
                <span className="text-app-error text-sm">❌ Blocked</span>
              )}
              {permission === 'default' && (
                <span className="text-app-text-subtle text-sm">🔔 Not set</span>
              )}
            </div>
            <span className="text-app-text-muted text-sm">
              Push notifications
            </span>
          </div>

          <div className="flex space-x-2">
            {!isSubscribed ? (
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading || permission === 'denied'}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  permission === 'denied' 
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {isLoading ? 'Enabling...' : 'Enable'}
              </button>
            ) : (
              <button
                onClick={handleDisableNotifications}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm rounded-md border border-app-border text-app-text-muted hover:text-app-text hover:border-app-border-light transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Disabling...' : 'Disable'}
              </button>
            )}
          </div>
        </div>

        {permission === 'denied' && (
          <p className="text-app-text-muted text-xs">
            You&apos;ve blocked notifications. To enable them, click the lock icon in your browser&apos;s address bar and allow notifications.
          </p>
        )}

        {isSubscribed && (
          <>
            <div className="text-app-text-muted text-xs space-y-1">
              <p>You&apos;ll be notified about:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>New challenges when they become available</li>
                <li>24-hour reminders to submit your response</li>
                <li>When voting opens for a challenge</li>
                <li>24-hour reminders to cast your votes</li>
              </ul>
            </div>
            
            <div className="pt-2 border-t border-app-border">
              <TestNotificationButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TestNotificationButton() {
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const sendTestNotification = async () => {
    setIsTestLoading(true);
    setTestMessage(null);

    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new-prompt-available',
          promptText: 'Test your creativity with this sample challenge!'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      const result = await response.json();
      if (result.success) {
        setTestMessage(`Test notification sent! (${result.result.sent} sent)`);
      } else {
        setTestMessage('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestMessage('Error sending test notification');
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={sendTestNotification}
        disabled={isTestLoading}
        className="text-xs px-2 py-1 bg-app-surface border border-app-border text-app-text-muted hover:text-app-text hover:border-app-border-light rounded-md transition-colors disabled:opacity-50"
      >
        {isTestLoading ? 'Sending...' : '📱 Send Test Notification'}
      </button>
      
      {testMessage && (
        <p className={`text-xs ${testMessage.includes('sent') ? 'text-app-success' : 'text-app-error'}`}>
          {testMessage}
        </p>
      )}
    </div>
  );
}
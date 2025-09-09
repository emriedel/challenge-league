'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from 'next-auth/react';

export default function NotificationSettings() {
  const { data: session } = useSession();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
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
      
      <div className="space-y-4">
        <p className="text-app-text-muted text-sm">
          Get notified about new challenges, voting periods, and deadlines.
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isSubscribed ? (
              <span className="text-app-success text-sm">✅ Enabled</span>
            ) : permission === 'denied' ? (
              <span className="text-app-error text-sm">❌ Blocked</span>
            ) : (
              <span className="text-app-text-subtle text-sm">🔔 Disabled</span>
            )}
          </div>

          <div className="flex space-x-2">
            {!isSubscribed ? (
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading || permission === 'denied'}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  permission === 'denied' 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {isLoading ? 'Enabling...' : 'Enable'}
              </button>
            ) : (
              <button
                onClick={handleDisableNotifications}
                disabled={isLoading}
                className="px-4 py-2 text-sm rounded-md border border-app-border text-app-text-muted hover:text-app-text hover:border-app-border-light transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Disabling...' : 'Disable'}
              </button>
            )}
          </div>
        </div>

        {permission === 'denied' && (
          <p className="text-app-text-muted text-xs bg-app-surface rounded p-2">
            To enable notifications, click the lock icon in your browser&apos;s address bar and allow notifications.
          </p>
        )}

        {isSubscribed && (
          <div className="text-app-text-muted text-xs space-y-2 pt-2 border-t border-app-border">
            <p>You&apos;ll be notified about:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>New challenges when they become available</li>
              <li>Reminders to submit your response</li>
              <li>When voting opens for a challenge</li>
              <li>Reminders to cast your votes</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
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
        <h3 className="text-lg font-medium text-app-text mb-2">Push Notifications</h3>
        <p className="text-app-text-muted text-sm">
          Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-app-surface-dark rounded-lg p-6 shadow-sm border border-app-border">
      <h3 className="text-lg font-medium text-app-text mb-2">Push Notifications</h3>
      
      <div className="space-y-4">
        <p className="text-app-text-muted text-sm">
          Get notified about new challenges, voting periods, and deadlines.
        </p>

        <div className="flex items-center justify-between">
          <span className="text-app-text text-sm font-medium">Notifications</span>
          
          <div className="flex items-center space-x-3">
            {permission === 'denied' ? (
              <span className="text-app-error text-sm">Blocked</span>
            ) : (
              <>
                <span className={`text-sm ${
                  isSubscribed ? 'text-app-text-muted' : 'text-app-text'
                }`}>Off</span>
                
                <button
                  onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
                  disabled={isLoading}
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3a8e8c] focus:ring-offset-2 disabled:opacity-50 ${
                    isSubscribed ? 'bg-[#3a8e8c]' : 'bg-app-border'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 shrink-0 transform rounded-full bg-white transition-transform ${
                      isSubscribed ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
                
                <span className={`text-sm ${
                  isSubscribed ? 'text-app-text' : 'text-app-text-muted'
                }`}>On</span>
              </>
            )}
          </div>
        </div>

        {permission === 'denied' && (
          <p className="text-app-text-muted text-xs bg-app-surface rounded p-2">
            To enable notifications, click the lock icon in your browser&apos;s address bar and allow notifications.
          </p>
        )}

      </div>
    </div>
  );
}
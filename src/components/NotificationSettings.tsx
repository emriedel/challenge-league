'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSession } from 'next-auth/react';

export default function NotificationSettings() {
  const { data: session } = useSession();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    wasResetBySystem,
    requestPermission,
    subscribe,
    unsubscribe
  } = usePushNotifications();

  // Local state for optimistic UI updates
  const [optimisticSubscribed, setOptimisticSubscribed] = useState<boolean | null>(null);
  const [hasError, setHasError] = useState(false);

  // Reset optimistic state when actual state changes
  useEffect(() => {
    setOptimisticSubscribed(null);
    setHasError(false);
  }, [isSubscribed]);

  if (!session?.user) {
    return null;
  }

  const handleEnableNotifications = async () => {
    // If permission is denied, we can't do anything
    if (permission === 'denied') {
      return;
    }

    setHasError(false);

    try {
      // If permission is default, request permission first (this shows the system dialog)
      if (permission === 'default') {
        const granted = await requestPermission();
        if (!granted) {
          // User declined the system permission dialog
          return;
        }
      }

      // Only show optimistic state after permission is granted
      setOptimisticSubscribed(true);

      // Now subscribe to push notifications
      const success = await subscribe();
      if (!success) {
        setOptimisticSubscribed(false);
        setHasError(true);
      }
    } catch (error) {
      setOptimisticSubscribed(false);
      setHasError(true);
    }
  };

  const handleDisableNotifications = async () => {
    setOptimisticSubscribed(false);
    setHasError(false);

    try {
      const success = await unsubscribe();
      if (!success) {
        setOptimisticSubscribed(true);
        setHasError(true);
      }
    } catch (error) {
      setOptimisticSubscribed(true);
      setHasError(true);
    }
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
              <div className="flex items-center space-x-3">
                <span className="text-app-text-muted text-sm">Off</span>
                <div className="relative">
                  <button
                    disabled
                    className="toggle-button relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-app-border opacity-50 cursor-not-allowed"
                  >
                    <span className="inline-block h-5 w-5 shrink-0 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
                <span className="text-app-error text-sm">Blocked</span>
              </div>
            ) : (
              <>
                {/* Determine the current toggle state (optimistic or actual) */}
                {(() => {
                  const currentlySubscribed = optimisticSubscribed !== null ? optimisticSubscribed : isSubscribed;

                  return (
                    <>
                      <span className={`text-sm ${
                        currentlySubscribed ? 'text-app-text-muted' : 'text-app-text'
                      }`}>Off</span>

                      <div className="relative">
                        <button
                          onClick={currentlySubscribed ? handleDisableNotifications : handleEnableNotifications}
                          disabled={isLoading}
                          className={`toggle-button relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3a8e8c] focus:ring-offset-2 disabled:opacity-50 ${
                            currentlySubscribed ? 'bg-[#3a8e8c]' : 'bg-app-border'
                          } ${hasError ? 'ring-2 ring-app-error' : ''}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 shrink-0 transform rounded-full bg-white transition-transform ${
                              currentlySubscribed ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>

                        {/* Loading spinner overlay when processing */}
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      <span className={`text-sm ${
                        currentlySubscribed ? 'text-app-text' : 'text-app-text-muted'
                      }`}>On</span>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* Error message if subscription failed */}
        {hasError && (
          <p className="text-app-error text-xs bg-app-surface rounded p-2">
            Failed to update notification settings. Please try again.
          </p>
        )}

        {permission === 'denied' && (
          <div className="text-app-text-muted text-xs bg-app-surface rounded p-3">
            <p className="font-medium text-app-error mb-1">Notifications are blocked</p>
            <p>Enable notifications for this app in your system settings, then refresh this page.</p>
          </div>
        )}

        {wasResetBySystem && permission === 'default' && (
          <div className="text-app-text-muted text-xs bg-amber-950/30 border border-amber-900/50 rounded p-3">
            <p className="font-medium text-amber-400 mb-1">Notification settings were reset</p>
            <p>iOS may have reset your notification permissions. Toggle notifications back on to re-enable them.</p>
          </div>
        )}

      </div>
    </div>
  );
}
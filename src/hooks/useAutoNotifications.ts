import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePushNotifications } from './usePushNotifications';
import { shouldAttemptAutoEnable, markAutoEnableAttempted } from '@/lib/notificationPrefs';

/**
 * Hook that automatically enables push notifications for logged-in users
 * - Only attempts once per session to avoid being annoying
 * - Waits a few seconds after login to let the user settle in
 * - Gracefully handles permission denied without showing errors
 */
export function useAutoNotifications() {
  const { data: session, status } = useSession();
  const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Don't run if:
    // - Still loading session
    // - Not logged in
    // - Already attempted this session
    // - Notifications not supported
    // - Already subscribed
    // - Permission already denied
    // - User preferences indicate we shouldn't attempt
    if (
      status === 'loading' ||
      !session?.user ||
      hasAttempted.current ||
      !isSupported ||
      isSubscribed ||
      permission === 'denied' ||
      !shouldAttemptAutoEnable()
    ) {
      return;
    }

    // Wait 3 seconds after login to let user settle in
    const timer = setTimeout(async () => {
      hasAttempted.current = true;
      markAutoEnableAttempted();

      try {
        console.log('🔔 Auto-enabling notifications for user:', session.user.username);
        
        const success = await subscribe();
        
        if (success) {
          console.log('✅ Auto-enabled notifications successfully');
        } else {
          console.log('ℹ️ Auto-enable notifications was declined by user');
        }
      } catch (error) {
        // Silently handle errors - we don't want to show error messages for auto-enable
        console.log('ℹ️ Auto-enable notifications was not possible:', error);
      }
    }, 3000); // 3 second delay

    return () => clearTimeout(timer);
  }, [session, status, isSupported, isSubscribed, permission, subscribe]);

  // Return nothing - this is just for side effects
  return null;
}
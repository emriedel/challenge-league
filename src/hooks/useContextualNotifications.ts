import { useEffect } from 'react';
import { usePushNotifications } from './usePushNotifications';

interface UseContextualNotificationsProps {
  leagueName?: string;
  trigger?: 'league-join' | null;
}

/**
 * Hook that shows contextual notification prompts at meaningful moments
 * - Only prompts when user is in "default" permission state
 * - Shows relevant messaging based on context
 * - Respects user's previous permission decisions
 */
export function useContextualNotifications({
  leagueName,
  trigger
}: UseContextualNotificationsProps) {
  const { isSupported, permission, isSubscribed, requestPermission, subscribe } = usePushNotifications();

  useEffect(() => {
    if (!trigger || !leagueName) return;

    // Only prompt if:
    // - Browser supports notifications
    // - User hasn't been asked before (permission is "default")
    // - User isn't already subscribed
    if (!isSupported || permission !== 'default' || isSubscribed) {
      return;
    }

    // Small delay to let the page settle after navigation
    const timer = setTimeout(async () => {
      const shouldPrompt = confirm(
        `📱 Turn on notifications so you don't miss voting deadlines for ${leagueName}?`
      );

      if (shouldPrompt) {
        try {
          const granted = await requestPermission();
          if (granted) {
            await subscribe();
          }
        } catch (error) {
          console.log('User declined notification permission:', error);
        }
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [trigger, leagueName, isSupported, permission, isSubscribed, requestPermission, subscribe]);
}
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PushNotificationActions {
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushNotifications(): PushNotificationState & PushNotificationActions {
  const { data: session } = useSession();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: true,
    error: null
  });

  // Check browser support and current state on mount
  useEffect(() => {
    async function checkSupport() {
      try {
        // Check if service worker and push notifications are supported
        const isSupported = 
          'serviceWorker' in navigator &&
          'PushManager' in window &&
          'Notification' in window;

        if (!isSupported) {
          setState(prev => ({
            ...prev,
            isSupported: false,
            isLoading: false,
            error: 'Push notifications are not supported in this browser'
          }));
          return;
        }

        // Get current permission state
        const permission = Notification.permission;

        // Check if currently subscribed
        let isSubscribed = false;
        if (permission === 'granted') {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            isSubscribed = subscription !== null;
          } catch (error) {
            console.error('Error checking subscription status:', error);
          }
        }

        setState(prev => ({
          ...prev,
          isSupported: true,
          permission,
          isSubscribed,
          isLoading: false,
          error: null
        }));

      } catch (error) {
        console.error('Error checking push notification support:', error);
        setState(prev => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: 'Failed to check push notification support'
        }));
      }
    }

    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!state.isSupported) {
        throw new Error('Push notifications are not supported');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const permission = await Notification.requestPermission();
      
      setState(prev => ({ 
        ...prev, 
        permission, 
        isLoading: false 
      }));

      return permission === 'granted';

    } catch (error) {
      console.error('Error requesting permission:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to request notification permission'
      }));
      return false;
    }
  };

  // Subscribe to push notifications
  const subscribe = async (): Promise<boolean> => {
    try {
      if (!session?.user) {
        throw new Error('User must be logged in to subscribe');
      }

      if (!state.isSupported) {
        throw new Error('Push notifications are not supported');
      }

      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key is not configured');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Request permission if needed
      if (state.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Notification permission was denied');
        }
      }

      // Register service worker if needed
      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.register('/sw.js');
        console.log('🔧 Service worker registered:', registration);
        await navigator.serviceWorker.ready;
        console.log('✅ Service worker ready');
      } catch (error) {
        console.error('❌ Service worker registration failed:', error);
        throw new Error('Failed to register service worker');
      }

      // Subscribe to push manager
      console.log('🔐 Subscribing with VAPID key:', VAPID_PUBLIC_KEY?.substring(0, 20) + '...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('📋 Push subscription created:', subscription.endpoint);

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false
      }));

      return true;

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to notifications'
      }));
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async (): Promise<boolean> => {
    try {
      if (!session?.user) {
        throw new Error('User must be logged in to unsubscribe');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove subscription from server
        const response = await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });

        if (!response.ok) {
          console.warn('Failed to remove subscription from server');
        }
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false
      }));

      return true;

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe from notifications'
      }));
      return false;
    }
  };

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe
  };
}

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
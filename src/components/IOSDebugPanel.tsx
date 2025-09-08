'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface DebugLog {
  id: number;
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
}

/**
 * On-screen debug panel for iOS PWA debugging
 * Shows console-like output directly in the UI
 */
export default function IOSDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission
  } = usePushNotifications();

  // Override console methods to capture logs
  useEffect(() => {
    if (!isVisible) return;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: DebugLog['type'], message: string) => {
      const log: DebugLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message
      };
      setLogs(prev => [...prev.slice(-20), log]); // Keep last 20 logs
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      if (args.some(arg => typeof arg === 'string' && (arg.includes('🔔') || arg.includes('📱') || arg.includes('✅') || arg.includes('❌')))) {
        addLog('info', args.join(' '));
      }
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      if (args.some(arg => typeof arg === 'string' && (arg.includes('notification') || arg.includes('push') || arg.includes('service worker')))) {
        addLog('error', args.join(' '));
      }
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('warning', args.join(' '));
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [isVisible]);

  // Auto-show on production for iOS
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const isProd = window.location.hostname !== 'localhost';
    
    if (isIOS && isPWA && isProd) {
      // Auto-show for 10 seconds on iOS PWA in production
      setIsVisible(true);
      const timer = setTimeout(() => setIsMinimized(true), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const runDiagnostics = async () => {
    setLogs([]);
    const addLog = (type: DebugLog['type'], message: string) => {
      setLogs(prev => [...prev, {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message
      }]);
    };

    addLog('info', '🔍 Starting iOS PWA Notification Diagnostics...');
    
    // Environment checks
    addLog('info', `📱 User Agent: ${navigator.userAgent}`);
    addLog('info', `🌐 Hostname: ${window.location.hostname}`);
    addLog('info', `📺 Display Mode: ${window.matchMedia('(display-mode: standalone)').matches ? 'PWA' : 'Browser'}`);
    
    // Feature support
    addLog(isSupported ? 'success' : 'error', `🔧 Push Notifications Supported: ${isSupported}`);
    addLog('info', `📱 Service Worker: ${'serviceWorker' in navigator}`);
    addLog('info', `🔔 Notification API: ${'Notification' in window}`);
    addLog('info', `📡 Push Manager: ${'PushManager' in window}`);
    
    // Permission status
    addLog('info', `🔐 Permission: ${permission}`);
    addLog('info', `📋 Subscribed: ${isSubscribed}`);
    addLog('info', `⏳ Loading: ${isLoading}`);
    
    if (error) {
      addLog('error', `❌ Error: ${error}`);
    }

    // VAPID key check
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    addLog(vapidKey ? 'success' : 'error', `🔑 VAPID Key: ${vapidKey ? 'Present' : 'Missing'}`);
    if (vapidKey) {
      addLog('info', `🔑 VAPID Key Preview: ${vapidKey.substring(0, 20)}...`);
    }

    // Service Worker status
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        addLog(registration ? 'success' : 'warning', `🔧 SW Registration: ${registration ? 'Found' : 'Not found'}`);
        
        if (registration) {
          addLog('info', `🔧 SW State: ${registration.active?.state || 'Unknown'}`);
          addLog('info', `🔧 SW Scope: ${registration.scope}`);
          
          // Check push subscription
          const subscription = await registration.pushManager.getSubscription();
          addLog(subscription ? 'success' : 'warning', `📡 Push Subscription: ${subscription ? 'Active' : 'None'}`);
          
          if (subscription) {
            addLog('info', `📡 Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          }
        }
      }
    } catch (swError) {
      addLog('error', `❌ SW Check Failed: ${swError instanceof Error ? swError.message : 'Unknown'}`);
    }

    // iOS-specific guidance
    if (!isSupported && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      addLog('warning', '📱 iOS Push Notification Limitations Detected:');
      addLog('info', '• iOS 16.4+ required for web push support');
      addLog('info', '• PWA support may differ from Safari web');
      addLog('info', '• Try opening in Safari browser instead of PWA');
      addLog('info', '• Service worker registration may be blocked in PWA mode');
    }

    addLog('info', '✅ Diagnostics Complete');
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 bg-purple-600 text-white px-2 py-1 rounded text-xs"
        style={{ fontSize: '10px' }}
      >
        📱 iOS Debug
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gray-800 text-white px-2 py-1 rounded-lg text-xs shadow-lg"
        >
          📱 Debug ({logs.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-2 flex justify-between items-center text-xs">
        <span>📱 iOS PWA Debug Panel</span>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-yellow-400 hover:text-yellow-300"
          >
            −
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Status Panel */}
      <div className="p-2 bg-gray-800 border-b border-gray-700 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>Status: {isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed'}</div>
          <div>Permission: {permission}</div>
          <div>Supported: {isSupported ? '✅' : '❌'}</div>
          <div>Loading: {isLoading ? '⏳' : '✅'}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-2 bg-gray-800 border-b border-gray-700 flex flex-wrap gap-1">
        <button
          onClick={runDiagnostics}
          className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
        >
          🔍 Run Diagnostics
        </button>
        {permission === 'default' && (
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="bg-orange-600 px-2 py-1 rounded text-xs hover:bg-orange-700 disabled:opacity-50"
          >
            🔔 Request Permission
          </button>
        )}
        {permission === 'granted' && !isSubscribed && (
          <button
            onClick={subscribe}
            disabled={isLoading}
            className="bg-green-600 px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
          >
            📡 Subscribe
          </button>
        )}
        {isSubscribed && (
          <button
            onClick={unsubscribe}
            disabled={isLoading}
            className="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
          >
            🗑️ Unsubscribe
          </button>
        )}
        <button
          onClick={() => setLogs([])}
          className="bg-gray-600 px-2 py-1 rounded text-xs hover:bg-gray-700"
        >
          🗑️ Clear Logs
        </button>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-2 text-xs">
        {logs.length === 0 ? (
          <div className="text-gray-400">Click &quot;Run Diagnostics&quot; to start debugging...</div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-1 rounded text-xs ${
                  log.type === 'error' ? 'bg-red-900/50 text-red-200' :
                  log.type === 'success' ? 'bg-green-900/50 text-green-200' :
                  log.type === 'warning' ? 'bg-yellow-900/50 text-yellow-200' :
                  'bg-gray-800 text-gray-200'
                }`}
              >
                <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
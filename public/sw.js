const CACHE_NAME = 'challenge-league-v3';
const STATIC_CACHE_NAME = 'challenge-league-static-v3';
const DYNAMIC_CACHE_NAME = 'challenge-league-dynamic-v3';

// Files to cache on install
// Note: '/' is excluded because it's a dynamic page that checks auth status
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(async (cache) => {
        // Cache assets individually to avoid failing on missing files
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn(`Failed to cache ${asset}:`, error);
          }
        });
        
        await Promise.all(cachePromises);
      })
      .catch((error) => {
        console.error('Failed to open cache:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - cache first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Images - stale while revalidate
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // HTML pages - network first
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default to network first
  event.respondWith(networkFirst(request));
});

// Cache first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
    if (request.destination === 'document') {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Challenge League - Offline</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                padding: 20px; 
                text-align: center; 
                color: #374151;
                background: #f9fafb;
              }
              .offline { 
                margin-top: 50px; 
                max-width: 400px;
                margin-left: auto;
                margin-right: auto;
              }
              h1 { color: #1f2937; }
            </style>
          </head>
          <body>
            <div class="offline">
              <h1>You're offline</h1>
              <p>Challenge League needs an internet connection to work properly.</p>
              <p>Please check your connection and try again.</p>
            </div>
          </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || networkResponsePromise;
}

// Helper function to refresh PWA badge
// Badge logic: Count leagues where needsAction=true AND isStarted=true
async function refreshPWABadge() {
  if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
    try {
      const response = await fetch('/api/leagues/actions');
      const data = await response.json();

      if (response.ok && data.leagues) {
        // Only count leagues that need action AND have been started
        const actionCount = data.leagues.filter(league => league.needsAction && league.isStarted).length;
        if (actionCount > 0) {
          navigator.setAppBadge(actionCount);
        } else {
          navigator.clearAppBadge();
        }
      }
    } catch (error) {
      console.warn('Failed to refresh PWA badge in service worker:', error);
    }
  }
}

// Helper function to invalidate league cache across all tabs
async function invalidateLeagueCache(leagueId) {
  try {
    // Use BroadcastChannel to send cache invalidation to all open tabs
    if ('BroadcastChannel' in self) {
      const channel = new BroadcastChannel('cache-invalidation');
      channel.postMessage({
        type: 'INVALIDATE_LEAGUE_CACHE',
        leagueId: leagueId,
        timestamp: Date.now(),
        source: 'service-worker'
      });
      channel.close();
      console.log(`📱 Cache invalidation broadcast sent for league ${leagueId}`);
    }

    // Clear relevant cached API responses
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const keys = await cache.keys();

    const leagueRelatedRequests = keys.filter(request => {
      const url = new URL(request.url);
      return url.pathname.includes(`/api/leagues/${leagueId}`) ||
             url.pathname.includes('/api/leagues/actions');
    });

    await Promise.all(leagueRelatedRequests.map(request => cache.delete(request)));
    console.log(`🗑️ Cleared ${leagueRelatedRequests.length} cached league requests`);

  } catch (error) {
    console.error('Failed to invalidate league cache:', error);
  }
}

// Push notification event handler
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Challenge League',
    body: 'New activity in your league!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {
      url: '/'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Handle badge refresh notifications (silent notifications)
  if (notificationData.data?.type === 'badge-refresh') {
    const refreshPromise = refreshPWABadge();
    event.waitUntil(refreshPromise);
    return; // Don't show a visual notification for badge refresh
  }

  // Handle cache invalidation for league start events
  if (notificationData.data?.invalidateCache && notificationData.data?.leagueId) {
    const cacheInvalidationPromise = invalidateLeagueCache(notificationData.data.leagueId);
    event.waitUntil(cacheInvalidationPromise);
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.tag || 'challenge-league',
    requireInteraction: false, // Changed to false so notification shows even briefly
    vibrate: [100, 50, 100],
    actions: notificationData.actions || [],
    silent: false,
    renotify: true
  };

  const showNotificationPromise = self.registration.showNotification(notificationData.title, notificationOptions)
    .catch((error) => {
      console.error('Failed to show notification:', error);
    });

  event.waitUntil(showNotificationPromise);
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === self.registration.scope && 'focus' in client) {
            return client.focus().then(() => client.navigate(targetUrl));
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
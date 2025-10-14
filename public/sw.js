const CACHE_NAME = 'challenge-league-v4';
const STATIC_CACHE_NAME = 'challenge-league-static-v4';
const DYNAMIC_CACHE_NAME = 'challenge-league-dynamic-v4';
const IMAGE_CACHE_NAME = 'challenge-league-images-v1'; // Challenge photos (immutable)
const PROFILE_CACHE_NAME = 'challenge-league-profiles-v1'; // Profile photos (may change)

// Cache size limits
const MAX_IMAGE_CACHE_SIZE = 500; // 500 challenge photos
const MAX_PROFILE_CACHE_SIZE = 100; // 100 profile photos

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
  const validCaches = [
    STATIC_CACHE_NAME,
    DYNAMIC_CACHE_NAME,
    IMAGE_CACHE_NAME,
    PROFILE_CACHE_NAME
  ];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCaches.includes(cacheName)) {
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

  // CRITICAL: Skip blob URLs - these are client-side only and must not be intercepted
  // Blob URLs are used for image previews before upload
  if (url.protocol === 'blob:') {
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

  // Images - enhanced caching strategy
  if (request.destination === 'image' ||
      url.hostname.includes('blob.vercel-storage.com') ||
      url.pathname.includes('/_next/image')) {

    // Profile photos - stale while revalidate (may change)
    if (url.searchParams.get('url')?.includes('profile') ||
        url.href.includes('/profile/') ||
        url.pathname.includes('/profile/')) {
      event.respondWith(cacheProfilePhoto(request));
      return;
    }

    // Challenge photos - cache first (immutable once voting starts)
    event.respondWith(cacheChallengePhoto(request));
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

// Cache challenge photos aggressively (immutable after voting starts)
async function cacheChallengePhoto(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Return cached version immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Limit cache size before adding new entry
      await limitCacheSize(IMAGE_CACHE_NAME, MAX_IMAGE_CACHE_SIZE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Challenge photo cache failed:', error);
    // Try to return cached version if network failed
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

// Cache profile photos with stale-while-revalidate (may change)
async function cacheProfilePhoto(request) {
  try {
    const cache = await caches.open(PROFILE_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Use stale while revalidate for profile photos
    const networkResponsePromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        await limitCacheSize(PROFILE_CACHE_NAME, MAX_PROFILE_CACHE_SIZE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(() => cachedResponse);

    return cachedResponse || networkResponsePromise;
  } catch (error) {
    console.error('Profile photo cache failed:', error);
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

// Limit cache size by removing oldest entries (FIFO)
async function limitCacheSize(cacheName, maxSize) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxSize) {
      // Remove oldest entries (FIFO)
      const keysToDelete = keys.slice(0, keys.length - maxSize);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
      console.log(`🗑️ Cleaned up ${keysToDelete.length} old entries from ${cacheName}`);
    }
  } catch (error) {
    console.error('Cache size limit failed:', error);
  }
}

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

// Helper function to invalidate user's submission image from cache
async function invalidateSubmissionImage(imageUrl) {
  try {
    const imageCache = await caches.open(IMAGE_CACHE_NAME);
    const keys = await imageCache.keys();

    // Find and delete cached entries for this image URL
    const imagesToDelete = keys.filter(request => {
      const url = new URL(request.url);
      // Match by image URL parameter in Next.js image optimization
      const cachedImageUrl = url.searchParams.get('url');
      return cachedImageUrl === imageUrl || request.url === imageUrl;
    });

    await Promise.all(imagesToDelete.map(request => imageCache.delete(request)));

    if (imagesToDelete.length > 0) {
      console.log(`🗑️ Invalidated ${imagesToDelete.length} cached submission image(s)`);
    }
  } catch (error) {
    console.error('Failed to invalidate submission image:', error);
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

  // Handle submission image invalidation (when user updates their photo during ACTIVE phase)
  if (notificationData.data?.invalidateImage && notificationData.data?.imageUrl) {
    const imageInvalidationPromise = invalidateSubmissionImage(notificationData.data.imageUrl);
    event.waitUntil(imageInvalidationPromise);
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

// Message event handler - for direct communication from the app
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'INVALIDATE_SUBMISSION_IMAGE':
      // When user updates their submission during ACTIVE phase
      if (data?.imageUrl) {
        event.waitUntil(invalidateSubmissionImage(data.imageUrl));
      }
      break;

    case 'INVALIDATE_LEAGUE_CACHE':
      // When league state changes
      if (data?.leagueId) {
        event.waitUntil(invalidateLeagueCache(data.leagueId));
      }
      break;

    case 'SKIP_WAITING':
      // Force service worker to activate immediately
      self.skipWaiting();
      break;

    default:
      console.log('Unknown message type:', type);
  }
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
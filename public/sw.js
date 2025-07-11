const CACHE_NAME = 'owsla-v1';
const API_CACHE_NAME = 'owsla-api-v1';
const STATIC_CACHE_NAME = 'owsla-static-v1';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-icon.png',
  '/favicon.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Opened static cache');
        return cache.addAll(urlsToCache);
      }),
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('Opened API cache');
        return Promise.resolve();
      })
    ])
  );
  // Force immediate activation
  self.skipWaiting();
});

// Helper function to determine cache strategy
function getCacheStrategy(url) {
  const pathname = new URL(url).pathname;
  
  // Static assets - cache first
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/)) {
    return 'cache-first';
  }
  
  // Next.js server actions and API routes - network first with cache fallback
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/') || pathname.includes('/actions/')) {
    return 'network-first';
  }
  
  // Pages - network first
  return 'network-first';
}

// Network-first strategy for server actions and API calls
async function networkFirstStrategy(request, cacheName = API_CACHE_NAME) {
  try {
    const response = await fetch(request.clone());
    
    // Only cache successful responses and avoid caching POST requests (server actions)
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request.clone(), response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add header to indicate this is cached data
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Cache-Status', 'hit');
      headers.set('X-Cache-Date', cachedResponse.headers.get('date') || 'unknown');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // No cache available, throw error
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request, cacheName = STATIC_CACHE_NAME) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Network failed and no cache - return offline page for documents
    if (request.destination === 'document') {
      return caches.match('/');
    }
    throw error;
  }
}

// Fetch event - intelligent caching based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for Next.js hot-reload and dev resources
  if (
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.includes('.hot-update.') ||
    request.headers.get('x-nextjs-data') ||
    url.pathname.startsWith('/_next/static/chunks/pages/_error')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Determine cache strategy
  const strategy = getCacheStrategy(request.url);

  if (strategy === 'cache-first') {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
  } else if (strategy === 'network-first') {
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
  } else {
    // Default to network-first for pages
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
  }
});

// Handle cache invalidation messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_INVALIDATE') {
    const { cacheKey, userId } = event.data;
    
    // Clear all relevant caches when curriculum data changes
    Promise.all([
      caches.open(API_CACHE_NAME),
      caches.open(CACHE_NAME)
    ]).then(([apiCache, mainCache]) => {
      if (cacheKey === 'user-curricula' && userId) {
        // Clear all cache entries - server actions don't have predictable URLs
        console.log('Clearing all API caches for user curricula update');
        return Promise.all([
          apiCache.keys().then(keys => Promise.all(keys.map(key => apiCache.delete(key)))),
          mainCache.keys().then(keys => 
            Promise.all(keys.filter(key => 
              // Only clear page caches, not static assets
              !key.url.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/)
            ).map(key => mainCache.delete(key)))
          )
        ]);
      } else if (cacheKey === 'all') {
        // Clear all caches
        console.log('Clearing all caches');
        return Promise.all([
          apiCache.keys().then(keys => Promise.all(keys.map(key => apiCache.delete(key)))),
          mainCache.keys().then(keys => 
            Promise.all(keys.filter(key => 
              !key.url.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/)
            ).map(key => mainCache.delete(key)))
          )
        ]);
      }
    }).catch(err => console.error('Cache invalidation error:', err));
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Background sync for curriculum data updates (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'curriculum-sync') {
      event.waitUntil(
        // Signal clients to refresh their data
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_CURRICULUM_DATA'
            });
          });
        })
      );
    }
  });
}
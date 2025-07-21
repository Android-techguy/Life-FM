// Service Worker for My Life FM PWA
const CACHE_NAME = 'mylifefm-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://mylifefm.com/wp-content/uploads/2023/10/a.png',
  'https://android-techguy.github.io/Life-FM/splash-logo.png'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('[ServiceWorker] Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  // Skip cross-origin requests and audio streams
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('audioworker.jpcurtis58.workers.dev')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          console.log('[ServiceWorker] Found in cache:', event.request.url);
          return response;
        }
        
        console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request).then(function(response) {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          var responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(function() {
        // Return offline fallback if available
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', function(event) {
  console.log('[ServiceWorker] Background sync:', event.tag);
});

// Push notifications (if needed in future)
self.addEventListener('push', function(event) {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: 'My Life FM is now playing!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('My Life FM', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[ServiceWorker] Notification click received.');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
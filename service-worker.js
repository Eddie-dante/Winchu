const CACHE_NAME = 'winchu-nexus-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/js/firebase.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/chat.js',
  '/js/social.js',
  '/js/dashboard.js',
  '/js/diary.js',
  '/js/routine.js',
  '/js/profile.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
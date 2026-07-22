const CACHE_NAME = 'winchu-nexus-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/firebase.js',
    '/js/state.js',
    '/js/navigation.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/social.js',
    '/js/chat.js',
    '/js/profile.js',
    '/js/videos.js',
    '/js/groups.js',
    '/js/wallpapers.js',
    '/js/diary.js',
    '/js/notifications.js',
    '/js/bookmarks.js',
    '/js/app.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                })
            );
        })
    );
});
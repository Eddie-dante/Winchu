var CACHE_NAME = 'winchu-nexus-v2';
var urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/firebase.js',
    '/js/state.js',
    '/js/navigation.js',
    '/js/auth.js',
    '/js/app.js',
    '/js/dashboard.js',
    '/js/social.js',
    '/js/videos.js',
    '/js/chat.js',
    '/js/profile.js',
    '/js/groups.js',
    '/js/wallpapers.js',
    '/js/diary.js',
    '/js/notifications.js',
    '/js/bookmarks.js',
    '/js/routine.js',
    '/page/diary.html',
    '/manifest.json'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
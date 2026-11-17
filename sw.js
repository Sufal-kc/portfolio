// Service worker: shows a friendly offline / server-error page when the site
// can't be reached. Only page navigations are intercepted; every other request
// (CSS, JS, images, APIs) goes straight to the network, so nothing is ever
// served stale. Bump CACHE_VERSION whenever offline.html changes.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `skc-offline-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key.startsWith('skc-offline-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.mode !== 'navigate') return;

    event.respondWith((async () => {
        try {
            const response = await fetch(event.request);
            // Server reachable but failing (500, 502, 503, 504…): show the error page.
            if (response.status >= 500) {
                return (await caches.match(OFFLINE_URL)) || response;
            }
            return response;
        } catch (error) {
            // No connection / DNS failure / server down.
            return (await caches.match(OFFLINE_URL)) || Response.error();
        }
    })());
});

const CACHE_NAME = "denis-global-v1";

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/about.html",
    "/services.html",
    "/portfolio.html",
    "/contact.html",
    "/chat.html",
    "/terms.html",
    "/privacy.html",
    "/faq.html",
    "/pricing.html",
    "/booking.html",
    "/testimonials.html",
    "/newsletter.html",
    "/blog.html",
    "/careers.html",
    "/team.html",
    "/404.html",
    "/manifest.json"
];

// Install service worker and cache website files.
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// Activate service worker and remove old caches.
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );

    self.clients.claim();
});

// Serve cached files when offline.
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {

            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).catch(() => {

                if (event.request.mode === "navigate") {
                    return caches.match("/404.html");
                }

            });

        })
    );

});
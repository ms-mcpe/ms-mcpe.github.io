var CACHE_NAME = 'worldleaf-space-v2';
var HTML_CACHE = './spaces.html';

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(name) { return name !== CACHE_NAME; })
                    .map(function(name) { return caches.delete(name); })
            );
        }).then(function() { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function(event) {
    var req = event.request;
    if (req.method !== 'GET') return;
    var accept = req.headers.get('accept') || '';
    var isHTML = req.mode === 'navigate' || accept.indexOf('text/html') !== -1 || req.url.indexOf('spaces.html') !== -1;

    if (isHTML) {
        event.respondWith(
            fetch(req).then(function(res) {
                var copy = res.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    try { cache.put(req, copy); } catch (e) {}
                });
                return res;
            }).catch(function() {
                return caches.match(req).then(function(r) { return r || caches.match(HTML_CACHE); });
            })
        );
    } else {
        event.respondWith(
            caches.match(req).then(function(r) { return r || fetch(req); })
        );
    }
});

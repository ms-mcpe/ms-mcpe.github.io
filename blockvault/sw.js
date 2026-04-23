const CACHE_NAME = 'mc-studio-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png' 
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si el network funciona, actualizamos el cache y devolvemos la respuesta
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Si el network falla, buscamos en el cache
        return caches.match(event.request);
      })
  );
});

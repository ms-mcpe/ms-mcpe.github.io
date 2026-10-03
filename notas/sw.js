/* Service worker de "Mis Notas".
   Guarda la app en el dispositivo para que abra al instante y sin conexión. */
const CACHE = 'mis-notas-v2';
const RECURSOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(RECURSOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const solicitud = evento.request;
  if (solicitud.method !== 'GET') return;

  const url = new URL(solicitud.url);
  if (url.origin !== self.location.origin) return;   // Google Apps Script va directo a la red

  // Navegación: red primero para traer actualizaciones, caché si no hay internet.
  if (solicitud.mode === 'navigate') {
    evento.respondWith(
      fetch(solicitud)
        .then(respuesta => {
          const copia = respuesta.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copia));
          return respuesta;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Recursos estáticos: caché primero.
  evento.respondWith(
    caches.match(solicitud).then(enCache => enCache || fetch(solicitud).then(respuesta => {
      if (respuesta.ok) {
        const copia = respuesta.clone();
        caches.open(CACHE).then(cache => cache.put(solicitud, copia));
      }
      return respuesta;
    }))
  );
});
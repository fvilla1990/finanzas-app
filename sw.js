/**
 * Service worker mínimo de Finanzas Personales.
 * - Solo controla este sitio (GitHub Pages). Nunca intercepta script.google.com,
 *   así que NO ve ni guarda datos financieros.
 * - Guarda en caché únicamente los archivos estáticos del envoltorio (portada, ícono).
 * - Estrategia: red primero; si no hay conexión, usa la copia guardada.
 * Al cambiar cualquier archivo del repositorio, incrementá VERSION.
 */
const VERSION = 'v1';
const CACHE = 'finanzas-shell-' + VERSION;
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // nunca tocar otros dominios
  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error());
        });
      })
  );
});

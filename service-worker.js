const CACHE_NAME = 'lega-convidados-evento-20260718-v5-colunas-excel';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './firebase-config.js',
  './icon-192.png',
  './icon-512.png',
  './logo-lega.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Navegações: nunca guardar resposta de imagem/arquivo com a chave do index.
  // Usa a internet primeiro e somente recorre ao index já validado quando offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => response)
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('./index.html')) || Response.error();
        })
    );
    return;
  }

  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Arquivos locais do aplicativo: cache primeiro, atualização em segundo plano.
  if (sameOrigin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        const networkPromise = fetch(event.request).then(response => {
          if (response && response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => null);
        return cached || (await networkPromise) || Response.error();
      })
    );
    return;
  }

  // Bibliotecas e Firebase externos: rede primeiro; cache apenas pela URL original.
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok) {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

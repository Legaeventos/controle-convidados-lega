// Limpador temporário de service workers antigos.
// Evita que uma versão armazenada abra PNG/IHDR no lugar do aplicativo.
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      try { client.navigate(client.url); } catch (_) {}
    }
  })());
});

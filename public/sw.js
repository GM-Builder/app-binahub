// Cleanup worker for the retired cache-first PWA implementation.
// The previous worker cached every page and JavaScript chunk indefinitely,
// which could keep an old deployment visible after a successful release.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith("binahub-"))
        .map((name) => caches.delete(name)),
    );
    await self.registration.unregister();
    await self.clients.claim();

    const clients = await self.clients.matchAll({ type: "window" });
    await Promise.all(clients.map((client) => client.navigate(client.url)));
  })());
});

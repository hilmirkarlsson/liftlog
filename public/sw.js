// Kill-switch for the v1 service worker. The old worker cache-first served
// the pre-rebuild app shell, which breaks (blank page) now that those files
// are gone. Browsers re-check sw.js on navigation, so this replaces the old
// worker, wipes its caches, unregisters, and reloads open pages so they come
// straight from the network. The rebuilt app intentionally registers no
// service worker, so this runs once per device and then disappears.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })()
  );
});

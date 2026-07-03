const CACHE = 'liftlog-shell-v1';
const SHELL = [
  './', './index.html', './css/styles.css', './manifest.webmanifest',
  './js/main.js', './js/dom.js', './js/util.js', './js/state.js', './js/storage.js', './js/sync.js', './js/modal.js',
  './js/views/log.js', './js/views/history.js', './js/views/progress.js', './js/views/settings.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

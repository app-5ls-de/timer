const CACHE = "static-cache-v1";
const precacheFiles = [
  '/',
  '/index.html',
  '/main.css',
  '/main.js',
  '/moment.min.js',
  '/manifest.json',
  '/favicon.ico'
];

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
  console.log("[PWA Builder] Claiming clients for current page");
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  event.waitUntil(self.clients.claim());
});
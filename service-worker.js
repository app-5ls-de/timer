importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.2.4/workbox-sw.js"
);
const { registerRoute, setDefaultHandler } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst } = workbox.strategies;
const { cacheNames, setCacheNameDetails } = workbox.core;

setCacheNameDetails({ suffix: "v2" });

registerRoute(new RegExp("\\.(json|svg|png|mp3|woff2?)$"), new CacheFirst());

registerRoute(
  ({ url }) => url.origin == location.origin,
  new StaleWhileRevalidate()
);

registerRoute(
  ({ url }) => url.origin == "https://cdn.jsdelivr.net",
  new CacheFirst()
);

self.addEventListener("activate", (event) => {
  const cacheNamesArray = Object.values(cacheNames);
  event.waitUntil(
    caches.keys().then((userCacheNames) =>
      Promise.all(
        userCacheNames.map((cacheName) => {
          if (!cacheNamesArray.includes(cacheName))
            return caches.delete(cacheName);
        })
      )
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      //event.notification.close();
      if (clients.length) {
        // check if at least one tab is already open
        let client = clients[0];
        if ("focus" in client) {
          client.focus();
        }
      } else {
        self.clients.openWindow("/");
      }
    })
  );
});

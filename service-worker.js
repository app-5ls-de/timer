importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.2.4/workbox-sw.js"
);
const { registerRoute, setDefaultHandler } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst } = workbox.strategies;
const { setCacheNameDetails } = workbox.core;

setCacheNameDetails({
  suffix: "v1",
});

registerRoute(
  ({ url }) => url.origin == location.origin,
  new StaleWhileRevalidate()
);

registerRoute(
  ({ url }) => url.origin == "https://cdn.jsdelivr.net",
  new CacheFirst()
);

self.addEventListener("install", (event) => {
  const urls = [
    "/",
    "/main.js",
    "/index.html",
    "/manifest.json",
    "/fonts/courier-prime-v1-latin-regular.woff",
    "/fonts/courier-prime-v1-latin-regular.woff2",
    "https://cdn.jsdelivr.net/npm/dayjs@1.10.6/dayjs.min.js",
    "https://cdn.jsdelivr.net/npm/dayjs@1.10.6/plugin/duration.js",
  ];
  const cacheName = cacheNames.runtime;
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(urls)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async function () {
      const userCacheNames = await caches.keys();
      const cacheNamesArray = Object.values(cacheNames);
      await Promise.all(
        userCacheNames.map(async (cacheName) => {
          if (!cacheNamesArray.includes(cacheName)) {
            return await caches.delete(cacheName);
          }
          return await Promise.resolve();
        })
      );
    })()
  );
});

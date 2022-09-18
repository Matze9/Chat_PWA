const VERSION = 8;
const ASSETS_CACHE_PREFIX = "pwa-assets";
const ASSETS_CACHE_NAME = `${ASSETS_CACHE_PREFIX}-${VERSION}`;
const ASSET_URLS = [
  "/",
  //  "css/styles.css",
  // "index.js",
  "css/materialize.min.css",
  "/images/daniel.jpg",
  "/images/manuel.jpg",
  "/images/guenther.jpg",
  "/images/franz.jpg",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(ASSETS_CACHE_NAME).then((cache) => cache.addAll(ASSET_URLS))
  );
  console.log("Service Worker was installed -- note from the worker");
});

self.addEventListener("fetch", function (event) {
  console.log("Fetch Something from url: ", event.request);

  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => cachedResponse || fetch(event.request))
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      const keys = await caches.keys();

      return Promise.all(
        keys.map((key) => {
          if (
            key.startsWith(ASSETS_CACHE_PREFIX) &&
            key !== ASSETS_CACHE_NAME
          ) {
            return caches.delete(key);
          }
        })
      );
    })()
  );
});

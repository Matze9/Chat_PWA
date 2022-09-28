import { manifest, version } from "@parcel/service-worker";

const VERSION = 21;
const ASSETS_CACHE_PREFIX = "pwa-assets";
const ASSETS_CACHE_NAME = `${ASSETS_CACHE_PREFIX}-${VERSION}`;
const ASSET_URLS = ["/", ...manifest];

async function install() {
  const cache = await caches.open(ASSETS_CACHE_NAME);
  await cache.addAll(ASSET_URLS);
}
addEventListener("install", (e) => e.waitUntil(install()));

self.addEventListener("fetch", function (event) {
  const { request } = event;
  const path = new URL(request.url).pathname;

  if (path.startsWith("/images")) {
    event.respondWith(
      caches.match(request).then((cacheResponse) => {
        return (
          cacheResponse ||
          fetch(request).then((networkResponse) => {
            return caches.open("images").then((cache) => {
              cache.put(request, networkResponse.clone());
              console.log("network response");
              return networkResponse;
            });
          })
        );
      })
    );
  }

  if (ASSET_URLS.includes(path)) {
    event.respondWith(
      caches.open(ASSETS_CACHE_NAME).then((cache) => cache.match(event.request))
    );
  }
});

// event.respondWith(
//   caches
//     .match(event.request)
//     .then((cachedResponse) => cachedResponse || fetch(event.request))
// );

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

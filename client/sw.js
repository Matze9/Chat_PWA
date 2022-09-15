import { manifest, version } from "@parcel/service-worker";

const VERSION1 = 6;
const ASSETS_CACHE_PREFIX = "pwa-assets";
const ASSETS_CACHE_NAME = `${ASSETS_CACHE_PREFIX}-${VERSION1}`;
const ASSET_URLS = ["/"];

self.addEventListener("install", function (event) {
  console.log("Install event");
  event.waitUntil(
    caches.open(ASSETS_CACHE_NAME).then((cache) => cache.addAll(ASSET_URLS))
  );
});

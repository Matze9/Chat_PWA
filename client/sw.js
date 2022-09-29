import { manifest, version } from "@parcel/service-worker";

const VERSION = version;
const ASSETS_CACHE_PREFIX = "pwa-assets";
const ASSETS_CACHE_NAME = `${ASSETS_CACHE_PREFIX}-${VERSION}`;
const ASSET_URLS = ["/", ...manifest];

async function install() {
  const cache = await caches.open(ASSETS_CACHE_NAME);
  await cache.addAll(ASSET_URLS);

  // Create IndexedDB
  const createIndexedDBPromise = new Promise((resolve, reject) => {
    resolve(() => {
      const request = indexedDB.open("ConvDB", 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objectStoreUsers = db.createObjectStore("users", {
          keyPath: "id",
        });
        const objectStoreConversations = db.createObjectStore("conversations", {
          keyPath: "id",
        });
      };

      request.onsuccess = (event) => {
        console.log("Upgrade successful!");
      };
    });
  });

  createIndexedDBPromise.then(() => {
    //Add users to Store
    fetch("http://[::1]:5000/users")
      .then((response) => response.json())
      .then((data) => {
        console.log("In SW after creating IndexedDB ", data);

        const openRequest = indexedDB.open("ConvDB", 1);

        openRequest.onsuccess = function () {
          const transaction = openRequest.result.transaction(
            "users",
            "readwrite"
          );
          const store = transaction.objectStore("users");
          const addRequest = store.add({
            id: "http://[::1]:5000/users",
            users: JSON.stringify(data),
          });

          addRequest.onsuccess = function () {
            console.log("Entry successfully added!");
          };

          addRequest.onerror = function () {
            console.log("Something went wrong!");
          };
        };
      });
  });
}
addEventListener("install", (e) => e.waitUntil(install()));

self.addEventListener("fetch", function (event) {
  const { request } = event;
  const path = new URL(request.url).pathname;

  // Cache First bei Images, Netzwerkanfragen zusätzlich im Cache ablegen
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

  //TODO: Nicht immer den Cache öffnen - erst fragen ob die App-Shell angefragt wird
  if (ASSET_URLS.includes(path)) {
    event.respondWith(
      caches.open(ASSETS_CACHE_NAME).then((cache) => cache.match(event.request))
    );
  }
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    // Bekommt ein Promise - Da die Übergebene Funktion gleich aufgerufen wird, ist ihr Rückgabewert der Übergebene Parameter
    async function () {
      const keys = await caches.keys();
      // Promise.All -> Alle Promises werden erst aufgelöst
      return Promise.all(
        keys.map((key) => {
          if (
            key.startsWith(ASSETS_CACHE_PREFIX) && //Damit kein Fremder Cache gelöscht wird - Nur AppShell
            key !== ASSETS_CACHE_NAME //Damit alle außer dem letzten gelöscht werden
          ) {
            return caches.delete(key); // Caches delete gibt Promise zurück
          }
        })
      );
    }
  );
});

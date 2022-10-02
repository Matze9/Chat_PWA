import { manifest, version } from "@parcel/service-worker";

const VERSION = version;
const ASSETS_CACHE_PREFIX = "pwa-assets";
const ASSETS_CACHE_NAME = `${ASSETS_CACHE_PREFIX}-${VERSION}`;
const ASSET_URLS = ["/", ...manifest];

const INDEXEDDB = "DB";

//-------------------------------------------------------INSTALL---------------------------------------------------------
async function install() {
  console.log("Install event");

  const cache = await caches.open(ASSETS_CACHE_NAME);
  await cache.addAll(ASSET_URLS);
}
addEventListener("install", (e) => e.waitUntil(install()));

//-------------------------------------------------------FETCH ----------------------------------------------------
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

              return networkResponse;
            });
          })
        );
      })
    );
  }

  //TODO: Network first bei laden von Conversations, Responses bei Erfolg zusätzlich in der IndexedDB ablegen. Wenn kein Netzwerk, Chats aus der DB laden.

  if (path.includes("/conversations") && request.method !== "POST") {
    var conversationID = path.split("/")[2];

    var p = new Promise(function (resolve, reject) {
      resolve(
        fetch(event.request.url).then((fetchedResponse) => {
          return fetchedResponse
            .json()
            .then((res) => {
              // Put loaded conversations in DB before returning them.
              const openRequest = indexedDB.open(INDEXEDDB, 1);
              var fetchedResponsecopy = res;
              openRequest.onsuccess = function () {
                const transaction = openRequest.result.transaction(
                  "conversations",
                  "readwrite"
                );
                const store = transaction.objectStore("conversations");
                const getRequest = store.put({
                  conversation: JSON.stringify(fetchedResponsecopy),
                  id: path,
                  something: "HE",
                });

                getRequest.onsuccess = function () {
                  //   console.log("Put conversation in DB - Success");
                };
              };

              openRequest.onerror = (event) => {
                console.log("ERROR", event);
              };
              return res;
            })
            .catch((err) => {
              // If no Internet - return conversations stored in the DB
              console.log("Fetching from Server failed!!!!!!!!!");
            });
        })
      );
    });

    event.respondWith(
      p
        .then((conversations) => {
          return new Response(JSON.stringify(conversations), {
            status: 200,
            statusText: "I am a custom service worker response!",
          });
        })
        .catch((err) => {
          console.log("Fetching failed, here should the indexDB be placed!");

          const responseWithIndexedDB = new Promise(function (resolve, reject) {
            const openRequest = indexedDB.open(INDEXEDDB, 1);

            openRequest.onsuccess = function () {
              const transaction = openRequest.result.transaction(
                "conversations",
                "readonly"
              );
              const store = transaction.objectStore("conversations");
              const getRequest = store.get(path);

              getRequest.onsuccess = function () {
                resolve(getRequest.result);
              };

              getRequest.onerror = function () {
                console.log(
                  "Something went wrong when loading Conversations from indexedDB!"
                );
              };
            };

            openRequest.onerror = (event) => {
              console.log("ERROR", event);
            };
          });

          return responseWithIndexedDB.then((res) => {
            console.log("I am goin to respond with: ", res.conversation);
            return new Response(res.conversation, {
              status: 200,
              statusText: "Get all users Response from the Service Worker!",
            });
          });
        })
    );
  }

  //TODO: User aus der indexedDB laden

  if (path.includes("/users")) {
    const loadUsersFromDB = new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(INDEXEDDB, 1);

      openRequest.onsuccess = function () {
        const transaction = openRequest.result.transaction("users", "readonly");
        const store = transaction.objectStore("users");
        const getRequest = store.get("http://[::1]:5000/users");

        getRequest.onsuccess = function () {
          resolve(getRequest.result);
        };

        getRequest.onerror = function () {
          console.log(
            "Something went wrong when loading users from indexedDB!"
          );
        };
      };

      openRequest.onerror = (event) => {
        console.log("ERROR", event);
      };
    });

    event.respondWith(
      loadUsersFromDB.then((users) => {
        return new Response(users.users, {
          status: 200,
          statusText: "Get all users Response from the Service Worker!",
        });
      })
    );
  }

  //TODO:: Conversations vom Günther auch in der DB lagern und mit Network first zurückgeben

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
    (async function () {
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
    })()
  );
});

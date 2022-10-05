import { manifest, version } from "@parcel/service-worker";

const VERSION = version;

const ASSETS_CACHE_PREFIX = "pwa-assets";
const ASSETS_CACHE_NAME = `${ASSETS_CACHE_PREFIX}-${VERSION}`;
const ASSET_URLS = [
  "/",
  ...manifest,
  // "/images/guenther.jpg",
  // "images/daniel.jpg",
  // "images/manuel.jpg",
];

const INDEXEDDB = "DB";
const DBVERSION = 2;
const USERSTORE = "users";
const CONVERSATIONSTORE = "conversations";

// Function to open or create IndexedDB
async function openDB(callback) {
  const openRequest = self.indexedDB.open(INDEXEDDB, DBVERSION);

  openRequest.onerror = function (event) {
    console.log(
      "Application isn't allowed to use IndexedDB?!" + event.target.errorCode
    );
  };

  // Create indexedDB if needed
  openRequest.onupgradeneeded = function (event) {
    db = event.target.result;

    if (!db.objectStoreNames.contains(USERSTORE)) {
      // if there's no store of, create a new object store
      db.createObjectStore(USERSTORE, { keyPath: "key" });

      //Add users to Store
      fetch("http://[::1]:5000/users")
        .then((response) => response.json())
        .then((data) => {
          openDB(() =>
            addToStore(
              "http://[::1]:5000/users",
              USERSTORE,
              JSON.stringify(data)
            )
          );
        })
        .catch((err) => {
          console.log("Failed to fetch users to add them to the store!", err);
        });
    }
    if (!db.objectStoreNames.contains(CONVERSATIONSTORE)) {
      // if there's no store, create a new object store
      db.createObjectStore(CONVERSATIONSTORE, { keyPath: "key" });

      //Add Günthers active conversations to Store
      fetch("http://[::1]:5000/conversations?user=guenther")
        .then((response) => response.json())
        .then((data) => {
          openDB(() =>
            addToStore(
              "http://[::1]:5000/conversations?user=guenther",
              CONVERSATIONSTORE,
              JSON.stringify(data)
            )
          );
        })
        .catch((err) => {
          console.log(
            "Failed to fetch Günthers last conversations to add them to the store!",
            err
          );
        });
    }
  };

  openRequest.onsuccess = function (event) {
    db = event.target.result;
    if (callback) {
      callback();
    }
  };
}

// Function to add entries into the IndexedDB
async function addToStore(key, storeName, value) {
  // start a transaction
  const transaction = db.transaction(storeName, "readwrite");

  // create an object store
  const store = transaction.objectStore(storeName);

  // add key and value to the store
  const request = store.put({ key: key, value: value });
  request.onsuccess = function () {};
  request.onerror = function () {
    console.log("Error did not save to store", request.error);
  };

  transaction.onerror = function (event) {
    console.log("trans failed", event);
  };
}

//Function to get data from Store
async function getFromStore(key, storeName, callback) {
  // start a transaction
  const transaction = db.transaction(storeName, "readwrite");
  // create an object store
  const store = transaction.objectStore(storeName);

  // get key and value from the store
  const request = store.get(key);

  request.onsuccess = function (event) {
    if (callback) {
      callback(event.target.result);
    }
  };
  request.onerror = function () {
    console.log("Error did not read to store", request.error);
  };

  transaction.onerror = function (event) {
    console.log("trans failed", event);
  };
}

//-------------------------------------------------------INSTALL---------------------------------------------------------
async function install() {
  openDB();

  const cache = await caches.open(ASSETS_CACHE_NAME);
  await cache.addAll(ASSET_URLS);
}
addEventListener("install", (e) => e.waitUntil(install()));

//-------------------------------------------------------FETCH ----------------------------------------------------
self.addEventListener("fetch", function (event) {
  const { request } = event;
  const path = new URL(request.url).pathname;

  // Cache first for images, also store networkrequests in Cache
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

  // Use network first approach to load conversations, also store the responses in the indexedDB.
  if (path.includes("/conversations") && request.method !== "POST") {
    var p = new Promise(function (resolve, reject) {
      fetch(event.request.url)
        .then((fetchedResponse) => {
          return fetchedResponse.json().then((res) => {
            if (res !== undefined) {
              openDB(() =>
                addToStore(request.url, CONVERSATIONSTORE, JSON.stringify(res))
              );
            }
            resolve(res);
          });
        })
        .catch((err) => {
          reject();
        });
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
          const responseWithIndexedDB = new Promise(function (resolve, reject) {
            getFromStore(request.url, CONVERSATIONSTORE, (conversationData) => {
              resolve(conversationData);
            });
          });

          return responseWithIndexedDB.then((res) => {
            return new Response(res.value, {
              status: 200,
              statusText: "Got conversations from the IndexedDB!",
            });
          });
        })
    );
  }

  //Load Users from indexedDB
  if (path.includes("/users")) {
    const loadUsersFromDB = new Promise((resolve, reject) => {
      openDB(() => {
        getFromStore("http://[::1]:5000/users", USERSTORE, (userData) => {
          resolve(userData.value);
        });
      });
    });

    event.respondWith(
      loadUsersFromDB
        .then((users) => {
          return new Response(users, {
            status: 200,
            statusText: "Get users from the indexedDB!",
          });
        })
        .catch((err) => {
          console.log("Error in Promise - get users! ", err);
        })
    );
  }

  // Response with ressources from the precache
  if (ASSET_URLS.includes(path)) {
    event.respondWith(
      caches.open(ASSETS_CACHE_NAME).then((cache) => cache.match(event.request))
    );
  }
});

//---------------------------------------------------ACTIVATE-----------------------------------
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
  event.waitUntil(self.clients.claim());
});

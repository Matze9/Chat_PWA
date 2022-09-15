if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(new URL("../../sw.js", import.meta.url), { type: "module" })
    .then((reg) => console.log("Service Worker registered!", reg))
    .catch((err) => console.log("No Service Worker registered!", err));
}

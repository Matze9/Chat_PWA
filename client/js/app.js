import { createBrowserHistory } from "https://unpkg.com/history/history.production.min.js";
let history = createBrowserHistory();
let location = history.location;

history.listen(({ action, location }) => {
  console.log(
    `The current URL is ${location.pathname}${location.search}${location.hash}`
  );
  console.log(`The last navigation action was ${action}`);
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(new URL("../sw.js", import.meta.url), { type: "module" })
    .then((reg) => console.log("Service Worker registered!", reg))
    .catch((err) => console.log("No Service Worker registered!", err));
}

console.log("got js");

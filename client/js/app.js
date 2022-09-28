import { createHashHistory } from "history";
let history = createHashHistory();
let location = history.location;

function loadConversation(conversationID) {
  fetch("/conversations/" + conversationID + "/messages")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("messageinputForm").hidden = false;

      var src = document.getElementById("conversationBoxScrollable");
      src.replaceChildren();

      data.forEach((message) => {
        addConversationBox(message.from, message.message);
      });
    });
}

var conversationID = location.pathname;
if (conversationID !== "/") {
  loadConversation(conversationID);
} else {
  //TODO: Load last chat from store
}

history.listen(({ action, location }) => {
  console.log(
    `The current URL is ${location.pathname}${location.search}${location.hash}`
  );

  console.log("Pathname:", location.pathname);
  var conversationID = location.pathname;
  loadConversation(conversationID);
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(new URL("../sw.js", import.meta.url), { type: "module" })
    .then((reg) => console.log("Service Worker registered!", reg))
    .catch((err) => console.log("No Service Worker registered!", err));
}

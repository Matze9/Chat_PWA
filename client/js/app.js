import { createHashHistory } from "history";
let history = createHashHistory();
let location = history.location;

//Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(new URL("../sw.js", import.meta.url), { type: "module" })
    .then((reg) => {
      console.log("Service Worker registered!", reg);
    })
    .catch((err) => console.log("No Service Worker registered!", err));
}

// Load Conversation
function loadConversation(conversationID) {
  fetch("/conversations/" + conversationID + "/messages")
    .then((response) => response.json())
    .then((data) => {
      var currentConversation = localStorage.getItem("lastConv");
      var inactive = document.getElementById("ID:" + currentConversation);
      if (inactive !== null) {
        inactive.className = "section contactCard";
      }

      localStorage.setItem("lastConv", conversationID);

      var active = document.getElementById("ID:" + conversationID);
      if (active !== null) {
        active.classList.add("activeChat");
      }
      localStorage.setItem("lastConv", conversationID);

      document.getElementById("messageinputForm").hidden = false;

      var src = document.getElementById("conversationBoxScrollable");
      src.replaceChildren();

      data.forEach((message) => {
        addConversationBox(message.from, message.message);
      });
    })
    .catch((err) => {
      console.log("Loading conversations failed!", err);
    });
}

var conversationID = location.pathname;
if (conversationID !== "/") {
  loadConversation(conversationID);
} else {
  //Load last chat from the local storage
  var lastChat = localStorage.getItem("lastConv");
  if (lastChat !== null && lastChat !== "-1") {
    var currentUrl = window.location.href;
    window.location.href = currentUrl + "#" + lastChat;
    loadConversation(lastChat);
  }
}

history.listen(({ action, location }) => {
  var conversationID = location.pathname;
  loadConversation(conversationID);
});

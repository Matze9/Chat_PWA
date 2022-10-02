function user(username, fullname, image, conversationID) {
  this.username = username;
  this.fullname = fullname;
  this.image = image;
  this.conversationID = conversationID;
}

function conversation(id, participants) {
  this.id = id;
  this.participants = participants;
}

var activeConversations = [];
var currentConversationID;
var currentUser;

this.currentUser = new user(
  "guenther",
  "Günther Jauch",
  "/images/guenther.jpg",
  0
);

const INDEXEDDB = "DB";

// -------------------------------CREATE DB----
const req = indexedDB.open(INDEXEDDB, 1);

req.onupgradeneeded = (event) => {
  console.log("Create DB");
  const db = event.target.result;
  console.log("create Users Object store!");
  db.createObjectStore("users", {
    keyPath: "id",
  });
  const objectStoreConversations = db.createObjectStore("conversations", {
    keyPath: "id",
  });

  //Add users to Store
  fetch("http://[::1]:5000/users")
    .then((response) => response.json())
    .then((data) => {
      console.log("Add users to DB ", data);

      const openRequest = indexedDB.open(INDEXEDDB, 1);

      openRequest.onsuccess = function () {
        const transaction = openRequest.result.transaction(
          "users",
          "readwrite"
        );
        const store = transaction.objectStore("users");
        const addRequest = store.put({
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
};

// ----------------------------DB CEATED

// const request = indexedDB.open(INDEXEDDB, 1);

// request.onupgradeneeded = (event) => {
//   const db = event.target.result;
//   db.createObjectStore("users", {
//     keyPath: "id",
//   });
//   const objectStoreConversations = db.createObjectStore("conversations", {
//     keyPath: "id",
//   });

//   //Add users to Store
//   fetch("http://[::1]:5000/users")
//     .then((response) => response.json())
//     .then((data) => {
//       const openRequest = indexedDB.open(INDEXEDDB, 1);

//       openRequest.onsuccess = function () {
//         const transaction = openRequest.result.transaction(
//           "users",
//           "readwrite"
//         );
//         const store = transaction.objectStore("users");
//         const addRequest = store.put({
//           id: "http://[::1]:5000/users",
//           users: JSON.stringify(data),
//         });

//         addRequest.onsuccess = function () {
//           console.log("Entry successfully added!");
//         };

//         addRequest.onerror = function () {
//           console.log("Something went wrong!");
//         };
//       };
//     });
// };

// request.onsuccess = (event) => {
//   console.log("Upgrade successful!");
// };

// Load current user to DOM
// document.getElementById("currentUserName").textContent = currentUser.username;

var currentUserImg = document.createElement("img");
currentUserImg.src = currentUser.image;
currentUserImg.className = "circle responsive-img currentUserImage";
var src = document.getElementById("currentUserImageContainer");
src.appendChild(currentUserImg);

// Load active conversations of the user
fetch("http://[::1]:5000/conversations?user=guenther")
  .then((response) => response.json())
  .then((data) => {
    var activeConversationUsers = [];
    data.forEach((conv) => {
      activeConversations.push(new conversation(conv.id, conv.participants));
      conv.participants.forEach((participant) => {
        activeConversationUsers.push(participant);
      });
    });

    //debugger;
    fetch("http://[::1]:5000/users")
      .then((response) => response.json())
      .then((data) => {
        console.log("The data http://[::1]:5000/users got: ", data);

        data.forEach((user) => {
          var conversationID;
          activeConversations.forEach((conv) => {
            if (conv.participants.includes(user.username)) {
              conversationID = conv.id;
            }
          });

          // Render active conversations to the screen
          if (
            user.username !== currentUser.username &&
            activeConversationUsers.includes(user.username)
          ) {
            var contactCard = document.createElement("a");
            contactCard.className = "section contactCard";
            contactCard.href = "#" + conversationID;

            var divider = document.createElement("div");
            divider.className = "divider";

            var contactName = document.createElement("div");
            contactName.textContent = user.username;

            var img = document.createElement("img");
            img.src = user.image;
            img.className = "circle responsive-img thumbnailImage";
            var src = document.getElementById("images");

            contactCard.appendChild(img);
            contactCard.appendChild(contactName);
            contactCard.appendChild(divider);

            src.appendChild(contactCard);
          }
        });
      });
  })
  .catch((err) => console.log("Failed to fetch users: ", err));

// Function to Load specific conversation
// function getConversationByContactName(contactName) {
//   var conversationID;

//   activeConversations.forEach((conv) => {
//     if (conv.participants.includes(contactName)) {
//       conversationID = conv.id;
//       currentConversationID = conv.id;
//     }
//   });

//   fetch("/conversations/" + conversationID + "/messages")
//     .then((response) => response.json())
//     .then((data) => {
//       document.getElementById("messageinputForm").hidden = false;

//       var src = document.getElementById("conversationBoxScrollable");
//       src.replaceChildren();

//       data.forEach((message) => {
//         addConversationBox(message.from, message.message);
//       });
//     });
// }

// Function to send message in conversation
function sendMessage() {
  var messageText = document.getElementById("textToSend").value;

  var currentConversationID = document.URL.split("#")[1];

  const data = { from: currentUser.username, message: messageText };

  fetch("/conversations/" + currentConversationID + "/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      addConversationBox(data.from, data.message, "black", "white");
    })
    .catch((error) => {
      console.error("Error:", error);
      addConversationBox(
        "Caution!",
        "You have no internet connection :(",
        "white",
        "red"
      );
    });
}

function addConversationBox(from, message, fontcolor, boxColor) {
  var src = document.getElementById("conversationBoxScrollable");

  var messageBox = document.createElement("div");
  messageBox.className = "singleMessageBox";
  messageBox.style.color = fontcolor;
  messageBox.style.backgroundColor = boxColor;

  var messageHeader = document.createElement("div");
  messageHeader.textContent = from;
  messageBox.appendChild(messageHeader);

  var messageBody = document.createElement("div");
  messageBody.textContent = message;
  messageBox.appendChild(messageBody);

  src.appendChild(messageBox);

  src.scrollTop = src.scrollHeight;
}

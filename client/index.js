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

function contactCardClickedHandler() {
  console.log("ONCLICK");
}

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

    fetch("http://[::1]:5000/users")
      .then((response) => response.json())
      .then((data) => {
        data.forEach((user) => {
          console.log("active convers", activeConversations);

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
  .catch((err) => console.log("Failed to fetch active conversations", err));

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
  console.log("URL: ", document.URL);

  var currentConversationID = document.URL.split("#")[1];

  const data = { from: currentUser.username, message: messageText };

  console.log("Data to send ", data);

  fetch("/conversations/" + currentConversationID + "/messages", {
    method: "POST", // or 'PUT'
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      addConversationBox(data.from, data.message);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function addConversationBox(from, message) {
  var src = document.getElementById("conversationBoxScrollable");

  var messageBox = document.createElement("div");
  messageBox.className = "singleMessageBox";

  var messageHeader = document.createElement("div");
  messageHeader.textContent = from;
  messageBox.appendChild(messageHeader);

  var messageBody = document.createElement("div");
  messageBody.textContent = message;
  messageBox.appendChild(messageBody);

  src.appendChild(messageBox);

  src.scrollTop = src.scrollHeight;
}

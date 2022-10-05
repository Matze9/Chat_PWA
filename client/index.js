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

var currentUserImg = document.createElement("img");
currentUserImg.src = currentUser.image;
currentUserImg.className = "circle responsive-img currentUserImage";
var src = document.getElementById("currentUserImageContainer");
src.appendChild(currentUserImg);

window.onload = function () {
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

              contactCard.id = "ID:" + conversationID;

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
};

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
      addConversationBox(data.from, data.message);
    })
    .catch((error) => {
      console.error("Error:", error);
      addConversationBox(
        "Caution!",
        "You have no internet connection :(",
        "white",
        "#bf5c32"
      );
    });
}

// Generate conversationbox
function addConversationBox(from, message, fontcolor, boxColor) {
  var src = document.getElementById("conversationBoxScrollable");
  var messageBoxContainer = document.createElement("div");
  messageBoxContainer.className = "messageBox";

  var messageBox = document.createElement("div");
  if (from === currentUser.username) {
    messageBox.className = "speech-bubble-right";
    messageBoxContainer.style.justifyContent = "flex-end";
  } else if (from === "Caution!") {
    messageBox.className = "singleMessageBox";
  } else {
    messageBox.className = "speech-bubble-left";
  }

  if (boxColor !== undefined && fontcolor !== undefined) {
    messageBox.style.color = fontcolor;
    messageBox.style.backgroundColor = boxColor;
  }

  var messageHeader = document.createElement("div");
  messageHeader.textContent = from;
  messageBox.appendChild(messageHeader);

  var messageBody = document.createElement("div");
  messageBody.textContent = message;
  messageBox.appendChild(messageBody);

  messageBoxContainer.appendChild(messageBox);
  src.appendChild(messageBoxContainer);

  src.scrollTop = src.scrollHeight;
}

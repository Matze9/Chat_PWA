function user(username, fullname, image) {
  this.username = username;
  this.fullname = fullname;
  this.image = image;
}

function conversation(id, participants) {
  this.id = id;
  this.participants = participants;
}

var activeConversations = [];

window.onload = function () {
  let currentUser = new user(
    "guenther",
    "Günther Jauch",
    "/images/guenther.jpg"
  );

  // Load current user to DOM
  document.getElementById("currentUserName").textContent = currentUser.username;

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
            if (
              user.username !== currentUser.username &&
              activeConversationUsers.includes(user.username)
            ) {
              var contactCard = document.createElement("div");
              contactCard.className = "contactCard";

              var contactName = document.createElement("div");
              contactName.textContent = user.username;

              var img = document.createElement("img");
              img.src = user.image;
              img.className = "circle responsive-img thumbnailImage";
              var src = document.getElementById("images");

              contactCard.appendChild(img);
              contactCard.appendChild(contactName);
              contactCard.onclick = function () {
                getConversationByContactName(user.username);
              };
              src.appendChild(contactCard);
            }
          });
        });
    });

  // Load specific conversation
  function getConversationByContactName(contactName) {
    var conversationID;

    activeConversations.forEach((conv) => {
      if (conv.participants.includes(contactName)) {
        conversationID = conv.id;
      }
    });

    fetch("/conversations/" + conversationID + "/messages")
      .then((response) => response.json())
      .then((data) => {
        var src = document.getElementById("conversationBoxScrollable");
        src.replaceChildren();

        data.forEach((message) => {
          var messageBox = document.createElement("div");
          messageBox.className = "singleMessageBox";

          var messageHeader = document.createElement("div");
          messageHeader.textContent = message.from;
          messageBox.appendChild(messageHeader);

          var messageBody = document.createElement("div");
          messageBody.textContent = message.message;
          messageBox.appendChild(messageBody);

          src.appendChild(messageBox);

          document.getElementById("messageinputForm").hidden = false;
        });
      });
  }
};

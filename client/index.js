function getUsers() {
  console.log("GET USERS");
  fetch("http://[::1]:5000/users")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((user) => {
        var img = document.createElement("img");
        img.src = user.image;
        img.className = "circle responsive-img thumbnailImage";
        var src = document.getElementById("images");
        src.appendChild(img);
      });
      console.log(data);
    });
}

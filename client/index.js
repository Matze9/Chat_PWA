function getUsers() {
  console.log("GET USERS");
  fetch("http://[::1]:5000/users")
    .then((response) => response.json())
    .then((data) => console.log(data));
}

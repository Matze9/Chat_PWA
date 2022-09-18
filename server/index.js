const fastify = require("fastify")({
  logger: true,
});

const path = require("path");

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "..", "client"),
  decorateReply: false,
});

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "images"),
  prefix: "/images",
  decorateReply: false,
});

const users = [
  {
    username: "daniel",
    fullname: "Daniel Craig",
    image: "/images/daniel.jpg",
  },
  {
    username: "manuel",
    fullname: "Manuel Neuer",
    image: "/images/manuel.jpg",
  },
  {
    username: "guenther",
    fullname: "Günther Jauch",
    image: "/images/guenther.jpg",
  },
  {
    username: "franz",
    fullname: "Franz Kafka",
    image: "/images/franz.jpg",
  },
];

const conversations = [
  {
    id: 1,
    participants: ["daniel", "guenther"],
    messages: [
      { from: "daniel", message: "Hello Günther!" },
      { from: "guenther", message: "Hello Daniel!" },
    ],
  },
  {
    id: 2,
    participants: ["daniel", "manuel"],
    messages: [
      { from: "daniel", message: "Hello Manuel!" },
      { from: "manuel", message: "Hello Daniel!" },
    ],
  },
  {
    id: 3,
    participants: ["manuel", "guenther"],
    messages: [
      { from: "guenther", message: "Hello Manuel!" },
      { from: "manuel", message: "Hello Günther!" },
    ],
  },
  {
    id: 4,
    participants: ["daniel", "franz"],
    messages: [
      { from: "daniel", message: "Hello Franz!" },
      { from: "franz", message: "Hello Daniel!" },
    ],
  },
];

fastify.get("/users", function (request, reply) {
  reply.send(users);
});

fastify.get("/conversations", function (request, reply) {
  const { user } = request.query;

  reply.send(
    conversations
      .filter(({ participants }) => !user || participants.includes(user))
      .map(({ id, participants }) => ({ id, participants }))
  );
});

fastify.get("/conversations/:id/messages", function (request, reply) {
  const conversation = findConversation(request.params.id);

  if (!conversation) {
    reply.code(404).send();
    return;
  }

  reply.send(conversation.messages);
});

fastify.post("/conversations/:id/messages", function (request, reply) {
  const conversation = findConversation(request.params.id);

  if (!conversation) {
    reply.code(404).send();
    return;
  }

  const { from, message } = request.body;

  if (!from || !message) {
    reply.code(400).send();
    return;
  }

  const newMessage = { from, message };

  conversation.messages.push(newMessage);

  reply.send(newMessage);
});

function findConversation(id) {
  return conversations.find((conversation) => conversation.id == id);
}

fastify.listen({ port: 5000 });

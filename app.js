import "dotenv/config";

import fastifyFormbody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import Fastify from "fastify";

const app = Fastify();
app.register(fastifyFormbody);
app.register(fastifyWs);

const { HOSTNAME, PORT = 3000 } = process.env;

// ========================================
// Phone Number Webhooks
// ========================================
app.post("/incoming-call", (req, reply) => {
  console.log("/incoming-call", req.body);

  reply.type("text/xml").send(`\
<Response>
  <Connect>
    <ConversationRelay
      url="wss://${HOSTNAME}/relay"
      welcomeGreeting="Say something"
      transcriptionProvider="deepgram"
      speechModel="nova-3-general"
    />
  </Connect>
</Response>
`);
});

app.post("/call-status", (req, reply) => {
  console.log("/call-status", req.body);
  reply.status(200).send("done");
});

// ========================================
// Conversation Relay Websocket Handler
// ========================================
app.get("/relay", { websocket: true }, ({ socket }) => {
  console.log("/relay");

  socket.on("message", (data) => {
    try {
      var msg = JSON.parse(data);
    } catch (error) {
      console.error(error);
    }

    switch (msg.type) {
      case "setup":
        console.log("setup", msg);
        break;

      case "prompt":
        console.log("prompt", msg);

        break;

      case "interrupt":
        console.log("interrupt", msg);

        break;
    }
  });
});

// ========================================
// Start Server
// ========================================

app.listen({ port: PORT });
console.log(`Server running on http://localhost:${PORT}`);

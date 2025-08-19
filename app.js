import "dotenv/config";

import fastifyFormbody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import Fastify from "fastify";

let app = Fastify().register(fastifyFormbody).register(fastifyWs);

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
app.register((app) =>
  app.get("/relay", { websocket: true }, (ws) => {
    console.log("/relay");

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case "setup":
          console.log("setup", msg);
          break;

        case "prompt":
          console.log("prompt", msg);

          if (!msg.last) return;
          const action = { type: "token", text: msg.voicePrompt };
          ws.send(JSON.stringify(action));

          break;

        case "interrupt":
          console.log("interrupt", msg);
          break;
      }
    });
  }),
);

// ========================================
// Start Server
// ========================================

app.listen({ port: PORT });
console.log(`Server running on http://localhost:${PORT}`);

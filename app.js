import "dotenv/config";

import fastifyFormbody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import Fastify from "fastify";
import twilio from "twilio";

let app = Fastify().register(fastifyFormbody).register(fastifyWs);

const { HOSTNAME, PORT = 3000, ACCOUNT_SID, AUTH_TOKEN } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

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
          client
            .calls(msg.callSid)
            .recordings.create()
            .then(({ accountSid, sid }) =>
              console.log(
                "recording url: ",
                `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${sid}.mp3`,
              ),
            );
          break;

        case "prompt":
          if (!msg.last) return;
          const action = { type: "text", token: msg.voicePrompt, last: true };
          ws.send(JSON.stringify(action));

          break;

        case "interrupt":
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

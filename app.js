import "dotenv/config";

import fastifyFormbody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import Fastify from "fastify";
import twilio from "twilio";
import { log } from "./lib/logger.js";

let app = Fastify().register(fastifyFormbody).register(fastifyWs);

const { HOSTNAME, PORT = 3000, ACCOUNT_SID, AUTH_TOKEN } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// ========================================
// Phone Number Webhooks
// ========================================
app.post("/incoming-call", (req, reply) => {
  log.setActiveCallSid(req.body.CallSid);
  log.info(`incoming-call webhook ${req.body.CallSid}`);

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
  log.info(`status update ${req.body.CallStatus} ${req.body.CallSid}`);
  reply.status(200).send("done");
});

// ========================================
// Conversation Relay Websocket Handler
// ========================================
app.register((app) =>
  app.get("/relay", { websocket: true }, (ws) => {
    log.info("websocket connecting. wait to speak...");

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case "setup":
          client
            .calls(msg.callSid)
            .recordings.create()
            .then(({ accountSid, sid, startTime }) => {
              log.info(
                "recording url: ",
                `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${sid}.mp3`,
              );

              log.info(`session started at ${startTime}`);
            });
          break;

        case "prompt":
          if (!msg.last) return;
          log.info(`complete transcipt: ${msg.voicePrompt}`);

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

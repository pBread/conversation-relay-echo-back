import "dotenv/config";

import fastifyFormbody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import Fastify from "fastify";
import twilio from "twilio";
import { log } from "./lib/logger.js";

let app = Fastify().register(fastifyFormbody).register(fastifyWs);

const { HOSTNAME, PORT = 3000, ACCOUNT_SID, AUTH_TOKEN } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// Conversation Relay Configuration
// https://www.twilio.com/docs/voice/twiml/connect/conversationrelay#conversationrelay-attributes

const transcriptionProvider = "deepgram";
const speechModel = "nova-3-general";

const ttsProvider = "ElevenLabs";
const voice = "tnSpp4vdxKPjI9w0GnoV";

// ========================================
// Phone Number Webhooks
// ========================================
app.post("/incoming-call", (req, reply) => {
  log.setStart();
  log.setActiveCallSid(req.body.CallSid);
  log.info(`incoming-call webhook ${req.body.CallSid}`);

  reply.type("text/xml").send(`\
<Response>
  <Connect>
    <ConversationRelay
      url="wss://${HOSTNAME}/relay"
      welcomeGreeting="Say something"
      transcriptionProvider="${transcriptionProvider}"
      speechModel="${speechModel}"

      ttsProvider="${ttsProvider}"
      voice="${voice}"
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
              log.setStart(startTime);
              const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${sid}.mp3?RequestedChannels=2&Download=true`;
              log.info(`recording url: \x1b[32m ${url} \x1b[0m`);

              log.info(`session started at ${startTime.toISOString()}`);
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

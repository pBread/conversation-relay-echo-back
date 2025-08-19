# Conversation Relay Echo Back Benchmark

This project is a minimal Fastify + WebSocket server that integrates with **Twilio Conversation Relay**.
Its purpose is to **perform an echo‑back benchmark**: whatever you say during a call is transcribed, then echoed back as synthesized speech.

This simulates the **audio pipeline of a voice agent** and helps you observe the **latency of STT (speech‑to‑text), TTS (text‑to‑speech), and the voice network** end‑to‑end.

## Getting Started

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

- **HOSTNAME** — your **ngrok hostname** only. Example: `my-domain.ngrok-free.app`
- **ACCOUNT_SID** and **AUTH_TOKEN** — your Twilio credentials (used to start recordings).

### 2. Start Ngrok

You can try the helper script:

```bash
npm run grok
```

If it fails, just start ngrok normally in a separate terminal:

```bash
ngrok http 3000
```

Copy the hostname it prints (looks like `my-domain.ngrok-free.app`) into your `.env` as `HOSTNAME`.

### 3. Configure your Twilio Number

In the Twilio Console, set your phone number’s **Voice → A Call Comes In** webhook to your public URL:

```
https://<HOSTNAME>/incoming-call
```

For example:

```
https://my-domain.ngrok-free.app/incoming-call
```

### 4. Run It

Start the local server (with auto‑reload):

```bash
npm run dev
```

## Performing the Benchmark

### Perform a Call

1. **Call your Twilio number.**
2. **Speak a complete sentence**, then pause and wait.
   - Conversation Relay will send your transcript (`prompt`) to the server.
   - The server replies with a `text` token containing the same words.
   - Twilio speaks that text back to you. You’ll hear your own words after some delay.
3. Repeat a few times to get a feel for the end‑to‑end latency.

   > **Note on latency:** Some Conversation Relay speech models use **semantic endpointing**, which favors waiting for sentence boundaries before finalizing. That can increase latency—which is often desirable in real agents to avoid interrupting a user who is still speaking.

### Analyze the Turn Gap

Download the recording file. The URL should have been printed to your terminal.

Open the file in a tool like Audacity. Simply measure the gap between the speaking turns. That is your turn-gap latency.

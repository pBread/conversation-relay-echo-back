import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLogger, format, transports } from "winston";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.resolve(__dirname, "..", "logs");

fs.mkdirSync(logsDir, { recursive: true });

const makeFileTransport = (sid) =>
  new transports.File({
    filename: path.join(logsDir, `${sid ?? "server"}.log`),
    level: "info",
    maxsize: 10 * 1024 * 1024, // 10MB
  });

let start = Date.now();
const elapsed = () => {
  const time = Date.now() - start;

  const min = Math.floor(time / 60000);
  const sec = Math.floor((time % 60000) / 1000);
  const ms = time % 1000;

  return `${min}.${sec.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;
};

export const log = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: () => new Date().toISOString() }),
    format.printf((info) => `${info.timestamp} ${elapsed()} ${info.message}`),
  ),
  transports: [makeFileTransport(null), new transports.Console()],
});

log.info("HELLO");

log.setActiveCallSid = (callSid) => {
  start = Date.now();
  log.clear();
  log.add(makeFileTransport(callSid));
  log.add(new transports.Console());
};

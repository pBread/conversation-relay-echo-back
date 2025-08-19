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
    maxFiles: 5,
  });

export const log = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: () => new Date().toISOString() }),
    format.printf(
      (info) => `${info.timestamp} [${info.level}] ${info.message}`,
    ),
  ),
  transports: [makeFileTransport(null)],
});

export function setActiveCallSid(callSid) {
  log.clear();
  log.add(makeFileTransport(callSid));
}

import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import { requestContext } from "./requestContext.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, "../../logs");

const addRequestId = winston.format((info) => {
  const ctx = requestContext.getStore();
  info.requestId = ctx?.requestId ?? null;
  return info;
});

const formatLogsInOrder = winston.format((info) => {
  const ordered = {
    timestamp: info.timestamp,
    level: info.level,
    requestId: info.requestId,
    message: info.message,
    method: info.method,
    url: info.url,
    query: info.query,
    body: info.body,
    stack: info.stack,
  };

  info[Symbol.for("message")] = JSON.stringify(ordered);
  return info;
});

const logger = winston.createLogger({
  // GLOBAL LEVEL: Accept info + warn + error
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    addRequestId(),
    formatLogsInOrder(),
  ),

  transports: [
    // ERROR LOGS
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),

    // INFO + WARN + ERROR LOGS
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      level: "info",
    }),

    // CONSOLE LOGS (Only in dev)
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          return `[${info.level}] [${info.timestamp}] requestId=${info.requestId} ${info.message}`;
        }),
      ),
      silent: process.env.NODE_ENV === "production",
    }),
  ],
});

export default logger;

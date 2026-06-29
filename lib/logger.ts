import winston from "winston";

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: combine(
    errors({ stack: true }),
    timestamp(),
    process.env.NODE_ENV === "production" ? json() : combine(colorize(), simple())
  ),
  transports: [new winston.transports.Console()],
});

export default logger;

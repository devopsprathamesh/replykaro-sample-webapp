/**
 * Worker entrypoint — run separately from the Next.js web process.
 * Usage: npm run dev:worker
 */
import { startDmWorker } from "./dmWorker";
import logger from "@/lib/logger";

logger.info("[Startup] Starting ReplyKaro DM worker…");

const worker = startDmWorker();

async function shutdown(signal: string) {
  logger.info(`[Shutdown] Received ${signal}, closing worker…`);
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

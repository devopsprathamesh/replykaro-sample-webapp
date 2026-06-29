import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/security/encryption";
import { sendInstagramDM } from "@/lib/meta/instagram";
import { DM_QUEUE_NAME, type DmJobData } from "@/lib/queue/dmQueue";
import logger from "@/lib/logger";

function keywordMatches(comment: string, keyword: string): boolean {
  return comment
    .trim()
    .toLowerCase()
    .includes(keyword.trim().toLowerCase());
}

async function processDmJob(job: Job<DmJobData>): Promise<void> {
  const {
    commentId,
    commentText,
    commenterIgUserId,
    commenterUsername,
    mediaId,
    instagramAccountId,
    webhookTimestamp,
  } = job.data;

  logger.info("[Worker] Processing DM job", { commentId, jobId: job.id });

  // Idempotency — skip if already processed
  const existing = await prisma.automationLog.findFirst({
    where: { commentId, dmSent: true },
  });
  if (existing) {
    logger.info("[Worker] Skipping duplicate comment", { commentId });
    return;
  }

  const igAccount = await prisma.instagramAccount.findUnique({
    where: { id: instagramAccountId },
    include: { user: true },
  });

  if (!igAccount || !igAccount.isConnected) {
    logger.warn("[Worker] Instagram account not found or disconnected", { instagramAccountId });
    return;
  }

  const accessToken = decrypt(igAccount.accessTokenEncrypted);

  // Find matching active automation rule for this post
  const rules = await prisma.automationRule.findMany({
    where: {
      instagramAccountId,
      status: "ACTIVE",
      OR: [
        { instagramPost: { instagramMediaId: mediaId } },
        { instagramPostId: null }, // global rules
      ],
    },
  });

  let matchedRule = null;
  for (const rule of rules) {
    if (keywordMatches(commentText, rule.triggerKeyword)) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    // Log as skipped
    await prisma.automationLog.create({
      data: {
        userId: igAccount.userId,
        commentId,
        commentText,
        commenterUsername,
        commenterId: commenterIgUserId,
        postId: mediaId,
        status: "SKIPPED",
        processedAt: new Date(),
      },
    });
    logger.info("[Worker] No matching rule", { commentId, commentText });
    return;
  }

  const log = await prisma.automationLog.create({
    data: {
      userId: igAccount.userId,
      automationRuleId: matchedRule.id,
      commentId,
      commentText,
      commenterUsername,
      commenterId: commenterIgUserId,
      matchedKeyword: matchedRule.triggerKeyword,
      postId: mediaId,
      status: "PENDING",
    },
  });

  try {
    const result = await sendInstagramDM(
      commenterIgUserId,
      matchedRule.replyMessage,
      accessToken,
      igAccount.facebookPageId
    );

    await Promise.all([
      prisma.automationLog.update({
        where: { id: log.id },
        data: {
          dmSent: true,
          dmMessageId: result.message_id,
          status: "SUCCESS",
          processedAt: new Date(),
        },
      }),
      prisma.automationRule.update({
        where: { id: matchedRule.id },
        data: {
          matchCount: { increment: 1 },
          dmSentCount: { increment: 1 },
        },
      }),
    ]);

    logger.info("[Worker] DM sent successfully", {
      commentId,
      commenterUsername,
      messageId: result.message_id,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await prisma.automationLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        errorMessage: errorMsg,
        retryCount: { increment: 1 },
        processedAt: new Date(),
      },
    });
    logger.error("[Worker] Failed to send DM", { commentId, error: errorMsg });
    throw err; // Re-throw so BullMQ retries
  }
}

function getRedisConnection() {
  const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
  return {
    host: url.hostname,
    port: parseInt(url.port || "6379"),
    password: url.password || undefined,
  };
}

export function startDmWorker(): Worker<DmJobData> {
  const worker = new Worker<DmJobData>(DM_QUEUE_NAME, processDmJob, {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? "5"),
    limiter: {
      max: 10,
      duration: 1000,
    },
  });

  worker.on("completed", (job) => {
    logger.info("[Worker] Job completed", { jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("[Worker] Job failed", { jobId: job?.id, error: err.message });
  });

  worker.on("error", (err) => {
    logger.error("[Worker] Worker error", { error: err.message });
  });

  logger.info("[Worker] DM worker started");
  return worker;
}

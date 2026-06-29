import { NextRequest, NextResponse } from "next/server";
import { verifyMetaSignature } from "@/lib/security/webhook";
import { enqueueDmJob } from "@/lib/queue/dmQueue";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import type { WebhookCommentEntry } from "@/types";

// GET — Meta webhook verification challenge
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    logger.info("[Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn("[Webhook] Verification failed", { mode, token });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — Incoming webhook events
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    logger.warn("[Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Respond immediately — process async
  processWebhook(rawBody).catch((err) =>
    logger.error("[Webhook] Processing error", { error: String(err) })
  );

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

async function processWebhook(rawBody: string): Promise<void> {
  const body = JSON.parse(rawBody) as {
    object: string;
    entry: WebhookCommentEntry[];
  };

  if (body.object !== "instagram") return;

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field !== "comments") continue;

      const { id: commentId, text, from, media } = change.value;

      if (!commentId || !text || !from?.id || !media?.id) continue;

      // Find the IG account this comment belongs to
      const igPost = await prisma.instagramPost.findFirst({
        where: { instagramMediaId: media.id },
        include: { instagramAccount: true },
      });

      if (!igPost) {
        logger.warn("[Webhook] No post found for mediaId", { mediaId: media.id });
        continue;
      }

      logger.info("[Webhook] Queuing DM job", {
        commentId,
        commenter: from.username,
        mediaId: media.id,
      });

      await enqueueDmJob({
        commentId,
        commentText: text,
        commenterIgUserId: from.id,
        commenterUsername: from.username,
        mediaId: media.id,
        instagramAccountId: igPost.instagramAccount.id,
        webhookTimestamp: entry.time,
      });
    }
  }
}

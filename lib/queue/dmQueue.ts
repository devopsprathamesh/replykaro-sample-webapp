import { Queue } from "bullmq";

export interface DmJobData {
  commentId: string;
  commentText: string;
  commenterIgUserId: string;
  commenterUsername: string;
  mediaId: string;
  instagramAccountId: string;
  webhookTimestamp: number;
}

export const DM_QUEUE_NAME = "instagram-dm";

function getRedisConnection() {
  const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
  return {
    host: url.hostname,
    port: parseInt(url.port || "6379"),
    password: url.password || undefined,
  };
}

type DmQueue = Queue<DmJobData>;
let _queue: DmQueue | null = null;

export function getDmQueue(): DmQueue {
  if (!_queue) {
    _queue = new Queue(DM_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: parseInt(process.env.QUEUE_MAX_RETRIES ?? "3"),
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      },
    }) as DmQueue;
  }
  return _queue;
}

export async function enqueueDmJob(data: DmJobData): Promise<void> {
  const queue = getDmQueue();
  const jobId = `${data.commentId}-${data.instagramAccountId}`;
  await queue.add("send-dm", data, { jobId });
}

import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

export function getRedis(): IORedis {
  if (globalForRedis.redis) return globalForRedis.redis;

  const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
  }

  return redis;
}

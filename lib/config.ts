import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  FACEBOOK_CLIENT_ID: z.string().min(1),
  FACEBOOK_CLIENT_SECRET: z.string().min(1),
  META_APP_ID: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  META_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32),
  META_GRAPH_API_VERSION: z.string().default("v21.0"),
  META_GRAPH_API_BASE_URL: z.string().url().default("https://graph.facebook.com"),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  QUEUE_MAX_RETRIES: z.coerce.number().default(3),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const missing = Object.keys(errors).join(", ");
    throw new Error(`Invalid environment variables: ${missing}`);
  }
  return parsed.data;
}

// Lazy singleton — only throws at runtime if env is missing
let _env: Env | null = null;

export function getConfig(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

export const config = {
  get env() { return getConfig(); },
  meta: {
    get apiVersion() { return process.env.META_GRAPH_API_VERSION ?? "v21.0"; },
    get baseUrl() { return process.env.META_GRAPH_API_BASE_URL ?? "https://graph.facebook.com"; },
    get appId() { return process.env.META_APP_ID ?? ""; },
    get appSecret() { return process.env.META_APP_SECRET ?? ""; },
    get webhookVerifyToken() { return process.env.META_WEBHOOK_VERIFY_TOKEN ?? ""; },
  },
};

import logger from "@/lib/logger";

const BASE_URL = process.env.META_GRAPH_API_BASE_URL ?? "https://graph.facebook.com";
const API_VERSION = process.env.META_GRAPH_API_VERSION ?? "v21.0";

export class MetaApiError extends Error {
  constructor(
    public readonly code: number,
    public readonly subcode: number | undefined,
    message: string
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const url = new URL(`${BASE_URL}/${API_VERSION}/${path}`);
  if (accessToken) url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (json.error) {
    const err = json.error as { code: number; error_subcode?: number; message: string };
    logger.error("[MetaAPI] Error", { code: err.code, message: err.message, path });
    throw new MetaApiError(err.code, err.error_subcode, err.message);
  }

  return json as T;
}

export const metaClient = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: "GET" }, token),
  post: <T>(path: string, body: Record<string, unknown>, token?: string) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, token),
};

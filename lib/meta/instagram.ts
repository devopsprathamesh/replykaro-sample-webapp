import { metaClient } from "./client";
import type { MetaPost } from "@/types";

export async function getInstagramAccounts(userAccessToken: string) {
  const pages = await metaClient.get<{
    data: Array<{ id: string; name: string; access_token: string }>;
  }>("me/accounts?fields=id,name,access_token", userAccessToken);

  const results: Array<{
    pageId: string;
    pageName: string;
    instagramAccountId: string;
    instagramUsername: string;
    profilePictureUrl?: string;
    followersCount: number;
    pageAccessToken: string;
  }> = [];

  for (const page of pages.data) {
    try {
      const igData = await metaClient.get<{
        instagram_business_account?: {
          id: string;
          username: string;
          profile_picture_url?: string;
          followers_count?: number;
        };
      }>(
        `${page.id}?fields=instagram_business_account{id,username,profile_picture_url,followers_count}`,
        page.access_token
      );

      if (igData.instagram_business_account) {
        const ig = igData.instagram_business_account;
        results.push({
          pageId: page.id,
          pageName: page.name,
          instagramAccountId: ig.id,
          instagramUsername: ig.username,
          profilePictureUrl: ig.profile_picture_url,
          followersCount: ig.followers_count ?? 0,
          pageAccessToken: page.access_token,
        });
      }
    } catch {
      // Page may not have an IG account — skip
    }
  }

  return results;
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;

  return metaClient.get(
    `oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
  );
}

export async function getInstagramPosts(
  instagramAccountId: string,
  accessToken: string,
  limit = 20
): Promise<MetaPost[]> {
  const res = await metaClient.get<{
    data: MetaPost[];
    paging?: { cursors: { after: string } };
  }>(
    `${instagramAccountId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=${limit}`,
    accessToken
  );
  return res.data ?? [];
}

export async function sendInstagramDM(
  recipientIgUserId: string,
  message: string,
  pageAccessToken: string,
  pageId: string
): Promise<{ message_id: string; recipient_id: string }> {
  return metaClient.post(
    `${pageId}/messages`,
    {
      recipient: { id: recipientIgUserId },
      message: { text: message },
      messaging_type: "MESSAGE_TAG",
      tag: "HUMAN_AGENT",
    },
    pageAccessToken
  );
}

export async function getCommentDetails(
  commentId: string,
  accessToken: string
): Promise<{
  id: string;
  text: string;
  timestamp: string;
  from: { id: string; username: string };
  media: { id: string };
}> {
  return metaClient.get(
    `${commentId}?fields=id,text,timestamp,from,media`,
    accessToken
  );
}

export async function subscribeToWebhook(
  pageId: string,
  pageAccessToken: string
): Promise<{ success: boolean }> {
  return metaClient.post(
    `${pageId}/subscribed_apps`,
    { subscribed_fields: ["instagram_business_post_comment", "messages"] },
    pageAccessToken
  );
}

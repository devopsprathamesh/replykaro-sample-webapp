import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/security/encryption";
import {
  getInstagramAccounts,
  exchangeForLongLivedToken,
  getInstagramPosts,
  subscribeToWebhook,
} from "@/lib/meta/instagram";
import logger from "@/lib/logger";

export async function connectInstagramAccount(
  userId: string,
  shortLivedToken: string
) {
  const longLived = await exchangeForLongLivedToken(shortLivedToken);
  const accounts = await getInstagramAccounts(longLived.access_token);

  if (accounts.length === 0) {
    throw new Error(
      "No Instagram Business or Creator accounts found linked to your Facebook pages."
    );
  }

  const account = accounts[0];
  const expiresAt = new Date(Date.now() + longLived.expires_in * 1000);

  const igAccount = await prisma.instagramAccount.upsert({
    where: { userId },
    create: {
      userId,
      instagramUserId: account.instagramAccountId,
      instagramUsername: account.instagramUsername,
      facebookPageId: account.pageId,
      facebookPageName: account.pageName,
      accessTokenEncrypted: encrypt(longLived.access_token),
      tokenExpiresAt: expiresAt,
      profilePictureUrl: account.profilePictureUrl,
      followersCount: account.followersCount,
      isConnected: true,
    },
    update: {
      instagramUserId: account.instagramAccountId,
      instagramUsername: account.instagramUsername,
      facebookPageId: account.pageId,
      facebookPageName: account.pageName,
      accessTokenEncrypted: encrypt(longLived.access_token),
      tokenExpiresAt: expiresAt,
      profilePictureUrl: account.profilePictureUrl,
      followersCount: account.followersCount,
      isConnected: true,
    },
  });

  // Subscribe page to webhook
  try {
    await subscribeToWebhook(account.pageId, longLived.access_token);
    await prisma.instagramAccount.update({
      where: { id: igAccount.id },
      data: { webhookVerified: true },
    });
  } catch (err) {
    logger.warn("[InstagramService] Webhook subscription failed", { error: String(err) });
  }

  return igAccount;
}

export async function syncInstagramPosts(userId: string) {
  const igAccount = await prisma.instagramAccount.findUnique({
    where: { userId },
  });

  if (!igAccount) throw new Error("No Instagram account connected");

  const accessToken = decrypt(igAccount.accessTokenEncrypted);
  const posts = await getInstagramPosts(igAccount.instagramUserId, accessToken);

  const upsertOps = posts.map((post) =>
    prisma.instagramPost.upsert({
      where: { instagramMediaId: post.id },
      create: {
        instagramAccountId: igAccount.id,
        instagramMediaId: post.id,
        mediaType: post.media_type,
        mediaUrl: post.media_url,
        thumbnailUrl: post.thumbnail_url,
        permalink: post.permalink,
        caption: post.caption,
        timestamp: new Date(post.timestamp),
        likeCount: post.like_count ?? 0,
        commentsCount: post.comments_count ?? 0,
      },
      update: {
        likeCount: post.like_count ?? 0,
        commentsCount: post.comments_count ?? 0,
        caption: post.caption,
        mediaUrl: post.media_url,
        thumbnailUrl: post.thumbnail_url,
      },
    })
  );

  await prisma.$transaction(upsertOps);
  return posts.length;
}

export async function disconnectInstagramAccount(userId: string) {
  await prisma.instagramAccount.update({
    where: { userId },
    data: { isConnected: false },
  });
}

export async function getConnectedAccount(userId: string) {
  return prisma.instagramAccount.findUnique({
    where: { userId },
  });
}

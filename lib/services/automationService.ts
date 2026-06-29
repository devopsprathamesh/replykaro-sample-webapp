import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const createRuleSchema = z.object({
  instagramPostId: z.string().optional(),
  triggerKeyword: z.string().min(1).max(100).trim(),
  replyMessage: z.string().min(1).max(1000).trim(),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;

export async function createAutomationRule(userId: string, input: CreateRuleInput) {
  const igAccount = await prisma.instagramAccount.findUnique({ where: { userId } });
  if (!igAccount) throw new Error("No Instagram account connected");

  return prisma.automationRule.create({
    data: {
      userId,
      instagramAccountId: igAccount.id,
      instagramPostId: input.instagramPostId ?? null,
      triggerKeyword: input.triggerKeyword,
      replyMessage: input.replyMessage,
      status: "ACTIVE",
    },
    include: { instagramPost: true },
  });
}

export async function updateAutomationRule(
  userId: string,
  ruleId: string,
  input: Partial<CreateRuleInput & { status: "ACTIVE" | "INACTIVE" }>
) {
  return prisma.automationRule.update({
    where: { id: ruleId, userId },
    data: {
      triggerKeyword: input.triggerKeyword,
      replyMessage: input.replyMessage,
      status: input.status,
    },
    include: { instagramPost: true },
  });
}

export async function deleteAutomationRule(userId: string, ruleId: string) {
  return prisma.automationRule.delete({
    where: { id: ruleId, userId },
  });
}

export async function listAutomationRules(userId: string) {
  return prisma.automationRule.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { instagramPost: true },
  });
}

export async function getDashboardStats(userId: string) {
  const igAccount = await prisma.instagramAccount.findUnique({ where: { userId } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeAutomations, messagesSentToday, totalAutomations] = await Promise.all([
    prisma.automationRule.count({ where: { userId, status: "ACTIVE" } }),
    prisma.automationLog.count({
      where: { userId, dmSent: true, createdAt: { gte: today } },
    }),
    prisma.automationRule.count({ where: { userId } }),
  ]);

  return {
    connectedAccount: !!igAccount?.isConnected,
    activeAutomations,
    messagesSentToday,
    totalAutomations,
    instagramAccount: igAccount,
  };
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncInstagramPosts } from "@/lib/services/instagramService";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const sync = searchParams.get("sync") === "true";

  if (sync) {
    try {
      await syncInstagramPosts(session.user.id);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Sync failed" },
        { status: 400 }
      );
    }
  }

  const igAccount = await prisma.instagramAccount.findUnique({
    where: { userId: session.user.id },
  });

  if (!igAccount) {
    return NextResponse.json({ data: [] });
  }

  const posts = await prisma.instagramPost.findMany({
    where: { instagramAccountId: igAccount.id },
    orderBy: { timestamp: "desc" },
    include: {
      automationRules: {
        where: { status: "ACTIVE" },
        select: { id: true, triggerKeyword: true },
      },
    },
  });

  return NextResponse.json({ data: posts });
}

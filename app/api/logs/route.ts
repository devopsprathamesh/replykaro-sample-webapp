import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const status = searchParams.get("status");

  const where = {
    userId: session.user.id,
    ...(status ? { status: status as "SUCCESS" | "FAILED" | "PENDING" | "SKIPPED" } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.automationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        automationRule: {
          select: { triggerKeyword: true, replyMessage: true },
        },
      },
    }),
    prisma.automationLog.count({ where }),
  ]);

  return NextResponse.json({
    data: logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listAutomationRules,
  createAutomationRule,
  createRuleSchema,
} from "@/lib/services/automationService";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await listAutomationRules(session.user.id);
  return NextResponse.json({ data: rules });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createRuleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const rule = await createAutomationRule(session.user.id, parsed.data);
    return NextResponse.json({ data: rule }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create rule" },
      { status: 400 }
    );
  }
}

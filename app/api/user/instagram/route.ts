import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  connectInstagramAccount,
  disconnectInstagramAccount,
  getConnectedAccount,
} from "@/lib/services/instagramService";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await getConnectedAccount(session.user.id);
  return NextResponse.json({ data: account });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accessToken } = await req.json();
  if (!accessToken) {
    return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
  }

  try {
    const account = await connectInstagramAccount(session.user.id, accessToken);
    return NextResponse.json({ data: account });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connection failed" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await disconnectInstagramAccount(session.user.id);
  return NextResponse.json({ message: "Disconnected" });
}

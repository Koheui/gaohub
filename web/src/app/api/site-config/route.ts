import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") ?? "oka";

  const db = adminDb();
  const snap = await db.doc(`siteConfigs/${username}`).get();
  if (!snap.exists) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({ config: snap.data() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = body.username ?? "oka";

    const db = adminDb();
    await db.doc(`siteConfigs/${username}`).set(
      {
        ...body,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "保存に失敗しました" },
      { status: 500 }
    );
  }
}

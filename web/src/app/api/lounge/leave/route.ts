import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyLoungeAccess } from "@/lib/server/lounge";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** ラウンジから退出する。プロフィールを完全に削除する(一覧から即時に消える)。 */
export async function POST(req: NextRequest) {
  let body: { registrationId?: string; k?: string };
  try {
    body = await req.json();
  } catch {
    return bad("不正なリクエストです");
  }

  const result = await verifyLoungeAccess(body.registrationId, body.k);
  if (!("ok" in result)) return bad(result.error, result.status);
  const { auth } = result;

  await adminDb().doc(`events/${auth.eventId}/loungeProfiles/${auth.registrationId}`).delete();

  return NextResponse.json({ ok: true });
}

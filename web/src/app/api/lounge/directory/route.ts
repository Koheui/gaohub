import { NextRequest, NextResponse } from "next/server";
import { getLoungeEntries, getLoungeSpeakers, verifyLoungeAccess } from "@/lib/server/lounge";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * 確定チケット保有者なら誰でも閲覧可(自分がまだ参加していなくても可)。
 * 参加者・登壇者ともメールアドレスは含めない(登壇者は連絡可否フラグのみ)。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const registrationId = searchParams.get("registrationId") ?? undefined;
  const k = searchParams.get("k") ?? undefined;

  const result = await verifyLoungeAccess(registrationId, k);
  if (!("ok" in result)) return bad(result.error, result.status);
  const { auth } = result;

  const [entries, speakers] = await Promise.all([
    getLoungeEntries(auth.eventId),
    getLoungeSpeakers(auth.eventId),
  ]);
  const selfProfile = entries.find((e) => e.registrationId === auth.registrationId) ?? null;

  return NextResponse.json({ ok: true, entries, speakers, selfProfile });
}

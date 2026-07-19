import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyLoungeAccess } from "@/lib/server/lounge";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export interface LoungeDirectoryEntry {
  registrationId: string;
  name: string;
  company: string;
  jobTitle: string;
  category: string;
  bio: string;
}

/** 確定チケット保有者なら誰でも閲覧可(自分がまだ参加していなくても可)。メールアドレスは含めない。 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const registrationId = searchParams.get("registrationId") ?? undefined;
  const k = searchParams.get("k") ?? undefined;

  const result = await verifyLoungeAccess(registrationId, k);
  if (!("ok" in result)) return bad(result.error, result.status);
  const { auth } = result;

  const snap = await adminDb()
    .collection(`events/${auth.eventId}/loungeProfiles`)
    .orderBy("createdAt", "asc")
    .get();

  const entries: LoungeDirectoryEntry[] = snap.docs.map((d) => ({
    registrationId: d.id,
    name: d.get("name") ?? "",
    company: d.get("company") ?? "",
    jobTitle: d.get("jobTitle") ?? "",
    category: d.get("category") ?? "",
    bio: d.get("bio") ?? "",
  }));

  const selfProfile = entries.find((e) => e.registrationId === auth.registrationId) ?? null;

  return NextResponse.json({ ok: true, entries, selfProfile });
}

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { verifyLoungeAccess } from "@/lib/server/lounge";

const MAX_BIO_LENGTH = 300;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** チケットページからのラウンジ参加(または自己プロフィール更新)。自己申告制。 */
export async function POST(req: NextRequest) {
  let body: {
    registrationId?: string;
    k?: string;
    name?: string;
    company?: string;
    jobTitle?: string;
    category?: string;
    bio?: string;
  };
  try {
    body = await req.json();
  } catch {
    return bad("不正なリクエストです");
  }

  const result = await verifyLoungeAccess(body.registrationId, body.k);
  if (!("ok" in result)) return bad(result.error, result.status);
  const { auth } = result;

  const name = (body.name ?? "").trim();
  const company = (body.company ?? "").trim();
  const jobTitle = (body.jobTitle ?? "").trim();
  const category = (body.category ?? "").trim();
  const bio = (body.bio ?? "").trim();
  if (!name) return bad("表示名を入力してください");
  if (bio.length > MAX_BIO_LENGTH) return bad(`自己紹介は${MAX_BIO_LENGTH}文字以内にしてください`);

  const db = adminDb();
  const eventSnap = await db.doc(`events/${auth.eventId}`).get();
  const categories: string[] = eventSnap.get("loungeCategories") ?? [];
  if (category && !categories.includes(category)) {
    return bad("カテゴリの指定が正しくありません");
  }

  const profileRef = db.doc(`events/${auth.eventId}/loungeProfiles/${auth.registrationId}`);
  const existing = await profileRef.get();
  await profileRef.set(
    {
      registrationId: auth.registrationId,
      name,
      company,
      jobTitle,
      category,
      bio,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}

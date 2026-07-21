import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { RegistrationFieldDef } from "@/lib/types";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** アンケート回答の受付。チケットリンク(registrationId + qrToken)で本人確認する。 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string; surveyId: string }> }
) {
  const { id: eventId, surveyId } = await props.params;
  let body: { registrationId?: string; k?: string; answers?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return bad("不正なリクエストです");
  }
  const registrationId = body.registrationId;
  const k = body.k;
  const answers = body.answers ?? {};
  if (!registrationId || !k) return bad("必須項目が不足しています");

  const db = adminDb();
  const [regSnap, surveySnap] = await Promise.all([
    db.doc(`registrations/${registrationId}`).get(),
    db.doc(`events/${eventId}/surveys/${surveyId}`).get(),
  ]);
  if (!regSnap.exists || regSnap.get("qrToken") !== k || regSnap.get("eventId") !== eventId) {
    return bad("チケットが確認できませんでした", 404);
  }
  if (!surveySnap.exists || surveySnap.get("status") !== "sent") {
    return bad("このアンケートは回答を受け付けていません", 404);
  }

  const questions: RegistrationFieldDef[] = surveySnap.get("questions") ?? [];
  const clean: Record<string, string> = {};
  for (const q of questions) {
    const raw = (answers[q.id] ?? "").toString().trim();
    if (q.required && !raw) return bad(`「${q.label}」を入力してください`);
    if (q.type === "select" && raw && !q.options.includes(raw)) {
      return bad(`「${q.label}」の値が不正です`);
    }
    clean[q.id] = raw;
  }

  const respRef = db.doc(`events/${eventId}/surveys/${surveyId}/responses/${registrationId}`);
  const existing = await respRef.get();
  await respRef.set({
    registrationId,
    attendeeName: (regSnap.get("attendee") as { name: string })?.name ?? "",
    answers: clean,
    submittedAt: FieldValue.serverTimestamp(),
  });
  if (!existing.exists) {
    await surveySnap.ref.update({ responseCount: FieldValue.increment(1) });
  }

  return NextResponse.json({ ok: true });
}

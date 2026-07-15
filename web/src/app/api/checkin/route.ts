import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyIdToken } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  let body: { eventId?: string; qrToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }
  const { eventId, qrToken } = body;
  if (!eventId || !qrToken) {
    return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
  }

  const db = adminDb();
  const eventSnap = await db.doc(`events/${eventId}`).get();
  if (!eventSnap.exists) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  // スタッフ権限チェック
  const memberSnap = await db
    .doc(`organizations/${eventSnap.get("orgId")}/members/${uid}`)
    .get();
  if (!memberSnap.exists) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const regQuery = await db
    .collection("registrations")
    .where("eventId", "==", eventId)
    .where("qrToken", "==", qrToken)
    .limit(1)
    .get();

  if (regQuery.empty) {
    return NextResponse.json(
      { result: "invalid", error: "このイベントのチケットではありません" },
      { status: 404 }
    );
  }

  const regDoc = regQuery.docs[0];
  const attendee = regDoc.get("attendee");
  const base = {
    name: attendee.name as string,
    company: (attendee.company as string) ?? "",
    ticketTypeName: regDoc.get("ticketTypeName") as string,
  };

  if (regDoc.get("status") !== "confirmed") {
    return NextResponse.json(
      { result: "invalid", error: "未決済またはキャンセル済みのチケットです", ...base },
      { status: 409 }
    );
  }

  if (regDoc.get("checkedInAt")) {
    return NextResponse.json({
      result: "already",
      checkedInAt: regDoc.get("checkedInAt").toDate().toISOString(),
      ...base,
    });
  }

  await regDoc.ref.update({
    checkedInAt: FieldValue.serverTimestamp(),
    checkedInBy: uid,
  });

  return NextResponse.json({ result: "ok", ...base });
}

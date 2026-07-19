import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * チケットページ(/t/[registrationId])からのセッション予約/取消。
 * ログイン不要 — registrationId + qrToken(チケットリンクに埋め込み済み)で本人確認する。
 */
export async function POST(req: NextRequest) {
  let body: { registrationId?: string; k?: string; sessionId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return bad("不正なリクエストです");
  }

  const { registrationId, k, sessionId } = body;
  const action = body.action === "cancel" ? "cancel" : "reserve";
  if (!registrationId || !k || !sessionId) return bad("必須項目が不足しています");

  const db = adminDb();
  const regRef = db.doc(`registrations/${registrationId}`);
  const regSnap = await regRef.get();
  if (!regSnap.exists || regSnap.get("qrToken") !== k) {
    return bad("チケットが確認できませんでした", 404);
  }
  if (regSnap.get("status") !== "confirmed") {
    return bad("確定済みのチケットのみセッションを予約できます", 409);
  }

  const eventId = regSnap.get("eventId") as string;
  const sessionRef = db.doc(`events/${eventId}/sessions/${sessionId}`);

  try {
    const result = await db.runTransaction(async (tx) => {
      const [sessionSnap, currentRegSnap] = await Promise.all([
        tx.get(sessionRef),
        tx.get(regRef),
      ]);
      if (!sessionSnap.exists) throw new Error("SESSION_NOT_FOUND");
      if (sessionSnap.get("isComingSoon")) throw new Error("COMING_SOON");

      const reserved: string[] = currentRegSnap.get("reservedSessionIds") ?? [];
      const capacity: number | null = sessionSnap.get("capacity") ?? null;
      const reservedCount: number = sessionSnap.get("reservedCount") ?? 0;

      if (action === "reserve") {
        if (reserved.includes(sessionId)) {
          return { reserved: true, remaining: capacity != null ? capacity - reservedCount : null };
        }
        if (capacity != null && reservedCount >= capacity) throw new Error("FULL");
        tx.update(sessionRef, { reservedCount: FieldValue.increment(1) });
        tx.update(regRef, { reservedSessionIds: FieldValue.arrayUnion(sessionId) });
        return { reserved: true, remaining: capacity != null ? capacity - reservedCount - 1 : null };
      }

      // cancel
      if (!reserved.includes(sessionId)) {
        return { reserved: false, remaining: capacity != null ? capacity - reservedCount : null };
      }
      tx.update(sessionRef, { reservedCount: FieldValue.increment(-1) });
      tx.update(regRef, { reservedSessionIds: FieldValue.arrayRemove(sessionId) });
      return { reserved: false, remaining: capacity != null ? capacity - reservedCount + 1 : null };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof Error && err.message === "FULL") {
      return bad("このセッションは満席です", 409);
    }
    if (err instanceof Error && err.message === "COMING_SOON") {
      return bad("このセッションはまだ予約できません", 409);
    }
    if (err instanceof Error && err.message === "SESSION_NOT_FOUND") {
      return bad("セッションが見つかりません", 404);
    }
    throw err;
  }
}

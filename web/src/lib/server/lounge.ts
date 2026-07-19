import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export interface LoungeAuth {
  registrationId: string;
  eventId: string;
  orgId: string;
  attendeeName: string;
}

/**
 * ラウンジ関連API共通の本人確認。ログイン不要 — チケットリンクの
 * registrationId + qrToken(k)で確認済みチケットのみ許可する。
 */
export async function verifyLoungeAccess(
  registrationId: string | undefined,
  k: string | undefined
): Promise<{ error: string; status: number } | { ok: true; auth: LoungeAuth }> {
  if (!registrationId || !k) return { error: "必須項目が不足しています", status: 400 };

  const db = adminDb();
  const regSnap = await db.doc(`registrations/${registrationId}`).get();
  if (!regSnap.exists || regSnap.get("qrToken") !== k) {
    return { error: "チケットが確認できませんでした", status: 404 };
  }
  if (regSnap.get("status") !== "confirmed") {
    return { error: "確定済みのチケットのみラウンジを利用できます", status: 409 };
  }

  const eventId = regSnap.get("eventId") as string;
  const eventSnap = await db.doc(`events/${eventId}`).get();
  if (!eventSnap.exists || !eventSnap.get("loungeEnabled")) {
    return { error: "このイベントのコミュニティラウンジは利用できません", status: 404 };
  }

  const attendee = regSnap.get("attendee") as { name: string };
  return {
    ok: true,
    auth: {
      registrationId,
      eventId,
      orgId: regSnap.get("orgId"),
      attendeeName: attendee?.name ?? "",
    },
  };
}

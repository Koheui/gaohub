import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export interface LoungeAuth {
  registrationId: string;
  eventId: string;
  orgId: string;
  attendeeName: string;
}

export interface LoungeEntry {
  registrationId: string;
  name: string;
  company: string;
  jobTitle: string;
  category: string;
  bio: string;
}

/** ラウンジに表示する登壇者。email は含めず「連絡可能か」のフラグだけ渡す */
export interface LoungeSpeaker {
  id: string;
  name: string;
  title: string;
  company: string;
  photoUrl: string | null;
  canContact: boolean;
}

export async function getLoungeEntries(eventId: string): Promise<LoungeEntry[]> {
  const snap = await adminDb()
    .collection(`events/${eventId}/loungeProfiles`)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => ({
    registrationId: d.id,
    name: d.get("name") ?? "",
    company: d.get("company") ?? "",
    jobTitle: d.get("jobTitle") ?? "",
    category: d.get("category") ?? "",
    bio: d.get("bio") ?? "",
  }));
}

export async function getLoungeSpeakers(eventId: string): Promise<LoungeSpeaker[]> {
  const snap = await adminDb()
    .collection(`events/${eventId}/speakers`)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.get("name") ?? "",
    title: d.get("title") ?? "",
    company: d.get("company") ?? "",
    photoUrl: d.get("photoUrl") ?? null,
    canContact: !!(d.get("email") ?? ""),
  }));
}

/**
 * 申込時の「コミュニティラウンジに参加する」チェックから、申込情報をもとに
 * プロフィールを自動作成する(確定済みチケットに対してのみ呼ぶこと)。
 * 既に参加済みの場合は上書きしない。
 */
export async function createLoungeProfileFromRegistration(params: {
  eventId: string;
  registrationId: string;
  attendee: { name: string; company: string; jobTitle: string };
}) {
  const ref = adminDb().doc(`events/${params.eventId}/loungeProfiles/${params.registrationId}`);
  const existing = await ref.get();
  if (existing.exists) return;
  await ref.set({
    registrationId: params.registrationId,
    name: params.attendee.name,
    company: params.attendee.company ?? "",
    jobTitle: params.attendee.jobTitle ?? "",
    category: "",
    bio: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
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

  // グレード制限: paid の場合は有料チケット(amountJpy > 0)の参加者のみ
  const loungeAccess = (eventSnap.get("loungeAccess") as "all" | "paid") ?? "all";
  if (loungeAccess === "paid" && (regSnap.get("amountJpy") ?? 0) <= 0) {
    return { error: "このラウンジは有料チケットの参加者のみご利用いただけます", status: 403 };
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

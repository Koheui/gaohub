import "server-only";
import { adminDb, verifyIdToken } from "@/lib/firebase/admin";

/**
 * Authorization ヘッダーの ID トークンを検証し、そのユーザーが指定イベントを
 * 持つ組織のメンバーであることを確認する。ダッシュボード配下の主催者専用APIで共通利用。
 * 成功時は { uid, orgId } を、失敗時は { error, status } を返す。
 */
export async function requireEventOrgMember(
  authorization: string | null,
  eventId: string
): Promise<{ error: string; status: number } | { uid: string; orgId: string }> {
  const uid = await verifyIdToken(authorization);
  if (!uid) return { error: "認証が必要です", status: 401 };

  const db = adminDb();
  const eventSnap = await db.doc(`events/${eventId}`).get();
  if (!eventSnap.exists) return { error: "イベントが見つかりません", status: 404 };

  const orgId = eventSnap.get("orgId") as string;
  const memberSnap = await db.doc(`organizations/${orgId}/members/${uid}`).get();
  if (!memberSnap.exists) return { error: "権限がありません", status: 403 };

  return { uid, orgId };
}

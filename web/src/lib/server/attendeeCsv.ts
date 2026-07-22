import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { RegistrationFieldDef } from "@/lib/types";

const statusLabel: Record<string, string> = {
  confirmed: "確定",
  pending_payment: "決済待ち",
  cancelled: "キャンセル",
};
const verificationLabel: Record<string, string> = {
  pending: "未確認",
  approved: "承認済み",
  rejected: "却下",
};

function toDate(v: unknown): Date | null {
  const ts = v as { toDate?: () => Date } | undefined;
  return ts?.toDate ? ts.toDate() : null;
}

/**
 * 参加者(申込者)データを CSV 文字列で返す。レポート/申込者画面からの
 * ダウンロード用。氏名・連絡先・チケット・ステータス・チェックイン・
 * カスタム質問の回答を1行=1申込で出力する(Excel 用 BOM は呼び出し側で付与)。
 */
export async function buildAttendeesCsv(eventId: string): Promise<string | null> {
  const db = adminDb();
  const eventSnap = await db.doc(`events/${eventId}`).get();
  if (!eventSnap.exists) return null;

  const fields: RegistrationFieldDef[] = eventSnap.get("registrationFields") ?? [];
  const regSnap = await db
    .collection("registrations")
    .where("eventId", "==", eventId)
    .get();

  const regs = regSnap.docs
    .map((d) => d.data())
    .sort((a, b) => {
      const ta = toDate(a.createdAt)?.getTime() ?? 0;
      const tb = toDate(b.createdAt)?.getTime() ?? 0;
      return tb - ta;
    });

  const header = [
    "氏名",
    "メールアドレス",
    "会社名",
    "役職",
    "チケット",
    "金額",
    "ステータス",
    "確認書類",
    "チェックイン",
    "申込日時",
    ...fields.map((f) => f.label),
  ];

  const rows = regs.map((r) => {
    const attendee = (r.attendee as { name?: string; email?: string; company?: string; jobTitle?: string }) ?? {};
    const answers = (r.customAnswers as Record<string, string>) ?? {};
    const checkin = toDate(r.checkedInAt);
    const created = toDate(r.createdAt);
    return [
      attendee.name ?? "",
      attendee.email ?? "",
      attendee.company ?? "",
      attendee.jobTitle ?? "",
      (r.ticketTypeName as string) ?? "",
      String(r.amountJpy ?? 0),
      statusLabel[r.status as string] ?? (r.status as string) ?? "",
      r.verificationStatus ? verificationLabel[r.verificationStatus as string] ?? "" : "",
      checkin ? checkin.toISOString() : "",
      created ? created.toISOString() : "",
      ...fields.map((f) => {
        const v = answers[f.id] ?? "";
        return f.type === "checkbox" ? (v === "true" ? "はい" : "いいえ") : v;
      }),
    ];
  });

  return [header, ...rows]
    .map((row) => row.map((c) => `"${(c ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

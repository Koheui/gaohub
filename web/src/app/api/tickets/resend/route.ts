import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendTicketLinksEmail } from "@/lib/email";
import { appUrl } from "@/lib/format";

/**
 * 申込時のメールアドレス宛にチケットページへのリンクを再送する。
 * チケットページが参加者のマイページ(セッション予約の追加・変更)を兼ねるため、
 * 申込完了メールを失った参加者が後から戻ってこられる唯一の導線。
 *
 * 登録の有無にかかわらず常に ok を返し、メールアドレスの存在を漏らさない。
 */
export async function POST(req: NextRequest) {
  let body: { eventId?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const eventId = (body.eventId ?? "").trim();
  const email = (body.email ?? "").trim();
  if (!eventId || !email) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスの形式が不正です" }, { status: 400 });
  }

  // 以降は成否にかかわらず同じレスポンス(列挙攻撃対策)
  const ok = NextResponse.json({ ok: true });

  const db = adminDb();
  const eventSnap = await db.doc(`events/${eventId}`).get();
  if (!eventSnap.exists || eventSnap.get("status") !== "published") return ok;

  const regsSnap = await db
    .collection("registrations")
    .where("eventId", "==", eventId)
    .where("attendee.email", "==", email)
    .where("status", "==", "confirmed")
    .get();
  if (regsSnap.empty) return ok;

  await sendTicketLinksEmail({
    to: email,
    eventTitle: eventSnap.get("title"),
    tickets: regsSnap.docs.map((d) => ({
      name: d.get("ticketTypeName") ?? "チケット",
      url: appUrl(`/t/${d.id}?k=${d.get("qrToken")}`),
    })),
  }).catch((e) => console.error("[tickets/resend] email failed:", e));

  return ok;
}

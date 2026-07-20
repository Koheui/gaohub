import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyLoungeAccess } from "@/lib/server/lounge";
import { sendLoungeContactEmail } from "@/lib/email";

const MAX_SUBJECT_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * ラウンジ参加者・登壇者へのメッセージ送信。受信者の生メールアドレスは
 * クライアントに一切返さない — サーバー側で解決して Resend 経由で送るのみ。
 * 宛先は toRegistrationId(参加者)または toSpeakerId(登壇者)のどちらか一方。
 */
export async function POST(req: NextRequest) {
  let body: {
    registrationId?: string;
    k?: string;
    toRegistrationId?: string;
    toSpeakerId?: string;
    subject?: string;
    message?: string;
  };
  try {
    body = await req.json();
  } catch {
    return bad("不正なリクエストです");
  }

  const result = await verifyLoungeAccess(body.registrationId, body.k);
  if (!("ok" in result)) return bad(result.error, result.status);
  const { auth } = result;

  const { toRegistrationId, toSpeakerId } = body;
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();
  if ((!toRegistrationId && !toSpeakerId) || !subject || !message) {
    return bad("必須項目が不足しています");
  }
  if (toRegistrationId && toSpeakerId) return bad("宛先の指定が不正です");
  if (subject.length > MAX_SUBJECT_LENGTH) return bad(`件名は${MAX_SUBJECT_LENGTH}文字以内にしてください`);
  if (message.length > MAX_MESSAGE_LENGTH) return bad(`本文は${MAX_MESSAGE_LENGTH}文字以内にしてください`);
  if (toRegistrationId === auth.registrationId) return bad("自分自身には送信できません");

  const db = adminDb();
  const [senderRegSnap, eventSnap] = await Promise.all([
    db.doc(`registrations/${auth.registrationId}`).get(),
    db.doc(`events/${auth.eventId}`).get(),
  ]);
  const senderEmail = (senderRegSnap.get("attendee") as { email: string })?.email;
  if (!senderEmail) return bad("メールアドレスが確認できませんでした", 404);

  let recipientEmail: string | null = null;
  if (toRegistrationId) {
    const [recipientProfileSnap, recipientRegSnap] = await Promise.all([
      db.doc(`events/${auth.eventId}/loungeProfiles/${toRegistrationId}`).get(),
      db.doc(`registrations/${toRegistrationId}`).get(),
    ]);
    if (!recipientProfileSnap.exists || !recipientRegSnap.exists) {
      return bad("送信先の参加者が見つかりません", 404);
    }
    recipientEmail = (recipientRegSnap.get("attendee") as { email: string })?.email ?? null;
  } else {
    const speakerSnap = await db.doc(`events/${auth.eventId}/speakers/${toSpeakerId}`).get();
    if (!speakerSnap.exists) return bad("送信先の登壇者が見つかりません", 404);
    recipientEmail = (speakerSnap.get("email") as string) || null;
    if (!recipientEmail) return bad("この登壇者はメッセージを受け付けていません", 409);
  }
  if (!recipientEmail) return bad("メールアドレスが確認できませんでした", 404);

  await sendLoungeContactEmail({
    to: recipientEmail,
    replyTo: senderEmail,
    senderName: auth.attendeeName,
    eventTitle: eventSnap.get("title") ?? "",
    subject,
    message,
  });

  return NextResponse.json({ ok: true });
}

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
 * ラウンジ参加者へのメッセージ送信。受信者の生メールアドレスは
 * クライアントに一切返さない — サーバー側で解決して Resend 経由で送るのみ。
 */
export async function POST(req: NextRequest) {
  let body: {
    registrationId?: string;
    k?: string;
    toRegistrationId?: string;
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

  const toRegistrationId = body.toRegistrationId;
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!toRegistrationId || !subject || !message) return bad("必須項目が不足しています");
  if (subject.length > MAX_SUBJECT_LENGTH) return bad(`件名は${MAX_SUBJECT_LENGTH}文字以内にしてください`);
  if (message.length > MAX_MESSAGE_LENGTH) return bad(`本文は${MAX_MESSAGE_LENGTH}文字以内にしてください`);
  if (toRegistrationId === auth.registrationId) return bad("自分自身には送信できません");

  const db = adminDb();
  const [recipientProfileSnap, recipientRegSnap, senderRegSnap, eventSnap] = await Promise.all([
    db.doc(`events/${auth.eventId}/loungeProfiles/${toRegistrationId}`).get(),
    db.doc(`registrations/${toRegistrationId}`).get(),
    db.doc(`registrations/${auth.registrationId}`).get(),
    db.doc(`events/${auth.eventId}`).get(),
  ]);
  if (!recipientProfileSnap.exists || !recipientRegSnap.exists) {
    return bad("送信先の参加者が見つかりません", 404);
  }

  const recipientEmail = (recipientRegSnap.get("attendee") as { email: string })?.email;
  const senderEmail = (senderRegSnap.get("attendee") as { email: string })?.email;
  if (!recipientEmail || !senderEmail) return bad("メールアドレスが確認できませんでした", 404);

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

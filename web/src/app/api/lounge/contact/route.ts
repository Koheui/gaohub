import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyLoungeAccess } from "@/lib/server/lounge";
import { sendStructuredContactEmail, sendLoungeContactEmail } from "@/lib/email";
import { curateMessage } from "@/lib/server/aiCurator";
import { appUrl } from "@/lib/format";
import { LoungeContactPurpose } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

const MAX_BENEFIT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 2000;

const PURPOSE_LABELS: Record<LoungeContactPurpose, string> = {
  funding: "資金調達・出資の相談",
  partnership: "事業提携・PoCの提案",
  purchase: "サービス導入・購入検討",
  inquiry: "詳細問い合わせ",
  greeting: "挨拶・情報交換",
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * 構造化ビジネスマッチングメッセージの送信。
 * AIによるキュレーション(優先度判定・要約)を実行し、Firestore に保存して
 * ワンタップ返信リンク付きの Resend メールを送信する。
 */
export async function POST(req: NextRequest) {
  let body: {
    registrationId?: string;
    k?: string;
    toRegistrationId?: string;
    toSpeakerId?: string;
    purpose?: LoungeContactPurpose;
    benefitSummary?: string;
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
  const purpose: LoungeContactPurpose = body.purpose ?? "greeting";
  const benefitSummary = (body.benefitSummary ?? body.subject ?? "").trim();
  const details = (body.message ?? "").trim();

  if ((!toRegistrationId && !toSpeakerId) || !benefitSummary) {
    return bad("必須項目(宛先および具体提案・メリット要約)が不足しています");
  }
  if (toRegistrationId && toSpeakerId) return bad("宛先の指定が不正です");
  if (benefitSummary.length > MAX_BENEFIT_LENGTH) return bad(`要約は${MAX_BENEFIT_LENGTH}文字以内にしてください`);
  if (details.length > MAX_MESSAGE_LENGTH) return bad(`詳細本文は${MAX_MESSAGE_LENGTH}文字以内にしてください`);
  if (toRegistrationId === auth.registrationId) return bad("自分自身には送信できません");

  const db = adminDb();
  const [senderRegSnap, senderProfileSnap, eventSnap] = await Promise.all([
    db.doc(`registrations/${auth.registrationId}`).get(),
    db.doc(`events/${auth.eventId}/loungeProfiles/${auth.registrationId}`).get(),
    db.doc(`events/${auth.eventId}`).get(),
  ]);

  const senderEmail = (senderRegSnap.get("attendee") as { email: string })?.email;
  if (!senderEmail) return bad("メールアドレスが確認できませんでした", 404);

  const senderCompany = senderProfileSnap.get("company") ?? "";
  const senderRole = senderProfileSnap.get("role") ?? "";

  let recipientEmail: string | null = null;
  let recipientName = "";
  let recipientType: "speaker" | "registration" = "registration";
  let recipientId = "";

  if (toRegistrationId) {
    recipientType = "registration";
    recipientId = toRegistrationId;
    const [recipientProfileSnap, recipientRegSnap] = await Promise.all([
      db.doc(`events/${auth.eventId}/loungeProfiles/${toRegistrationId}`).get(),
      db.doc(`registrations/${toRegistrationId}`).get(),
    ]);
    if (!recipientProfileSnap.exists || !recipientRegSnap.exists) {
      return bad("送信先の参加者が見つかりません", 404);
    }
    recipientEmail = (recipientRegSnap.get("attendee") as { email: string })?.email ?? null;
    recipientName = recipientProfileSnap.get("name") ?? "";
  } else if (toSpeakerId) {
    recipientType = "speaker";
    recipientId = toSpeakerId;
    const speakerSnap = await db.doc(`events/${auth.eventId}/speakers/${toSpeakerId}`).get();
    if (!speakerSnap.exists) return bad("送信先の登壇者が見つかりません", 404);
    recipientEmail = (speakerSnap.get("email") as string) || null;
    recipientName = speakerSnap.get("name") ?? "";
    if (!recipientEmail) return bad("この登壇者はメッセージを受け付けていません", 409);
  }

  if (!recipientEmail) return bad("メールアドレスが確認できませんでした", 404);

  // 🤖 AI キュレーション実行
  const curation = await curateMessage({
    purpose,
    benefitSummary,
    details,
    senderName: auth.attendeeName,
    senderCompany,
  });

  // Firestore events/{eventId}/messages に保存
  const msgRef = db.collection(`events/${auth.eventId}/messages`).doc();
  const messageData = {
    id: msgRef.id,
    eventId: auth.eventId,
    senderRegistrationId: auth.registrationId,
    senderName: auth.attendeeName,
    senderEmail,
    senderCompany,
    senderRole,
    recipientType,
    recipientId,
    recipientName,
    recipientEmail,
    purpose,
    benefitSummary,
    details,
    aiPriority: curation.aiPriority,
    aiSummary: curation.aiSummary,
    status: "pending",
    responseAction: null,
    createdAt: FieldValue.serverTimestamp(),
    respondedAt: null,
  };

  await msgRef.set(messageData);

  // メール内リンクは本番URL(NEXT_PUBLIC_APP_URL)に統一する
  const origin = appUrl("");
  const inboxUrl = `${origin}/dashboard/events/${auth.eventId}/messages`;
  const respondBaseUrl = `${origin}/api/lounge/messages/respond`;

  // 通知メール送信
  await sendStructuredContactEmail({
    to: recipientEmail,
    replyTo: senderEmail,
    senderName: auth.attendeeName,
    senderCompany,
    eventTitle: eventSnap.get("title") ?? "",
    purposeLabel: PURPOSE_LABELS[purpose] ?? purpose,
    benefitSummary,
    details,
    aiPriority: curation.aiPriority,
    aiSummary: curation.aiSummary,
    inboxUrl,
    respondBaseUrl,
    messageId: msgRef.id,
  });

  return NextResponse.json({ ok: true, messageId: msgRef.id, aiPriority: curation.aiPriority });
}


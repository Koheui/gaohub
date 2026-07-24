import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { MessageResponseAction } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

let resend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

const ACTION_LABELS: Record<MessageResponseAction, string> = {
  schedule_meeting: "📅 オンライン面談の予約受付",
  exchange_contacts: "📇 名刺・連絡先交換の承諾",
  email: "✉️ メールでの直接返信",
  decline: "今回は見送り（辞退）",
};

/**
 * ワンタップ返信 API。
 * GET(メールのリンク直クリック) または POST (ダッシュボード操作) を処理する。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const msgId = searchParams.get("msg");
  const act = searchParams.get("act") as MessageResponseAction | null;

  if (!msgId || !act || !ACTION_LABELS[act]) {
    return NextResponse.redirect(new URL("/?error=invalid_action", req.url));
  }

  const result = await handleRespond(msgId, act);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // 完了画面として簡単なHTMLレスポンスを表示
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>返信完了 - GAO HUB</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #09090b; color: #f4f4f5; }
    .card { background: #18181b; border: 1px solid #27272a; padding: 40px; border-radius: 16px; max-width: 480px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; margin-bottom: 8px; color: #fff; }
    p { color: #a1a1aa; font-size: 14px; line-height: 1.6; }
    .action { background: #27272a; padding: 8px 16px; border-radius: 8px; font-weight: bold; color: #38bdf8; display: inline-block; margin: 12px 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✨</div>
    <h1>返信・アクションを記録しました</h1>
    <div class="action">${ACTION_LABELS[act]}</div>
    <p>送信者（${result.senderName}様）へ完了通知をお送りしました。<br>ご協力ありがとうございました。</p>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function POST(req: NextRequest) {
  let body: { messageId?: string; action?: MessageResponseAction; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  if (!body.messageId || !body.action || !ACTION_LABELS[body.action]) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const result = await handleRespond(body.messageId, body.action, body.note);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

async function handleRespond(messageId: string, action: MessageResponseAction, note?: string) {
  const db = adminDb();
  // 全イベントの messages コレクションから該当IDのドキュメントを検索
  const groupSnap = await db.collectionGroup("messages").where("id", "==", messageId).get();
  if (groupSnap.empty) {
    return { ok: false, error: "該当するメッセージが見つかりません" };
  }

  const msgDoc = groupSnap.docs[0];
  const data = msgDoc.data();
  const newStatus = action === "decline" ? "declined" : "responded";

  await msgDoc.ref.update({
    status: newStatus,
    responseAction: action,
    responseNote: note ?? "",
    respondedAt: FieldValue.serverTimestamp(),
  });

  // 送信者へ返信結果の通知メールを送付
  const client = getResend();
  if (client && data.senderEmail) {
    const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
    let bodyText = "";
    if (action === "schedule_meeting") {
      bodyText = `<p>${data.recipientName} 様よりオファーへの返信があり、<strong>「オンライン面談の調整」</strong>が希望されました。</p>
        <p>追って ${data.recipientName} 様から直接連絡、または日程案内が届きます。</p>`;
    } else if (action === "exchange_contacts") {
      bodyText = `<p>${data.recipientName} 様よりオファーへの返信があり、<strong>「名刺・連絡先交換」</strong>が承諾されました！</p>
        <p>連絡先メールアドレス: <a href="mailto:${data.recipientEmail}">${data.recipientEmail}</a></p>`;
    } else if (action === "decline") {
      bodyText = `<p>${data.recipientName} 様より「今回は見送り」との回答がありました。</p>
        <p>ご提案いただきありがとうございました。</p>`;
    } else {
      bodyText = `<p>${data.recipientName} 様より回答がありました。</p>`;
    }

    if (note) {
      bodyText += `<div style="background:#f4f4f5;padding:12px;border-radius:6px;margin:12px 0;"><p style="margin:0;font-size:13px;color:#555;">返答コメント: ${note}</p></div>`;
    }

    await client.emails.send({
      from,
      to: data.senderEmail,
      subject: `【回答通知】${data.recipientName}様より「${data.benefitSummary.slice(0, 20)}...」への返信が届きました`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <h2>${data.senderName} 様</h2>
          ${bodyText}
          <p style="margin-top:24px;color:#888;font-size:12px;">GAO HUB ビジネスマッチング</p>
        </div>
      `,
    }).catch((err) => console.warn("Failed to send response notification email:", err));
  }

  return { ok: true, senderName: data.senderName };
}

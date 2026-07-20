import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null; // 未設定時はメール送信をスキップ(開発用)
  if (!resend) resend = new Resend(key);
  return resend;
}

export async function sendTicketEmail(params: {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDateText: string;
  venueName: string;
  ticketUrl: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping ticket email to", params.to);
    return;
  }
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  await client.emails.send({
    from,
    to: params.to,
    subject: `【申込完了】${params.eventTitle} のチケット`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>${escapeHtml(params.eventTitle)}</h2>
        <p>${escapeHtml(params.attendeeName)} 様</p>
        <p>お申し込みありがとうございます。以下のリンクからQRチケットを表示できます。当日受付でご提示ください。</p>
        <p style="margin: 24px 0;">
          <a href="${params.ticketUrl}"
             style="background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
            QRチケットを表示
          </a>
        </p>
        <table style="border-collapse:collapse;color:#333;font-size:14px;">
          <tr><td style="padding:4px 12px 4px 0;color:#888;">日時</td><td>${escapeHtml(params.eventDateText)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">会場</td><td>${escapeHtml(params.venueName)}</td></tr>
        </table>
        <p style="margin-top:24px;color:#555;font-size:13px;">
          チケットページでは、セッションの予約・変更やコミュニティラウンジへの参加が
          <strong>開催当日までいつでも</strong>行えます。このメールは大切に保管してください。
        </p>
      </div>
    `,
  });
}

export async function sendTicketLinksEmail(params: {
  to: string;
  eventTitle: string;
  tickets: { name: string; url: string }[];
}) {
  const client = getResend();
  if (!client) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping ticket links email to",
      params.to,
      params.tickets.map((t) => t.url)
    );
    return;
  }
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  await client.emails.send({
    from,
    to: params.to,
    subject: `【チケット再送】${params.eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>${escapeHtml(params.eventTitle)}</h2>
        <p>ご登録のチケットページへのリンクをお送りします。</p>
        ${params.tickets
          .map(
            (t) => `
        <p style="margin: 20px 0;">
          <a href="${t.url}"
             style="background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
            チケットを表示(${escapeHtml(t.name)})
          </a>
        </p>`
          )
          .join("")}
        <p style="margin-top:24px;color:#555;font-size:13px;">
          チケットページでは、セッションの予約・変更が開催当日までいつでも行えます。
        </p>
      </div>
    `,
  });
}

export async function sendLoungeContactEmail(params: {
  to: string;
  replyTo: string;
  senderName: string;
  eventTitle: string;
  subject: string;
  message: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping lounge contact email to",
      params.to,
      `(from ${params.replyTo}: "${params.subject}")`
    );
    return;
  }
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  await client.emails.send({
    from,
    to: params.to,
    replyTo: params.replyTo,
    subject: `【${params.eventTitle} コミュニティラウンジ】${params.senderName}様からメッセージ`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <p style="color:#888;font-size:12px;">${escapeHtml(params.eventTitle)} のコミュニティラウンジ経由のメッセージです</p>
        <h2>${escapeHtml(params.subject)}</h2>
        <p style="color:#666;">送信者: ${escapeHtml(params.senderName)} 様</p>
        <p style="white-space:pre-wrap;line-height:1.7;">${escapeHtml(params.message)}</p>
        <p style="margin-top:24px;color:#888;font-size:12px;">
          このメールに返信すると、送信者に直接届きます。
        </p>
      </div>
    `,
  });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

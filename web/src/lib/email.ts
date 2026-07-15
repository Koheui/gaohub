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

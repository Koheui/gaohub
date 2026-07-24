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

export async function sendSurveyEmail(params: {
  to: string;
  attendeeName: string;
  eventTitle: string;
  surveyTitle: string;
  surveyUrl: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping survey email to",
      params.to,
      `(${params.surveyTitle}: ${params.surveyUrl})`
    );
    return;
  }
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  await client.emails.send({
    from,
    to: params.to,
    subject: `【アンケート】${params.eventTitle}「${params.surveyTitle}」`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>${escapeHtml(params.surveyTitle)}</h2>
        <p>${escapeHtml(params.attendeeName)} 様</p>
        <p>${escapeHtml(params.eventTitle)} へのご参加ありがとうございました。
          今後のイベント改善のため、以下のアンケートにご協力ください。</p>
        <p style="margin: 24px 0;">
          <a href="${params.surveyUrl}"
             style="background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
            アンケートに回答する
          </a>
        </p>
        <p style="color:#888;font-size:12px;">回答は主催者にのみ共有されます。</p>
      </div>
    `,
  });
}

export async function sendFollowerWelcomeEmail(params: {
  to: string;
  organizerName: string;
  userName?: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping follower welcome email to", params.to);
    return;
  }
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  await client.emails.send({
    from,
    to: params.to,
    subject: `【フォロー完了】${params.organizerName} の新着通知を登録しました`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <h2>${escapeHtml(params.organizerName)} をフォローしました 🔔</h2>
        <p>${escapeHtml(params.userName || "ファン")} 様</p>
        <p>ご登録ありがとうございます。</p>
        <p>今後 ${escapeHtml(params.organizerName)} が新しい投稿、限定イベント、有料記事を発表した際に、優先的に案内メールをお届けいたします。</p>
        <p style="margin-top:24px;color:#666;font-size:13px;">
          GAO HUB コミュニティプラットフォーム
        </p>
      </div>
    `,
  });
}

export async function sendOrganizerNewEventNotification(params: {
  to: string[];
  organizerName: string;
  eventTitle: string;
  eventDateText: string;
  eventUrl: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping new event notification email to", params.to);
    return;
  }
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  await client.emails.send({
    from,
    to: params.to,
    subject: `【新着イベント】${params.organizerName} が「${params.eventTitle}」の開催を発表しました`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <p style="color:#666;font-size:13px;">フォロー中の ${escapeHtml(params.organizerName)} からの新着イベント通知</p>
        <h2 style="margin-top:8px;">${escapeHtml(params.eventTitle)}</h2>
        <p>日時: ${escapeHtml(params.eventDateText)}</p>
        <p style="margin: 24px 0;">
          <a href="${params.eventUrl}"
             style="background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            イベントの詳細・参加申込みへ →
          </a>
        </p>
        <p style="margin-top:24px;color:#888;font-size:12px;">
          このメールは ${escapeHtml(params.organizerName)} をフォローしている参加者の皆様へお送りしています。
        </p>
      </div>
    `,
  });
}

export async function sendStructuredContactEmail(params: {
  to: string;
  replyTo: string;
  senderName: string;
  senderCompany: string;
  eventTitle: string;
  purposeLabel: string;
  benefitSummary: string;
  details: string;
  aiPriority: "high" | "medium" | "low";
  aiSummary: string;
  inboxUrl: string;
  respondBaseUrl: string;
  messageId: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping structured contact email to",
      params.to,
      `(from ${params.senderName})`
    );
    return;
  }
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const priorityBadge =
    params.aiPriority === "high"
      ? '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">🔥 重要・商談優先</span>'
      : params.aiPriority === "medium"
      ? '<span style="background:#e0f2fe;color:#075985;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">💬 問い合わせ</span>'
      : '<span style="background:#f4f4f5;color:#52525b;padding:2px 8px;border-radius:4px;font-size:12px;">挨拶</span>';

  await client.emails.send({
    from,
    to: params.to,
    replyTo: params.replyTo,
    subject: `【${params.eventTitle}】${params.senderCompany ? params.senderCompany + " " : ""}${params.senderName}様からオファー「${params.purposeLabel}」`,
    html: `
      <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; color: #111; line-height: 1.6;">
        <p style="color:#666;font-size:12px;">${escapeHtml(params.eventTitle)} のマッチング機能経由のオファー</p>
        <div style="margin-bottom: 12px;">
          ${priorityBadge}
          <span style="font-weight:bold;margin-left:8px;font-size:14px;color:#374151;">【${escapeHtml(params.purposeLabel)}】</span>
        </div>
        <h3 style="margin-top:4px;margin-bottom:12px;font-size:18px;">
          ${escapeHtml(params.senderCompany ? params.senderCompany + " " : "")}${escapeHtml(params.senderName)} 様より
        </h3>
        
        <div style="background:#f8fafc;border-left:4px solid #0284c7;padding:12px 16px;margin:16px 0;border-radius:4px;">
          <p style="margin:0;font-size:13px;color:#64748b;font-weight:bold;">🤖 AIによる要約:</p>
          <p style="margin:4px 0 0 0;font-weight:600;color:#0f172a;">${escapeHtml(params.aiSummary)}</p>
        </div>

        <div style="background:#fff;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin-bottom:20px;">
          <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;font-weight:bold;">具体的な提案・相手へのメリット:</p>
          <p style="margin:0 0 12px 0;font-size:15px;font-weight:600;color:#1e293b;">${escapeHtml(params.benefitSummary)}</p>
          ${params.details ? `<p style="margin:0;font-size:14px;color:#475569;white-space:pre-wrap;">${escapeHtml(params.details)}</p>` : ""}
        </div>

        <div style="margin:28px 0;padding:20px;background:#1e293b;border-radius:10px;text-align:center;color:#fff;">
          <p style="margin:0 0 12px 0;font-size:14px;font-weight:bold;">⚡ 1タップで返信・アクション選択</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
            <a href="${params.respondBaseUrl}?msg=${params.messageId}&act=schedule_meeting"
               style="background:#0284c7;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;display:inline-block;">
              📅 オンライン面談を予約
            </a>
            <a href="${params.respondBaseUrl}?msg=${params.messageId}&act=exchange_contacts"
               style="background:#059669;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;display:inline-block;">
              📇 名刺・連絡先を交換
            </a>
            <a href="${params.respondBaseUrl}?msg=${params.messageId}&act=decline"
               style="background:#475569;color:#e2e8f0;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:13px;display:inline-block;">
              今回は辞退
            </a>
          </div>
        </div>

        <p style="text-align:center;margin-top:16px;">
          <a href="${params.inboxUrl}" style="color:#0284c7;font-size:13px;text-decoration:underline;">
            管理画面 Inbox で全オファーを確認・詳細返信する →
          </a>
        </p>
      </div>
    `,
  });
}

export async function sendUnansweredReminderEmail(params: {
  to: string;
  recipientName: string;
  eventTitle: string;
  unansweredCount: number;
  highPriorityCount: number;
  inboxUrl: string;
}) {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping reminder email to", params.to);
    return;
  }
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  await client.emails.send({
    from,
    to: params.to,
    subject: `【要確認】${params.eventTitle} で未回答の商談オファーが ${params.unansweredCount}件 届いています`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <h2>${escapeHtml(params.recipientName)} 様</h2>
        <p>${escapeHtml(params.eventTitle)} のマッチングプラットフォームより通知です。</p>
        <p>あなた宛に届いているメッセージのうち、まだ返信されていないオファーが <strong>${params.unansweredCount}件</strong> （うち重要商談 <strong>${params.highPriorityCount}件</strong>）ございます。</p>
        <div style="margin: 24px 0; background:#f8fafc; padding:16px; border-radius:8px; text-align:center;">
          <a href="${params.inboxUrl}"
             style="background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
            Inboxを開いて1タップ返信する →
          </a>
        </div>
        <p style="color:#666;font-size:12px;">ワンタップで「面談予約」「名刺交換」「辞退」をご選択いただけます。</p>
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

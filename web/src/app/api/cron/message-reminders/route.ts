import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendUnansweredReminderEmail } from "@/lib/email";

/**
 * 予約リマインド送信 cron エンドポイント。
 * status=pending かつ aiPriority が high/medium の未回答オファーを集計し、
 * 受取人にまとめてワンタップ返信リマインドメールを送信する。
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const pendingSnap = await db
    .collectionGroup("messages")
    .where("status", "==", "pending")
    .get();

  if (pendingSnap.empty) {
    return NextResponse.json({ ok: true, processed: 0, sent: 0 });
  }

  // 受信者ごとにグループ化
  const grouped: Record<
    string,
    {
      recipientEmail: string;
      recipientName: string;
      eventId: string;
      unansweredCount: number;
      highPriorityCount: number;
    }
  > = {};

  for (const doc of pendingSnap.docs) {
    const data = doc.data();
    if (!data.recipientEmail) continue;

    const key = `${data.eventId}:${data.recipientEmail}`;
    if (!grouped[key]) {
      grouped[key] = {
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName ?? "ご担当者",
        eventId: data.eventId,
        unansweredCount: 0,
        highPriorityCount: 0,
      };
    }

    grouped[key].unansweredCount += 1;
    if (data.aiPriority === "high") {
      grouped[key].highPriorityCount += 1;
    }
  }

  const origin = req.headers.get("origin") ?? "https://gaohub.com";
  let sent = 0;

  for (const group of Object.values(grouped)) {
    const inboxUrl = `${origin}/dashboard/events/${group.eventId}/messages`;
    await sendUnansweredReminderEmail({
      to: group.recipientEmail,
      recipientName: group.recipientName,
      eventTitle: "イベント",
      unansweredCount: group.unansweredCount,
      highPriorityCount: group.highPriorityCount,
      inboxUrl,
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, processed: pendingSnap.size, sent });
}

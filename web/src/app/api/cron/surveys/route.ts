import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { sendSurvey } from "@/lib/server/surveys";

/**
 * 予約送信されたアンケートを処理する cron エンドポイント。
 * status=scheduled かつ scheduledAt <= 現在 のアンケートを全イベント横断で送信する。
 *
 * 本番では Vercel Cron / Cloudflare の定期実行から叩く(例: 5分おき)。
 * CRON_SECRET を設定し、Authorization: Bearer <secret> か ?secret= で保護する。
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization");
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const query = new URL(req.url).searchParams.get("secret");
    if (bearer !== secret && query !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const now = Timestamp.now();
  const snap = await adminDb()
    .collectionGroup("surveys")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", now)
    .get();

  const results: { eventId: string; surveyId: string; count?: number; error?: string }[] = [];
  for (const doc of snap.docs) {
    // path: events/{eventId}/surveys/{surveyId}
    const eventId = doc.ref.parent.parent!.id;
    const result = await sendSurvey(eventId, doc.id);
    results.push(
      "error" in result
        ? { eventId, surveyId: doc.id, error: result.error }
        : { eventId, surveyId: doc.id, count: result.count }
    );
  }

  return NextResponse.json({ processed: results.length, results });
}

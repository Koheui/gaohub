import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { sendSurveyEmail } from "@/lib/email";
import { appUrl } from "@/lib/format";
import type { SurveyAudience } from "@/lib/types";

/**
 * アンケートを対象者へ送信する(手動送信・cron の予約送信で共用)。
 * 送信後に status=sent / sentAt / sentCount を記録する。
 */
export async function sendSurvey(
  eventId: string,
  surveyId: string
): Promise<{ ok: true; count: number } | { error: string; status: number }> {
  const db = adminDb();
  const [eventSnap, surveySnap] = await Promise.all([
    db.doc(`events/${eventId}`).get(),
    db.doc(`events/${eventId}/surveys/${surveyId}`).get(),
  ]);
  if (!eventSnap.exists) return { error: "イベントが見つかりません", status: 404 };
  if (!surveySnap.exists) return { error: "アンケートが見つかりません", status: 404 };

  const audience = (surveySnap.get("audience") as SurveyAudience) ?? "all";
  const eventTitle: string = eventSnap.get("title") ?? "";
  const slug: string = eventSnap.get("slug") ?? "";
  const surveyTitle: string = surveySnap.get("title") ?? "アンケート";

  const regSnap = await db
    .collection("registrations")
    .where("eventId", "==", eventId)
    .where("status", "==", "confirmed")
    .get();

  const targets = regSnap.docs.filter((d) => {
    if (audience === "paid") return (d.get("amountJpy") ?? 0) > 0;
    if (audience === "checkedIn") return !!d.get("checkedInAt");
    return true;
  });

  await Promise.all(
    targets.map((d) => {
      const attendee = d.get("attendee") as { name: string; email: string };
      if (!attendee?.email) return Promise.resolve();
      const surveyUrl = appUrl(
        `/e/${slug}/survey/${surveyId}?r=${d.id}&k=${d.get("qrToken")}`
      );
      return sendSurveyEmail({
        to: attendee.email,
        attendeeName: attendee.name ?? "",
        eventTitle,
        surveyTitle,
        surveyUrl,
      }).catch((e) => console.error("[survey] email failed:", e));
    })
  );

  await surveySnap.ref.update({
    status: "sent",
    sentAt: FieldValue.serverTimestamp(),
    sentCount: targets.length,
    scheduledAt: null,
  });

  return { ok: true, count: targets.length };
}

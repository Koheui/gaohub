import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { RegistrationFieldDef } from "@/lib/types";

export interface Distribution {
  label: string;
  count: number;
}

export interface QuestionBreakdown {
  id: string;
  label: string;
  type: string;
  answered: number;
  options: Distribution[];
}

export interface SessionPopularity {
  id: string;
  title: string;
  track: string;
  reservedCount: number;
  capacity: number | null;
  isComingSoon: boolean;
}

export interface EventReport {
  eventTitle: string;
  generatedAt: string;
  totals: {
    confirmed: number;
    pendingPayment: number;
    cancelled: number;
    checkedIn: number;
    checkinRate: number; // 0..1
    revenue: number;
  };
  ticketBreakdown: (Distribution & { revenue: number })[];
  byCompany: Distribution[];
  byJobTitle: Distribution[];
  questions: QuestionBreakdown[];
  sessions: SessionPopularity[];
  lounge: { enabled: boolean; joined: number; rate: number };
  daily: Distribution[];
  totalReservations: number;
}

function countBy<T>(items: T[], key: (t: T) => string | null | undefined): Distribution[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const raw = key(item);
    const label = (raw ?? "").trim();
    if (!label) continue;
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/** 主催者向けの参加者データレポートを集計する(Admin SDK、MVPスケールの全件スキャン)。 */
export async function getEventReport(eventId: string): Promise<EventReport | null> {
  const db = adminDb();
  const eventSnap = await db.doc(`events/${eventId}`).get();
  if (!eventSnap.exists) return null;

  const [regSnap, sessionsSnap, loungeSnap] = await Promise.all([
    db.collection("registrations").where("eventId", "==", eventId).get(),
    db.collection(`events/${eventId}/sessions`).orderBy("startsAt", "asc").get(),
    db.collection(`events/${eventId}/loungeProfiles`).get(),
  ]);

  const regs = regSnap.docs.map((d) => d.data());
  const confirmed = regs.filter((r) => r.status === "confirmed");
  const pendingPayment = regs.filter((r) => r.status === "pending_payment").length;
  const cancelled = regs.filter((r) => r.status === "cancelled").length;
  const checkedIn = confirmed.filter((r) => r.checkedInAt).length;
  const revenue = confirmed.reduce((s, r) => s + (r.amountJpy ?? 0), 0);

  // チケット種別の内訳(確定のみ)
  const ticketMap = new Map<string, { count: number; revenue: number }>();
  for (const r of confirmed) {
    const name = (r.ticketTypeName as string) ?? "不明";
    const prev = ticketMap.get(name) ?? { count: 0, revenue: 0 };
    ticketMap.set(name, {
      count: prev.count + 1,
      revenue: prev.revenue + (r.amountJpy ?? 0),
    });
  }
  const ticketBreakdown = [...ticketMap.entries()]
    .map(([label, v]) => ({ label, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count);

  // 属性分布(確定のみ)
  const byCompany = countBy(confirmed, (r) => (r.attendee as { company?: string })?.company).slice(0, 12);
  const byJobTitle = countBy(confirmed, (r) => (r.attendee as { jobTitle?: string })?.jobTitle);

  // カスタム質問の集計(select / checkbox のみ数値化)
  const fields: RegistrationFieldDef[] = eventSnap.get("registrationFields") ?? [];
  const questions: QuestionBreakdown[] = fields
    .filter((f) => f.type === "select" || f.type === "checkbox")
    .map((f) => {
      let answered = 0;
      let options: Distribution[];
      if (f.type === "checkbox") {
        const yes = confirmed.filter(
          (r) => (r.customAnswers as Record<string, string>)?.[f.id] === "true"
        ).length;
        answered = confirmed.filter(
          (r) => (r.customAnswers as Record<string, string>)?.[f.id]
        ).length;
        options = [
          { label: "はい", count: yes },
          { label: "いいえ", count: Math.max(answered - yes, 0) },
        ];
      } else {
        const answers = confirmed
          .map((r) => (r.customAnswers as Record<string, string>)?.[f.id])
          .filter((v): v is string => !!v);
        answered = answers.length;
        options = countBy(answers, (v) => v);
      }
      return { id: f.id, label: f.label, type: f.type, answered, options };
    });

  // 人気コンテンツ(セッション予約数)
  const sessions: SessionPopularity[] = sessionsSnap.docs
    .map((d) => ({
      id: d.id,
      title: d.get("title") ?? "",
      track: d.get("track") ?? "",
      reservedCount: d.get("reservedCount") ?? 0,
      capacity: d.get("capacity") ?? null,
      isComingSoon: d.get("isComingSoon") ?? false,
    }))
    .sort((a, b) => b.reservedCount - a.reservedCount);
  const totalReservations = sessions.reduce((s, x) => s + x.reservedCount, 0);

  // 日別申込(確定、JST日付)
  const dayFmt = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  const daily = countBy(confirmed, (r) => {
    const ts = r.createdAt as { toDate?: () => Date } | undefined;
    return ts?.toDate ? dayFmt.format(ts.toDate()) : null;
  }).sort((a, b) => a.label.localeCompare(b.label));

  const loungeEnabled = eventSnap.get("loungeEnabled") ?? false;
  const joined = loungeSnap.size;

  return {
    eventTitle: eventSnap.get("title") ?? "",
    generatedAt: new Date().toISOString(),
    totals: {
      confirmed: confirmed.length,
      pendingPayment,
      cancelled,
      checkedIn,
      checkinRate: confirmed.length ? checkedIn / confirmed.length : 0,
      revenue,
    },
    ticketBreakdown,
    byCompany,
    byJobTitle,
    questions,
    sessions,
    lounge: {
      enabled: loungeEnabled,
      joined,
      rate: confirmed.length ? joined / confirmed.length : 0,
    },
    daily,
    totalReservations,
  };
}

import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getPublishedEventBySlug } from "@/lib/server/events";
import { Grain } from "@/components/Grain";
import { SurveyForm } from "./SurveyForm";
import type { RegistrationFieldDef } from "@/lib/types";

export const dynamic = "force-dynamic";

/** 参加者向けアンケート回答ページ。チケットリンク(r=登録ID, k=qrToken)で本人確認する。 */
export default async function SurveyResponsePage(props: {
  params: Promise<{ slug: string; surveyId: string }>;
  searchParams: Promise<{ r?: string; k?: string }>;
}) {
  const { slug, surveyId } = await props.params;
  const { r: registrationId, k } = await props.searchParams;
  if (!registrationId || !k) notFound();

  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const db = adminDb();
  const [regSnap, surveySnap] = await Promise.all([
    db.doc(`registrations/${registrationId}`).get(),
    db.doc(`events/${event.id}/surveys/${surveyId}`).get(),
  ]);
  if (!regSnap.exists || regSnap.get("qrToken") !== k || regSnap.get("eventId") !== event.id) {
    notFound();
  }
  if (!surveySnap.exists || surveySnap.get("status") !== "sent") notFound();

  const questions: RegistrationFieldDef[] = surveySnap.get("questions") ?? [];
  const respSnap = await db
    .doc(`events/${event.id}/surveys/${surveyId}/responses/${registrationId}`)
    .get();
  const initialAnswers: Record<string, string> = respSnap.exists
    ? (respSnap.get("answers") ?? {})
    : {};

  return (
    <main className="flex-1 bg-[#f6f5f2]">
      <div className="relative h-24 overflow-hidden border-b-2 border-zinc-950">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(150deg, #f6f5f2 0%, ${event.themeColor} 130%)` }}
        />
        <Grain opacity={0.3} />
      </div>
      <div className="mx-auto max-w-xl px-6 py-12">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">{event.title}</p>
        <h1 className="mt-2 text-2xl font-black tracking-tighter">{surveySnap.get("title")}</h1>
        {surveySnap.get("description") && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">{surveySnap.get("description")}</p>
        )}
        <SurveyForm
          eventId={event.id}
          surveyId={surveyId}
          registrationId={registrationId}
          qrToken={k}
          questions={questions}
          themeColor={event.themeColor}
          initialAnswers={initialAnswers}
          alreadyAnswered={respSnap.exists}
        />
      </div>
    </main>
  );
}

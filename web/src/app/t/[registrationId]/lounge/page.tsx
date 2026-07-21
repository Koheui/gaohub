import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getLoungeEntries, getLoungeSpeakers } from "@/lib/server/lounge";
import { Grain } from "@/components/Grain";
import { LoungeRoom } from "@/components/LoungeRoom";

export const dynamic = "force-dynamic";

/**
 * コミュニティラウンジ専用ページ。チケットリンク(registrationId + qrToken)で
 * 本人確認し、登壇者・参加者の一覧とメッセージ送信を提供する。
 */
export default async function LoungePage(props: {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { registrationId } = await props.params;
  const { k } = await props.searchParams;
  if (!k) notFound();

  const db = adminDb();
  const regSnap = await db.doc(`registrations/${registrationId}`).get();
  if (!regSnap.exists || regSnap.get("qrToken") !== k) notFound();
  if (regSnap.get("status") !== "confirmed") notFound();

  const eventId = regSnap.get("eventId") as string;
  const eventSnap = await db.doc(`events/${eventId}`).get();
  if (!eventSnap.exists || !eventSnap.get("loungeEnabled")) notFound();
  // グレード制限: paid の場合は有料チケットの参加者のみ
  const loungeAccess = (eventSnap.get("loungeAccess") as "all" | "paid") ?? "all";
  if (loungeAccess === "paid" && (regSnap.get("amountJpy") ?? 0) <= 0) notFound();

  const attendee = regSnap.get("attendee") as {
    name: string;
    company: string;
    jobTitle: string;
  };
  const themeColor: string = eventSnap.get("themeColor") ?? "#18181b";

  const [entries, speakers] = await Promise.all([
    getLoungeEntries(eventId),
    getLoungeSpeakers(eventId),
  ]);
  const selfProfile = entries.find((e) => e.registrationId === registrationId) ?? null;

  return (
    <main className="flex-1 bg-[#f6f5f2]">
      <div className="relative overflow-hidden border-b-2 border-zinc-950">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(150deg, #f6f5f2 0%, ${themeColor} 130%)`,
          }}
        />
        <Grain opacity={0.3} />
        <div className="relative mx-auto max-w-4xl px-6 py-8">
          <Link
            href={`/t/${registrationId}?k=${k}`}
            className="text-[11px] font-black uppercase tracking-[0.2em] hover:underline"
          >
            ← チケットへ戻る
          </Link>
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.35em] opacity-60">
            Community Lounge
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tighter sm:text-4xl">
            {eventSnap.get("title")}
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-700">
            登壇者・参加者とつながるコミュニティラウンジ。メッセージはメールで届き、
            互いのメールアドレスは公開されません。
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <LoungeRoom
          registrationId={registrationId}
          qrToken={k}
          categories={eventSnap.get("loungeCategories") ?? []}
          initialEntries={entries}
          initialSpeakers={speakers}
          initialSelfProfile={selfProfile}
          defaultName={attendee.name}
          defaultCompany={attendee.company ?? ""}
          defaultJobTitle={attendee.jobTitle ?? ""}
        />
      </div>
    </main>
  );
}

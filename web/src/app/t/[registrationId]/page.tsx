import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { adminDb } from "@/lib/firebase/admin";
import { formatDateRange, formatJpy } from "@/lib/format";
import { Grain } from "@/components/Grain";
import { SessionReservations, type ReservableSession } from "@/components/SessionReservations";
import { CommunityLounge, type LoungeDirectoryEntry } from "@/components/CommunityLounge";

export const dynamic = "force-dynamic";

export default async function TicketPage(props: {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { registrationId } = await props.params;
  const { k } = await props.searchParams;
  if (!k) notFound();

  const db = adminDb();
  const regSnap = await db.doc(`registrations/${registrationId}`).get();
  if (!regSnap.exists || regSnap.get("qrToken") !== k) notFound();

  const status: string = regSnap.get("status");
  const eventSnap = await db.doc(`events/${regSnap.get("eventId")}`).get();
  if (!eventSnap.exists) notFound();

  const themeColor: string = eventSnap.get("themeColor") ?? "#18181b";
  const attendee = regSnap.get("attendee") as {
    name: string;
    company: string;
    jobTitle: string;
  };

  if (status === "pending_payment") {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold">決済を確認しています…</h1>
          <p className="mt-3 text-sm text-zinc-600">
            決済が完了すると、このページにQRチケットが表示され、確認メールが届きます。
            数十秒経っても切り替わらない場合はページを再読み込みしてください。
          </p>
          <meta httpEquiv="refresh" content="5" />
        </div>
      </main>
    );
  }

  if (status !== "confirmed") notFound();

  const qrToken: string = regSnap.get("qrToken");
  const qrDataUrl = await QRCode.toDataURL(qrToken, {
    width: 320,
    margin: 1,
  });

  const sessionsSnap = await db
    .collection(`events/${regSnap.get("eventId")}/sessions`)
    .orderBy("startsAt", "asc")
    .get();
  const reservableSessions: ReservableSession[] = sessionsSnap.docs
    .filter((d) => !d.get("isComingSoon"))
    .map((d) => ({
      id: d.id,
      title: d.get("title"),
      track: d.get("track") ?? "",
      startsAtIso: d.get("startsAt").toDate().toISOString(),
      endsAtIso: d.get("endsAt").toDate().toISOString(),
      capacity: d.get("capacity") ?? null,
      reservedCount: d.get("reservedCount") ?? 0,
    }));
  const reservedSessionIds: string[] = regSnap.get("reservedSessionIds") ?? [];

  const loungeAccess: string = eventSnap.get("loungeAccess") ?? "all";
  const loungeEnabled: boolean =
    (eventSnap.get("loungeEnabled") ?? false) &&
    (loungeAccess !== "paid" || (regSnap.get("amountJpy") ?? 0) > 0);
  let loungeSelfProfile: LoungeDirectoryEntry | null = null;
  if (loungeEnabled) {
    const profileSnap = await db
      .doc(`events/${regSnap.get("eventId")}/loungeProfiles/${registrationId}`)
      .get();
    if (profileSnap.exists) {
      loungeSelfProfile = {
        registrationId,
        name: profileSnap.get("name") ?? "",
        company: profileSnap.get("company") ?? "",
        jobTitle: profileSnap.get("jobTitle") ?? "",
        category: profileSnap.get("category") ?? "",
        bio: profileSnap.get("bio") ?? "",
      };
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 bg-[#f6f5f2]">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border-2 border-zinc-950 bg-white">
        <div
          className="relative overflow-hidden px-6 py-5 text-zinc-950"
          style={{
            background: `linear-gradient(150deg, #f6f5f2 0%, ${themeColor} 120%)`,
          }}
        >
          <Grain opacity={0.3} />
          <p className="relative text-[10px] font-black uppercase tracking-[0.35em] opacity-60">
            Ticket
          </p>
          <h1 className="relative mt-1 text-lg font-black leading-snug tracking-tight">
            {eventSnap.get("title")}
          </h1>
        </div>
        <div className="px-6 py-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="入場QRコード" className="mx-auto h-64 w-64" />
          <p className="mt-4 text-xl font-black tracking-tight">{attendee.name}</p>
          {attendee.company && <p className="text-sm text-zinc-500">{attendee.company}</p>}
          <p className="mt-2 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
            {regSnap.get("ticketTypeName")} ・ {formatJpy(regSnap.get("amountJpy") ?? 0)}
          </p>
          <dl className="mt-6 border-t border-dashed border-zinc-200 pt-4 text-left text-sm">
            <div className="flex gap-3">
              <dt className="w-12 shrink-0 text-zinc-400">日時</dt>
              <dd>
                {formatDateRange(
                  eventSnap.get("startsAt").toDate(),
                  eventSnap.get("endsAt").toDate()
                )}
              </dd>
            </div>
            <div className="mt-1.5 flex gap-3">
              <dt className="w-12 shrink-0 text-zinc-400">会場</dt>
              <dd>{eventSnap.get("venueName") || "オンライン"}</dd>
            </div>
          </dl>
          <p className="mt-6 text-xs text-zinc-400">
            当日は受付でこのQRコードをご提示ください
          </p>
          <SessionReservations
            registrationId={registrationId}
            qrToken={qrToken}
            sessions={reservableSessions}
            initialReservedIds={reservedSessionIds}
          />
          {loungeEnabled && (
            <CommunityLounge
              selfProfile={loungeSelfProfile}
              loungeUrl={`/t/${registrationId}/lounge?k=${qrToken}`}
            />
          )}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTicketTypes, getPublishedEventBySlug } from "@/lib/server/events";
import { RegisterForm } from "./RegisterForm";
import { formatDateRange } from "@/lib/format";
import { Grain } from "@/components/Grain";

export const dynamic = "force-dynamic";

export default async function RegisterPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { slug } = await props.params;
  const { ticket } = await props.searchParams;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const tickets = await getPublicTicketTypes(event.id);
  const available = tickets.filter((t) => !t.soldOut);
  if (available.length === 0) notFound();

  const selected = available.find((t) => t.id === ticket) ?? available[0];

  return (
    <main className="flex-1 bg-[#f6f5f2]">
      <div className="relative h-24 overflow-hidden border-b-2 border-zinc-950">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(150deg, #f6f5f2 0%, ${event.themeColor} 130%)`,
          }}
        />
        <Grain opacity={0.3} />
      </div>
      <div className="mx-auto max-w-xl px-6 py-12">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">
          {formatDateRange(event.startsAt, event.endsAt)}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tighter">{event.title}</h1>
        <h2 className="mt-10 text-lg font-black tracking-tight">参加申し込み</h2>
        <p className="mt-2 text-xs text-zinc-500">
          申込済みの方は{" "}
          <Link href={`/e/${event.slug}/my-ticket`} className="font-bold underline">
            マイチケット
          </Link>{" "}
          からセッション予約の確認・変更ができます
        </p>
        <RegisterForm
          eventId={event.id}
          slug={event.slug}
          themeColor={event.themeColor}
          tickets={available}
          initialTicketId={selected.id}
          registrationFields={event.registrationFields}
          askCompany={event.askCompany}
          requireCompany={event.requireCompany}
          askJobTitle={event.askJobTitle}
          requireJobTitle={event.requireJobTitle}
          companyFieldType={event.companyFieldType}
          companyFieldOptions={event.companyFieldOptions}
          jobTitleFieldType={event.jobTitleFieldType}
          jobTitleFieldOptions={event.jobTitleFieldOptions}
          loungeEnabled={event.loungeEnabled}
        />
      </div>
    </main>
  );
}

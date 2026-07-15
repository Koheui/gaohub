import { notFound } from "next/navigation";
import { getPublicTicketTypes, getPublishedEventBySlug } from "@/lib/server/events";
import { RegisterForm } from "./RegisterForm";
import { formatDateRange } from "@/lib/format";

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
    <main className="flex-1">
      <div className="h-2" style={{ backgroundColor: event.themeColor }} />
      <div className="mx-auto max-w-xl px-6 py-14">
        <p className="text-sm text-zinc-500">{formatDateRange(event.startsAt, event.endsAt)}</p>
        <h1 className="mt-1 text-2xl font-bold">{event.title}</h1>
        <h2 className="mt-8 text-lg font-semibold">参加申し込み</h2>
        <RegisterForm
          eventId={event.id}
          slug={event.slug}
          themeColor={event.themeColor}
          tickets={available}
          initialTicketId={selected.id}
        />
      </div>
    </main>
  );
}

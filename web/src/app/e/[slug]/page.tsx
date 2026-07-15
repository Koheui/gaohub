import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicTicketTypes, getPublishedEventBySlug } from "@/lib/server/events";
import { formatDateRange, formatJpy } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) return {};
  return {
    title: event.title,
    description: event.description.slice(0, 120),
  };
}

export default async function PublicEventPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const tickets = await getPublicTicketTypes(event.id);

  return (
    <main className="flex-1">
      <div className="h-2" style={{ backgroundColor: event.themeColor }} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-sm font-medium" style={{ color: event.themeColor }}>
          EVENT
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold leading-tight">{event.title}</h1>

        <dl className="mt-6 space-y-2 text-sm text-zinc-700">
          <div className="flex gap-3">
            <dt className="w-14 shrink-0 text-zinc-400">日時</dt>
            <dd>{formatDateRange(event.startsAt, event.endsAt)}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-14 shrink-0 text-zinc-400">会場</dt>
            <dd>
              {event.venueName || "オンライン"}
              {event.venueAddress && (
                <span className="block text-zinc-500">{event.venueAddress}</span>
              )}
            </dd>
          </div>
        </dl>

        {event.description && (
          <div className="mt-10 whitespace-pre-wrap leading-relaxed text-zinc-800">
            {event.description}
          </div>
        )}

        <section className="mt-12">
          <h2 className="text-xl font-bold">チケット</h2>
          {tickets.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">チケットは準備中です。</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {tickets.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 p-5"
                >
                  <div>
                    <p className="font-medium">{t.name}</p>
                    {t.description && (
                      <p className="mt-0.5 text-sm text-zinc-500">{t.description}</p>
                    )}
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {formatJpy(t.priceJpy)}
                    </p>
                  </div>
                  {t.soldOut ? (
                    <span className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
                      売り切れ
                    </span>
                  ) : (
                    <Link
                      href={`/e/${event.slug}/register?ticket=${t.id}`}
                      className="rounded-lg px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
                      style={{ backgroundColor: event.themeColor }}
                    >
                      申し込む
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-16 border-t border-zinc-100 pt-6 text-xs text-zinc-400">
          Powered by Neo EventHub
        </footer>
      </div>
    </main>
  );
}

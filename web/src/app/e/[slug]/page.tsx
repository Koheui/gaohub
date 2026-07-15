import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPublicSessions,
  getPublicTicketTypes,
  getPublishedEventBySlug,
  type PublicSession,
  type PublicSpeaker,
} from "@/lib/server/events";
import { formatJpy } from "@/lib/format";

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
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 120),
      ...(event.coverImageUrl ? { images: [event.coverImageUrl] } : {}),
    },
  };
}

const dayFmt = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});
const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});
const heroDateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});

function heroDateText(start: Date, end: Date): string {
  const sameDay = dayFmt.format(start) === dayFmt.format(end);
  return sameDay
    ? heroDateFmt.format(start)
    : `${heroDateFmt.format(start)} — ${dayFmt.format(end)}`;
}

function groupSessionsByDay(sessions: PublicSession[]): [string, PublicSession[]][] {
  const groups = new Map<string, PublicSession[]>();
  for (const s of sessions) {
    const key = dayFmt.format(s.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return [...groups.entries()];
}

function uniqueSpeakers(sessions: PublicSession[]): PublicSpeaker[] {
  const seen = new Map<string, PublicSpeaker>();
  for (const s of sessions) {
    for (const sp of s.speakers) {
      if (sp.name && !seen.has(sp.name)) seen.set(sp.name, sp);
    }
  }
  return [...seen.values()];
}

function Avatar({ speaker, size }: { speaker: PublicSpeaker; size: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-28 w-28 sm:h-32 sm:w-32" : "h-9 w-9";
  return speaker.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={speaker.photoUrl}
      alt={speaker.name}
      className={`${cls} rounded-full object-cover`}
    />
  ) : (
    <span
      className={`${cls} flex items-center justify-center rounded-full bg-zinc-200 font-bold text-zinc-500 ${
        size === "lg" ? "text-3xl" : "text-sm"
      }`}
    >
      {speaker.name.charAt(0)}
    </span>
  );
}

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-[0.25em]"
      style={{ color }}
    >
      {children}
    </p>
  );
}

export default async function PublicEventPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const [tickets, sessions] = await Promise.all([
    getPublicTicketTypes(event.id),
    getPublicSessions(event.id),
  ]);
  const speakers = uniqueSpeakers(sessions);
  const days = groupSessionsByDay(sessions);
  const color = event.themeColor;
  const registerHref = `/e/${event.slug}/register`;
  const hasTickets = tickets.length > 0;

  return (
    <main className="flex-1 bg-white">
      {/* ─── 固定ナビ ─── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="truncate pr-4 text-sm font-bold">{event.title}</span>
          <nav className="flex items-center gap-5 text-sm">
            <div className="hidden items-center gap-5 text-zinc-300 sm:flex">
              {event.description && (
                <a href="#about" className="hover:text-white">概要</a>
              )}
              {sessions.length > 0 && (
                <a href="#sessions" className="hover:text-white">タイムテーブル</a>
              )}
              {speakers.length > 0 && (
                <a href="#speakers" className="hover:text-white">登壇者</a>
              )}
            </div>
            {hasTickets && (
              <Link
                href={registerHref}
                className="rounded-full px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-85"
                style={{ backgroundColor: color }}
              >
                参加登録
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* ─── ヒーロー ─── */}
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        {event.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30" />
          </>
        ) : (
          <>
            {/* カバー画像なし: テーマカラーからジェネレーティブ背景を生成 */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 80% 60% at 70% -10%, ${color}66, transparent),
                  radial-gradient(ellipse 60% 50% at 10% 110%, ${color}40, transparent)
                `,
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
                backgroundSize: "56px 56px",
                maskImage: "radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent)",
              }}
            />
          </>
        )}

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pb-32 sm:pt-28">
          <p
            className="inline-block rounded-full border px-4 py-1.5 text-sm font-medium tracking-wide"
            style={{ borderColor: `${color}88`, color: "#fff", backgroundColor: `${color}22` }}
          >
            {heroDateText(event.startsAt, event.endsAt)}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            {event.title}
          </h1>
          <p className="mt-6 text-lg text-zinc-300">
            {event.venueName || "オンライン開催"}
            {event.venueAddress && (
              <span className="ml-3 text-sm text-zinc-500">{event.venueAddress}</span>
            )}
          </p>
          {hasTickets && (
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={registerHref}
                className="rounded-full px-8 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: color, boxShadow: `0 8px 32px ${color}55` }}
              >
                参加登録はこちら
              </Link>
              {sessions.length > 0 && (
                <a
                  href="#sessions"
                  className="rounded-full border border-white/25 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  タイムテーブルを見る
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── 概要 ─── */}
      {event.description && (
        <section id="about" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-20 sm:py-28">
          <SectionLabel color={color}>About</SectionLabel>
          <div className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-zinc-800">
            {event.description}
          </div>
        </section>
      )}

      {/* ─── タイムテーブル ─── */}
      {sessions.length > 0 && (
        <section id="sessions" className="scroll-mt-20 bg-zinc-50 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <SectionLabel color={color}>Timetable</SectionLabel>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">タイムテーブル</h2>

            {days.map(([day, daySessions], di) => (
              <div key={day} className="mt-12">
                {days.length > 1 && (
                  <h3 className="flex items-baseline gap-3 text-lg font-bold">
                    <span style={{ color }}>DAY {di + 1}</span>
                    <span className="text-zinc-500">{day}</span>
                  </h3>
                )}
                <ol className="mt-6 space-y-4">
                  {daySessions.map((s) => (
                    <li
                      key={s.id}
                      className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md sm:flex sm:gap-8"
                    >
                      <div className="w-32 shrink-0">
                        <p className="font-mono text-sm font-bold tabular-nums text-zinc-900">
                          {timeFmt.format(s.startsAt)}
                          <span className="text-zinc-400"> – {timeFmt.format(s.endsAt)}</span>
                        </p>
                        {s.track && (
                          <span
                            className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: color }}
                          >
                            {s.track}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex-1 sm:mt-0">
                        <h4 className="text-lg font-bold leading-snug">{s.title}</h4>
                        {s.description && (
                          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                            {s.description}
                          </p>
                        )}
                        {s.speakers.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                            {s.speakers.map((sp, i) => (
                              <div key={i} className="flex items-center gap-2.5">
                                <Avatar speaker={sp} size="sm" />
                                <div className="leading-tight">
                                  <p className="text-sm font-semibold">{sp.name}</p>
                                  <p className="text-xs text-zinc-500">
                                    {[sp.company, sp.title].filter(Boolean).join(" / ")}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 登壇者 ─── */}
      {speakers.length > 0 && (
        <section id="speakers" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-20 sm:py-28">
          <SectionLabel color={color}>Speakers</SectionLabel>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">登壇者</h2>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {speakers.map((sp) => (
              <div key={sp.name} className="text-center">
                <div
                  className="mx-auto w-fit rounded-full p-1"
                  style={{ background: `linear-gradient(135deg, ${color}, transparent 70%)` }}
                >
                  <div className="rounded-full bg-white p-1">
                    <Avatar speaker={sp} size="lg" />
                  </div>
                </div>
                <p className="mt-4 font-bold">{sp.name}</p>
                <p className="mt-1 text-sm leading-snug text-zinc-500">
                  {sp.company}
                  {sp.company && sp.title && <br />}
                  {sp.title}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── チケット ─── */}
      <section id="tickets" className="scroll-mt-20 bg-zinc-950 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <SectionLabel color={color}>Tickets</SectionLabel>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">チケット</h2>
          {!hasTickets ? (
            <p className="mt-6 text-zinc-400">チケットは準備中です。公開までお待ちください。</p>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-7"
                >
                  <p className="font-bold">{t.name}</p>
                  {t.description && (
                    <p className="mt-1 text-sm text-zinc-400">{t.description}</p>
                  )}
                  <p className="mt-6 text-4xl font-black tabular-nums">
                    {formatJpy(t.priceJpy)}
                  </p>
                  <div className="mt-8 flex-1" />
                  {t.soldOut ? (
                    <span className="rounded-full bg-white/10 py-3 text-center text-sm text-zinc-400">
                      売り切れ
                    </span>
                  ) : (
                    <Link
                      href={`${registerHref}?ticket=${t.id}`}
                      className="rounded-full py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-85"
                      style={{ backgroundColor: color }}
                    >
                      このチケットで申し込む
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-zinc-950 pb-10 text-center">
        <p className="border-t border-white/10 pt-8 text-xs text-zinc-600">
          Powered by <span className="font-bold text-zinc-400">GAO HUB</span>
        </p>
      </footer>
    </main>
  );
}

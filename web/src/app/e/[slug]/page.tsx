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
import { Grain } from "@/components/Grain";
import { Countdown } from "@/components/Countdown";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) return {};
  // og:image はファイル規約 opengraph-image.tsx が自動生成する
  return {
    title: event.title,
    description: event.description.slice(0, 120),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 120),
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
const yearFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  timeZone: "Asia/Tokyo",
});

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

function SmallAvatar({ speaker }: { speaker: PublicSpeaker }) {
  return speaker.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={speaker.photoUrl}
      alt={speaker.name}
      className="h-9 w-9 rounded-full object-cover"
    />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-sm font-black text-white">
      {speaker.name.charAt(0)}
    </span>
  );
}

/** Kodakのスペック表記風: 極小ラベル+太い値 */
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-tight">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">{label}</p>
      <p className="mt-1 text-sm font-black sm:text-base">{value}</p>
    </div>
  );
}

/** セクション背景の巨大アウトライン文字(参考LPのゴーストタイポ) */
function Ghost({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -top-4 right-0 select-none whitespace-nowrap text-[16vw] font-black uppercase leading-none tracking-tighter text-transparent sm:text-[10rem] ${
        light
          ? "[-webkit-text-stroke:1.5px_rgba(246,245,242,0.14)]"
          : "[-webkit-text-stroke:1.5px_rgba(24,24,27,0.12)]"
      }`}
    >
      {text}
    </span>
  );
}

function SectionHead({
  label,
  title,
  light = false,
}: {
  label: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div className="relative">
      <p
        className={`text-[11px] font-black uppercase tracking-[0.35em] ${
          light ? "text-white/50" : "text-zinc-950/50"
        }`}
      >
        {label}
      </p>
      <h2
        className={`mt-2 text-4xl font-black tracking-tighter sm:text-5xl ${
          light ? "text-white" : "text-zinc-950"
        }`}
      >
        {title}
      </h2>
    </div>
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
  const tracks = [...new Set(sessions.map((s) => s.track).filter(Boolean))];
  const color = event.themeColor;
  const registerHref = `/e/${event.slug}/register`;
  const hasTickets = tickets.length > 0;
  const sameDay = dayFmt.format(event.startsAt) === dayFmt.format(event.endsAt);
  const dateValue = sameDay
    ? dayFmt.format(event.startsAt)
    : `${dayFmt.format(event.startsAt)} – ${dayFmt.format(event.endsAt)}`;
  const isUpcoming = event.startsAt.getTime() > Date.now();

  const stats: [string, string][] = [
    ["Days", String(Math.max(days.length, 1))],
    ["Sessions", String(sessions.length)],
    ["Speakers", String(speakers.length)],
    ["Tracks", String(Math.max(tracks.length, 1))],
  ];

  return (
    <main className="flex-1 bg-[#f6f5f2] text-zinc-950">
      {/* ─── 固定ナビ ─── */}
      <header className="sticky top-0 z-50 border-b-2 border-zinc-950 bg-[#f6f5f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="truncate pr-4 text-sm font-black uppercase tracking-tight">
            {event.title}
          </span>
          <nav className="flex items-center gap-5 text-sm">
            <div className="hidden items-center gap-5 font-bold text-zinc-600 sm:flex">
              {event.description && <a href="#about" className="hover:text-zinc-950">概要</a>}
              {sessions.length > 0 && (
                <a href="#sessions" className="hover:text-zinc-950">タイムテーブル</a>
              )}
              {speakers.length > 0 && (
                <a href="#speakers" className="hover:text-zinc-950">登壇者</a>
              )}
            </div>
            {hasTickets && (
              <Link
                href={registerHref}
                className="rounded-full bg-zinc-950 px-5 py-1.5 text-sm font-black text-white hover:bg-zinc-700"
              >
                参加登録
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* ─── ヒーロー ─── */}
      <section className="relative overflow-hidden border-b-2 border-zinc-950">
        {event.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(150deg, #f6f5f2ee 0%, #f6f5f2cc 38%, transparent 100%)`,
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(150deg, #f6f5f2 0%, #f6f5f2 32%, ${color} 88%)`,
            }}
          />
        )}
        <Grain opacity={0.35} />
        {/* 巨大アウトライン年号 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-8 right-4 select-none text-[22vw] font-black leading-none tracking-tighter text-transparent [-webkit-text-stroke:2px_rgba(24,24,27,0.18)] sm:text-[14rem]"
        >
          {yearFmt.format(event.startsAt).replace("年", "")}
        </span>

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-14 sm:pb-32 sm:pt-20">
          <div className="flex flex-wrap gap-x-12 gap-y-4">
            <Spec label="Date" value={dateValue} />
            <Spec label="Year" value={yearFmt.format(event.startsAt)} />
            <Spec label="Venue" value={event.venueName || "Online"} />
            <Spec
              label="Doors"
              value={`${timeFmt.format(event.startsAt)} – ${timeFmt.format(event.endsAt)}`}
            />
          </div>

          <h1 className="mt-14 max-w-5xl break-words text-6xl font-black leading-[0.95] tracking-tighter sm:mt-20 sm:text-8xl lg:text-9xl">
            {event.title}
          </h1>

          <p className="mt-6 font-mono text-xs font-bold tracking-[0.15em] text-zinc-950/70 sm:text-sm">
            [ {dateValue} — {event.venueName || "Online"}
            {event.venueAddress ? `, ${event.venueAddress}` : ""} ]
          </p>

          {hasTickets && (
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <Link
                href={registerHref}
                className="rounded-full bg-zinc-950 px-9 py-4 text-base font-black text-white transition-transform hover:scale-[1.02]"
              >
                参加登録はこちら →
              </Link>
              {sessions.length > 0 && (
                <a
                  href="#sessions"
                  className="rounded-full border-2 border-zinc-950 px-7 py-3.5 text-sm font-black hover:bg-zinc-950 hover:text-white"
                >
                  タイムテーブル
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── 統計ストリップ ─── */}
      {sessions.length > 0 && (
        <section className="border-b-2 border-zinc-950">
          <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
            {stats.map(([label, value], i) => (
              <div
                key={label}
                className={`flex flex-col items-center border-zinc-950 py-8 ${
                  i > 0 ? "sm:border-l-2" : ""
                } ${i % 2 === 1 ? "border-l-2 sm:border-l-2" : ""} ${i >= 2 ? "border-t-2 sm:border-t-0" : ""}`}
              >
                <span className="text-5xl font-black tabular-nums tracking-tighter">{value}</span>
                <span className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                  [{label}]
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── カウントダウン ─── */}
      {isUpcoming && (
        <section className="relative overflow-hidden border-b-2 border-zinc-950 bg-zinc-950 py-16 text-white">
          <Grain opacity={0.25} />
          <div className="relative mx-auto max-w-6xl px-6">
            <p className="text-center text-[11px] font-black uppercase tracking-[0.4em] text-white/50">
              Count every second until the event
            </p>
            <div className="mt-8">
              <Countdown targetIso={event.startsAt.toISOString()} />
            </div>
          </div>
        </section>
      )}

      {/* ─── 概要 ─── */}
      {event.description && (
        <section id="about" className="relative mx-auto max-w-3xl scroll-mt-20 overflow-hidden px-6 py-20 sm:py-28">
          <Ghost text="About" />
          <SectionHead label="About" title="開催概要" />
          <div className="relative mt-8 whitespace-pre-wrap text-lg font-medium leading-relaxed text-zinc-800">
            {event.description}
          </div>
        </section>
      )}

      {/* ─── タイムテーブル ─── */}
      {sessions.length > 0 && (
        <section
          id="sessions"
          className="relative scroll-mt-20 overflow-hidden border-y-2 border-zinc-950 bg-white py-20 sm:py-28"
        >
          <div className="relative mx-auto max-w-4xl px-6">
            <Ghost text="Schedule" />
            <SectionHead label="Timetable" title="タイムテーブル" />

            {days.map(([day, daySessions], di) => (
              <div key={day} className="mt-14">
                {days.length > 1 && (
                  <h3 className="flex items-baseline gap-4">
                    <span className="text-3xl font-black tracking-tighter" style={{ color }}>
                      DAY {di + 1}
                    </span>
                    <span className="text-sm font-bold text-zinc-500">{day}</span>
                  </h3>
                )}
                <ol className="mt-6 divide-y-2 divide-zinc-950 border-y-2 border-zinc-950">
                  {daySessions.map((s) => (
                    <li key={s.id} className="py-7 sm:flex sm:gap-10">
                      <div className="w-36 shrink-0">
                        <p className="font-mono text-lg font-black tabular-nums leading-none">
                          {timeFmt.format(s.startsAt)}
                        </p>
                        <p className="mt-1 font-mono text-xs font-bold tabular-nums text-zinc-400">
                          – {timeFmt.format(s.endsAt)}
                        </p>
                        {s.track && (
                          <span
                            className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                            style={{ backgroundColor: color }}
                          >
                            {s.track}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex-1 sm:mt-0">
                        <h4 className="text-2xl font-black leading-tight tracking-tight">
                          {s.title}
                        </h4>
                        {s.description && (
                          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                            {s.description}
                          </p>
                        )}
                        {s.speakers.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                            {s.speakers.map((sp, i) => (
                              <div key={i} className="flex items-center gap-2.5">
                                <SmallAvatar speaker={sp} />
                                <div className="leading-tight">
                                  <p className="text-sm font-black">{sp.name}</p>
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
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

      {/* ─── 登壇者: ダーク面+デュオトーン写真 ─── */}
      {speakers.length > 0 && (
        <section
          id="speakers"
          className="relative scroll-mt-20 overflow-hidden bg-zinc-950 py-20 text-white sm:py-28"
        >
          <Grain opacity={0.25} />
          <div className="relative mx-auto max-w-6xl px-6">
            <Ghost text="Speakers" light />
            <SectionHead label="Speakers" title="登壇者" light />
            <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
              {speakers.map((sp) => (
                <div key={sp.name}>
                  <div
                    className="relative aspect-square overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    {sp.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sp.photoUrl}
                        alt={sp.name}
                        className="h-full w-full object-cover grayscale mix-blend-luminosity"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-7xl font-black text-zinc-950/70">
                        {sp.name.charAt(0)}
                      </span>
                    )}
                    <Grain opacity={0.3} blend="soft-light" />
                  </div>
                  <p className="mt-4 border-l-2 pl-3 text-lg font-black leading-tight tracking-tight" style={{ borderColor: color }}>
                    {sp.name}
                  </p>
                  <p className="mt-1 pl-3 text-[11px] font-bold uppercase leading-relaxed tracking-[0.15em] text-zinc-400">
                    {[sp.company, sp.title].filter(Boolean).join(" / ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── チケット ─── */}
      <section
        id="tickets"
        className="relative scroll-mt-20 overflow-hidden border-t-2 border-zinc-950 py-20 sm:py-28"
      >
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(165deg, ${color} 0%, ${color} 55%, #f6f5f2 160%)` }}
        />
        <Grain opacity={0.35} />
        <div className="relative mx-auto max-w-4xl px-6">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-zinc-950/60">
            Tickets
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-tighter text-zinc-950 sm:text-5xl">
            チケット
          </h2>
          {!hasTickets ? (
            <p className="mt-6 font-bold text-zinc-950/70">
              チケットは準備中です。公開までお待ちください。
            </p>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tickets.map((t) => (
                <div key={t.id} className="flex flex-col border-2 border-zinc-950 bg-[#f6f5f2] p-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    1 ticket
                  </p>
                  <p className="mt-1 text-xl font-black tracking-tight">{t.name}</p>
                  {t.description && (
                    <p className="mt-1 text-sm font-medium text-zinc-600">{t.description}</p>
                  )}
                  <p className="mt-8 text-5xl font-black tabular-nums tracking-tighter">
                    {formatJpy(t.priceJpy)}
                  </p>
                  <div className="mt-8 flex-1" />
                  {t.soldOut ? (
                    <span className="border-2 border-zinc-300 py-3 text-center text-sm font-black text-zinc-400">
                      SOLD OUT
                    </span>
                  ) : (
                    <Link
                      href={`${registerHref}?ticket=${t.id}`}
                      className="bg-zinc-950 py-3.5 text-center text-sm font-black text-white hover:bg-zinc-700"
                    >
                      このチケットで申し込む →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 締めのCTA ─── */}
      {hasTickets && (
        <section className="relative overflow-hidden border-t-2 border-zinc-950 bg-zinc-950 py-24 text-center text-white">
          <Grain opacity={0.25} />
          <div className="relative mx-auto max-w-4xl px-6">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50">
              Join us
            </p>
            <p className="mt-4 text-4xl font-black tracking-tighter sm:text-6xl">
              会場でお会いしましょう。
            </p>
            <Link
              href={registerHref}
              className="mt-10 inline-block rounded-full px-10 py-4 text-base font-black text-zinc-950 transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "#f6f5f2" }}
            >
              参加登録はこちら →
            </Link>
          </div>
        </section>
      )}

      <footer className="border-t-2 border-zinc-950 bg-zinc-950 py-8 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-zinc-500">
          Powered by <span className="text-white">GAO HUB</span>
        </p>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPublicSessions,
  getPublicSpeakers,
  getPublicTicketTypes,
  getPublishedEventBySlug,
  type PublicSession,
  type PublicSpeaker,
} from "@/lib/server/events";
import { formatJpy } from "@/lib/format";
import { Grain } from "@/components/Grain";
import { CountdownBand } from "@/components/Countdown";
import { Parallax, Reveal } from "@/components/motion";
import { AnimatedTitle } from "@/components/lp/AnimatedTitle";
import { LP_THEMES } from "@/components/lp/theme";

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
    description: (event.tagline || event.description).slice(0, 120),
    openGraph: {
      title: event.title,
      description: (event.tagline || event.description).slice(0, 120),
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

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-tight">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">{label}</p>
      <p className="mt-1 text-sm font-black sm:text-base">{value}</p>
    </div>
  );
}

function Ghost({ text, light }: { text: string; light: boolean }) {
  return (
    <Parallax
      speed={0.12}
      className="pointer-events-none absolute -top-4 right-0 select-none"
    >
      <span
        aria-hidden
        className={`whitespace-nowrap text-[16vw] font-black uppercase leading-none tracking-tighter text-transparent sm:text-[10rem] ${
          light
            ? "[-webkit-text-stroke:1.5px_rgba(255,255,255,0.13)]"
            : "[-webkit-text-stroke:1.5px_rgba(24,24,27,0.12)]"
        }`}
      >
        {text}
      </span>
    </Parallax>
  );
}

function SectionHead({
  label,
  title,
  light,
}: {
  label: string;
  title: string;
  light: boolean;
}) {
  return (
    <Reveal>
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
    </Reveal>
  );
}

function SmallAvatar({ speaker, dark }: { speaker: PublicSpeaker; dark: boolean }) {
  return speaker.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={speaker.photoUrl} alt={speaker.name} className="h-9 w-9 rounded-full object-cover" />
  ) : (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
        dark ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"
      }`}
    >
      {speaker.name.charAt(0)}
    </span>
  );
}

export default async function PublicEventPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const [tickets, sessions, speakers] = await Promise.all([
    getPublicTicketTypes(event.id),
    getPublicSessions(event.id),
    getPublicSpeakers(event.id),
  ]);
  const speakerById = new Map(speakers.map((s) => [s.id, s]));
  const days = groupSessionsByDay(sessions);
  const tracks = [...new Set(sessions.map((s) => s.track).filter(Boolean))];
  const color = event.themeColor;
  const t = LP_THEMES[event.template];
  const dark = t.mode === "dark";
  const registerHref = `/e/${event.slug}/register`;
  const hasTickets = tickets.length > 0;
  const sameDay = dayFmt.format(event.startsAt) === dayFmt.format(event.endsAt);
  const dateValue = sameDay
    ? dayFmt.format(event.startsAt)
    : `${dayFmt.format(event.startsAt)} – ${dayFmt.format(event.endsAt)}`;
  const year = yearFmt.format(event.startsAt).replace("年", "");

  const stats: [string, string][] = [
    ["Days", String(Math.max(days.length, 1))],
    ["Sessions", String(sessions.length)],
    ["Speakers", String(speakers.length)],
    ["Tracks", String(Math.max(tracks.length, 1))],
  ];

  return (
    <main className={`flex-1 ${t.page}`}>
      {/* ─── 固定ナビ ─── */}
      <header className={`sticky top-0 z-50 backdrop-blur ${t.nav}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="truncate pr-4 text-sm font-black uppercase tracking-tight">
            {event.title}
          </span>
          <nav className="flex items-center gap-5 text-sm">
            <div className={`hidden items-center gap-5 font-bold sm:flex ${t.navLink}`}>
              {event.description && <a href="#about" className="hover:opacity-100">概要</a>}
              {sessions.length > 0 && <a href="#sessions">タイムテーブル</a>}
              {speakers.length > 0 && <a href="#speakers">登壇者</a>}
            </div>
            {hasTickets && (
              <Link
                href={registerHref}
                className={`px-5 py-1.5 text-sm font-black text-white hover:opacity-85 ${
                  event.template === "aurora" ? "rounded-full" : "rounded-full"
                }`}
                style={{ backgroundColor: dark || event.template === "aurora" ? color : "#09090b" }}
              >
                参加登録
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* ─── ヒーロー(テンプレート別背景) ─── */}
      <section className={`relative overflow-hidden ${event.template !== "aurora" ? `border-b ${event.template === "kodak" ? "border-b-2 border-zinc-950" : "border-white/15"}` : ""}`}>
        {/* 背景 */}
        {event.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImageUrl}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover ${dark ? "opacity-40" : ""}`}
            />
            <div
              className="absolute inset-0"
              style={{
                background: dark
                  ? `linear-gradient(150deg, #09090bee 0%, #09090bcc 40%, #09090b55 100%)`
                  : `linear-gradient(150deg, ${t.paper}ee 0%, ${t.paper}cc 38%, transparent 100%)`,
              }}
            />
          </>
        ) : event.template === "kodak" ? (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(150deg, ${t.paper} 0%, ${t.paper} 32%, ${color} 88%)`,
            }}
          />
        ) : event.template === "noir" ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 75% 65% at 72% 12%, ${color}88, transparent 65%), radial-gradient(ellipse 50% 45% at 8% 100%, ${color}44, transparent 70%), #09090b`,
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
                backgroundSize: "64px 64px",
                maskImage: "radial-gradient(ellipse 70% 70% at 60% 20%, black, transparent)",
              }}
            />
          </>
        ) : (
          // aurora: メッシュグラデーション(ぼかした色玉)
          <div className="absolute inset-0" style={{ backgroundColor: t.paper }}>
            <div
              className="absolute -left-24 -top-24 h-[34rem] w-[34rem] rounded-full opacity-50"
              style={{ backgroundColor: color, filter: "blur(110px)" }}
            />
            <div
              className="absolute -right-16 top-8 h-[26rem] w-[26rem] rounded-full opacity-35"
              style={{
                background: `color-mix(in oklch, ${color} 55%, #22d3ee)`,
                filter: "blur(110px)",
              }}
            />
            <div
              className="absolute bottom-[-8rem] left-1/3 h-[28rem] w-[28rem] rounded-full opacity-30"
              style={{
                background: `color-mix(in oklch, ${color} 45%, #34d399)`,
                filter: "blur(120px)",
              }}
            />
          </div>
        )}
        {event.template !== "aurora" && <Grain opacity={dark ? 0.28 : 0.35} />}

        {/* 巨大アウトライン年号(パララックス) */}
        <div className="pointer-events-none absolute -bottom-8 right-4">
          <Parallax speed={-0.14}>
            <span
              aria-hidden
              className={`select-none text-[22vw] font-black leading-none tracking-tighter text-transparent sm:text-[14rem] ${
                dark
                  ? "[-webkit-text-stroke:2px_rgba(255,255,255,0.16)]"
                  : "[-webkit-text-stroke:2px_rgba(24,24,27,0.18)]"
              }`}
            >
              {year}
            </span>
          </Parallax>
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-14 sm:pb-32 sm:pt-20">
          <div className="lp-fade-up flex flex-wrap gap-x-12 gap-y-4">
            <Spec label="Date" value={dateValue} />
            <Spec label="Year" value={yearFmt.format(event.startsAt)} />
            <Spec label="Venue" value={event.venueName || "Online"} />
            <Spec
              label="Doors"
              value={`${timeFmt.format(event.startsAt)} – ${timeFmt.format(event.endsAt)}`}
            />
          </div>

          {event.tagline && (
            <p
              className="lp-fade-up mt-14 text-lg font-black tracking-tight sm:mt-16 sm:text-2xl"
              style={{ animationDelay: "250ms", color: dark ? "#fff" : color }}
            >
              {event.tagline}
            </p>
          )}

          <h1
            className={`${event.tagline ? "mt-4" : "mt-14 sm:mt-20"} max-w-5xl break-words text-6xl font-black leading-[0.98] tracking-tighter sm:text-8xl lg:text-9xl`}
          >
            <AnimatedTitle text={event.title} baseDelayMs={350} />
          </h1>

          <p
            className="lp-fade-up mt-6 font-mono text-xs font-bold tracking-[0.15em] opacity-70 sm:text-sm"
            style={{ animationDelay: "700ms" }}
          >
            [ {dateValue} — {event.venueName || "Online"}
            {event.venueAddress ? `, ${event.venueAddress}` : ""} ]
          </p>

          {hasTickets && (
            <div
              className="lp-fade-up mt-12 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "850ms" }}
            >
              <Link
                href={registerHref}
                className="rounded-full px-9 py-4 text-base font-black text-white transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: dark || event.template === "aurora" ? color : "#09090b",
                  boxShadow: dark ? `0 8px 40px ${color}66` : undefined,
                }}
              >
                参加登録はこちら →
              </Link>
              {sessions.length > 0 && (
                <a
                  href="#sessions"
                  className={`rounded-full px-7 py-3.5 text-sm font-black ${
                    dark
                      ? "border border-white/30 text-white hover:bg-white/10"
                      : "border-2 border-zinc-950 hover:bg-zinc-950 hover:text-white"
                  }`}
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
        <section className={`border-b ${event.template === "kodak" ? "border-b-2 border-zinc-950" : dark ? "border-white/15" : "border-zinc-200"}`}>
          <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
            {stats.map(([label, value], i) => (
              <Reveal key={label} delayMs={i * 90}>
                <div
                  className={`flex flex-col items-center py-8 ${
                    event.template === "kodak" ? "border-zinc-950" : dark ? "border-white/15" : "border-zinc-200"
                  } ${i > 0 ? (event.template === "kodak" ? "sm:border-l-2" : "sm:border-l") : ""}`}
                >
                  <span className="text-5xl font-black tabular-nums tracking-tighter">{value}</span>
                  <span className={`mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.3em] ${t.muted}`}>
                    [{label}]
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ─── カウントダウン(開催後は自動で消える) ─── */}
      <CountdownBand targetIso={event.startsAt.toISOString()} />

      {/* ─── 概要 ─── */}
      {event.description && (
        <section id="about" className="relative mx-auto max-w-3xl scroll-mt-20 overflow-hidden px-6 py-20 sm:py-28">
          <Ghost text="About" light={t.ghostLight} />
          <SectionHead label="About" title="開催概要" light={dark} />
          <Reveal delayMs={120}>
            <div className={`relative mt-8 whitespace-pre-wrap text-lg font-medium leading-relaxed ${dark ? "text-zinc-300" : "text-zinc-800"}`}>
              {event.description}
            </div>
          </Reveal>
        </section>
      )}

      {/* ─── タイムテーブル ─── */}
      {sessions.length > 0 && (
        <section
          id="sessions"
          className={`relative scroll-mt-20 overflow-hidden py-20 sm:py-28 ${t.timetableBg} ${
            event.template === "kodak" ? "border-y-2 border-zinc-950" : `border-y ${dark ? "border-white/15" : "border-zinc-200"}`
          }`}
        >
          <div className="relative mx-auto max-w-4xl px-6">
            <Ghost text="Schedule" light={t.ghostLight} />
            <SectionHead label="Timetable" title="タイムテーブル" light={dark} />

            {days.map(([day, daySessions], di) => (
              <div key={day} className="mt-14">
                {days.length > 1 && (
                  <h3 className="flex items-baseline gap-4">
                    <span className="text-3xl font-black tracking-tighter" style={{ color }}>
                      DAY {di + 1}
                    </span>
                    <span className={`text-sm font-bold ${t.muted}`}>{day}</span>
                  </h3>
                )}
                <ol
                  className={`mt-6 ${
                    event.template === "kodak"
                      ? "divide-y-2 divide-zinc-950 border-y-2 border-zinc-950"
                      : `divide-y border-y ${t.divide}`
                  }`}
                >
                  {daySessions.map((s) => {
                    const sessionSpeakers = s.speakerIds
                      .map((sid) => speakerById.get(sid))
                      .filter((sp): sp is PublicSpeaker => !!sp);
                    return (
                      <li key={s.id} className="py-7 sm:flex sm:gap-10">
                        <div className="w-36 shrink-0">
                          <p className="font-mono text-lg font-black tabular-nums leading-none">
                            {timeFmt.format(s.startsAt)}
                          </p>
                          <p className={`mt-1 font-mono text-xs font-bold tabular-nums ${t.muted}`}>
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
                            <p className={`mt-3 text-sm leading-relaxed ${t.muted}`}>
                              {s.description}
                            </p>
                          )}
                          {sessionSpeakers.length > 0 && (
                            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                              {sessionSpeakers.map((sp) => (
                                <Link
                                  key={sp.id}
                                  href={`/e/${event.slug}/speakers/${sp.id}`}
                                  className="group flex items-center gap-2.5"
                                >
                                  <SmallAvatar speaker={sp} dark={dark} />
                                  <span className="leading-tight">
                                    <span className="block text-sm font-black group-hover:underline">
                                      {sp.name}
                                    </span>
                                    <span className={`block text-[11px] font-bold uppercase tracking-wider ${t.muted}`}>
                                      {[sp.company, sp.title].filter(Boolean).join(" / ")}
                                    </span>
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 登壇者 ─── */}
      {speakers.length > 0 && (
        <section
          id="speakers"
          className={`relative scroll-mt-20 overflow-hidden py-20 sm:py-28 ${
            event.template === "aurora" ? "" : "bg-zinc-950 text-white"
          }`}
        >
          {event.template !== "aurora" && <Grain opacity={0.25} />}
          <div className="relative mx-auto max-w-6xl px-6">
            <Ghost text="Speakers" light={event.template !== "aurora"} />
            <SectionHead label="Speakers" title="登壇者" light={event.template !== "aurora"} />
            <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
              {speakers.map((sp, i) => (
                <Reveal key={sp.id} delayMs={(i % 4) * 90}>
                  <Link href={`/e/${event.slug}/speakers/${sp.id}`} className="group block">
                    <div
                      className={`relative aspect-square overflow-hidden ${event.template === "aurora" ? "rounded-3xl" : ""}`}
                      style={{ backgroundColor: color }}
                    >
                      {sp.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sp.photoUrl}
                          alt={sp.name}
                          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
                            event.template === "aurora" ? "" : "grayscale mix-blend-luminosity"
                          }`}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-7xl font-black text-zinc-950/70">
                          {sp.name.charAt(0)}
                        </span>
                      )}
                      {event.template !== "aurora" && <Grain opacity={0.3} blend="soft-light" />}
                    </div>
                    <p
                      className="mt-4 border-l-2 pl-3 text-lg font-black leading-tight tracking-tight group-hover:underline"
                      style={{ borderColor: color }}
                    >
                      {sp.name}
                    </p>
                    <p
                      className={`mt-1 pl-3 text-[11px] font-bold uppercase leading-relaxed tracking-[0.15em] ${
                        event.template === "aurora" ? "text-zinc-500" : "text-zinc-400"
                      }`}
                    >
                      {[sp.company, sp.title].filter(Boolean).join(" / ")}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── チケット ─── */}
      <section
        id="tickets"
        className={`relative scroll-mt-20 overflow-hidden py-20 sm:py-28 ${
          event.template === "kodak" ? "border-t-2 border-zinc-950" : `border-t ${dark ? "border-white/15" : "border-zinc-200"}`
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              event.template === "noir"
                ? `radial-gradient(ellipse 90% 90% at 50% 0%, ${color}55, #09090b 70%)`
                : `linear-gradient(165deg, ${color} 0%, ${color} 55%, ${t.paper} 160%)`,
          }}
        />
        {event.template !== "aurora" && <Grain opacity={0.3} />}
        <div className="relative mx-auto max-w-4xl px-6">
          <SectionHead
            label="Tickets"
            title="チケット"
            light={event.template === "noir"}
          />
          {!hasTickets ? (
            <p className={`mt-6 font-bold ${event.template === "noir" ? "text-white/70" : "text-zinc-950/70"}`}>
              チケットは準備中です。公開までお待ちください。
            </p>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tickets.map((tk, i) => (
                <Reveal key={tk.id} delayMs={i * 100}>
                  <div
                    className={`flex h-full flex-col p-7 ${t.radius} ${
                      event.template === "noir"
                        ? "border border-white/20 bg-zinc-950/70 text-white"
                        : event.template === "aurora"
                          ? "bg-white/90 shadow-lg shadow-black/5 backdrop-blur"
                          : "border-2 border-zinc-950 bg-[#f6f5f2] text-zinc-950"
                    }`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${t.muted}`}>
                      1 ticket
                    </p>
                    <p className="mt-1 text-xl font-black tracking-tight">{tk.name}</p>
                    {tk.description && (
                      <p className={`mt-1 text-sm font-medium ${t.muted}`}>{tk.description}</p>
                    )}
                    <p className="mt-8 text-5xl font-black tabular-nums tracking-tighter">
                      {formatJpy(tk.priceJpy)}
                    </p>
                    <div className="mt-8 flex-1" />
                    {tk.soldOut ? (
                      <span className={`py-3 text-center text-sm font-black ${t.radius} ${
                        event.template === "noir" ? "border border-white/20 text-white/40" : "border-2 border-zinc-300 text-zinc-400"
                      }`}>
                        SOLD OUT
                      </span>
                    ) : (
                      <Link
                        href={`${registerHref}?ticket=${tk.id}`}
                        className={`py-3.5 text-center text-sm font-black text-white hover:opacity-85 ${t.radius}`}
                        style={{
                          backgroundColor: event.template === "kodak" ? "#09090b" : color,
                        }}
                      >
                        このチケットで申し込む →
                      </Link>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 締めのCTA ─── */}
      {hasTickets && (
        <section className={`relative overflow-hidden py-24 text-center ${
          event.template === "aurora" ? "bg-white" : "border-t-2 border-zinc-950 bg-zinc-950 text-white"
        }`}>
          {event.template !== "aurora" && <Grain opacity={0.25} />}
          <div className="relative mx-auto max-w-4xl px-6">
            <Reveal>
              <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${event.template === "aurora" ? "text-zinc-400" : "text-white/50"}`}>
                Join us
              </p>
              <p className="mt-4 text-4xl font-black tracking-tighter sm:text-6xl">
                会場でお会いしましょう。
              </p>
              <Link
                href={registerHref}
                className="mt-10 inline-block rounded-full px-10 py-4 text-base font-black transition-transform hover:scale-[1.02]"
                style={
                  event.template === "aurora"
                    ? { backgroundColor: color, color: "#fff" }
                    : { backgroundColor: "#f6f5f2", color: "#09090b" }
                }
              >
                参加登録はこちら →
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      <footer className={`py-8 text-center ${
        event.template === "aurora" ? "border-t border-zinc-200 bg-white" : "border-t-2 border-zinc-950 bg-zinc-950"
      }`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.35em] ${event.template === "aurora" ? "text-zinc-400" : "text-zinc-500"}`}>
          Powered by <span className={event.template === "aurora" ? "text-zinc-900" : "text-white"}>GAO HUB</span>
        </p>
      </footer>
    </main>
  );
}

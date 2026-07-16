import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPublicSessions,
  getPublicSpeakers,
  getPublicTicketTypes,
  getPublishedEventBySlug,
  type PublicEvent,
  type PublicSession,
  type PublicSpeaker,
} from "@/lib/server/events";
import { formatJpy } from "@/lib/format";
import { Grain } from "@/components/Grain";
import { CountdownBand } from "@/components/Countdown";
import { FixedBackdrop, Parallax, Reveal } from "@/components/motion";
import { LP_THEMES, type LpTheme } from "@/components/lp/theme";

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

/** 連続キャンバスの上に浮かぶコンテンツパネル */
function Panel({
  t,
  className = "",
  children,
}: {
  t: LpTheme;
  className?: string;
  children: React.ReactNode;
}) {
  const styles =
    t.id === "kodak"
      ? "border-2 border-zinc-950 bg-[#f6f5f2]/90 backdrop-blur-sm"
      : t.id === "spectrum"
        ? "bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-sm"
        : "rounded-3xl bg-white/75 shadow-xl shadow-black/5 backdrop-blur-xl";
  return <div className={`relative overflow-hidden ${styles} ${className}`}>{children}</div>;
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

function Ghost({ text, light }: { text: string; light: boolean }) {
  return (
    <Parallax speed={0.14} className="pointer-events-none absolute -top-14 right-0 select-none">
      <span
        aria-hidden
        className={`whitespace-nowrap text-[16vw] font-black uppercase leading-none tracking-tighter text-transparent sm:text-[9rem] ${
          light
            ? "[-webkit-text-stroke:1.5px_rgba(255,255,255,0.15)]"
            : "[-webkit-text-stroke:1.5px_rgba(24,24,27,0.15)]"
        }`}
      >
        {text}
      </span>
    </Parallax>
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

/** テンプレート別の全画面キャンバス(固定・低速パララックス) */
function BackdropCanvas({ event, t }: { event: PublicEvent; t: LpTheme }) {
  const color = event.themeColor;
  const year = yearFmt.format(event.startsAt).replace("年", "");
  return (
    <FixedBackdrop speed={0.16}>
      {event.coverImageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.coverImageUrl}
            alt=""
            className={`h-full w-full object-cover ${t.mode === "dark" ? "opacity-45" : ""}`}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                t.mode === "dark"
                  ? "linear-gradient(160deg, #09090bcc 0%, #09090b88 50%, #09090bcc 100%)"
                  : `linear-gradient(160deg, ${t.paper}f2 0%, ${t.paper}b8 45%, ${t.paper}66 100%)`,
            }}
          />
        </>
      ) : t.id === "kodak" ? (
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(155deg, ${t.paper} 0%, ${t.paper} 22%, ${color} 70%, #1a1a1a 130%)`,
          }}
        />
      ) : t.id === "spectrum" ? (
        // グレーのコンクリート地に赤→橙→黄→緑のスペクトラムを重ねる
        <div
          className="h-full w-full"
          style={{
            background: `
              radial-gradient(ellipse 55% 38% at 88% 6%, #ff3d00b8, transparent 62%),
              radial-gradient(ellipse 52% 36% at 58% 34%, #ff9100a6, transparent 62%),
              radial-gradient(ellipse 55% 38% at 26% 62%, #ffd60096, transparent 62%),
              radial-gradient(ellipse 62% 42% at -4% 96%, #00c85388, transparent 66%),
              ${t.paper}`,
          }}
        />
      ) : (
        <div className="h-full w-full" style={{ backgroundColor: t.paper }}>
          <div
            className="absolute left-[-10%] top-[-6%] h-[42rem] w-[42rem] rounded-full opacity-50"
            style={{ backgroundColor: color, filter: "blur(120px)" }}
          />
          <div
            className="absolute right-[-8%] top-[22%] h-[34rem] w-[34rem] rounded-full opacity-35"
            style={{ background: `color-mix(in oklch, ${color} 55%, #22d3ee)`, filter: "blur(120px)" }}
          />
          <div
            className="absolute bottom-[4%] left-[24%] h-[36rem] w-[36rem] rounded-full opacity-30"
            style={{ background: `color-mix(in oklch, ${color} 45%, #34d399)`, filter: "blur(130px)" }}
          />
        </div>
      )}
      {t.id !== "aurora" && <Grain opacity={t.id === "spectrum" ? 0.38 : 0.32} />}
      {/* 巨大アウトライン年号もキャンバス側でゆっくり流す(spectrumは白ストローク=白を色として使う) */}
      <span
        aria-hidden
        className={`absolute right-[2%] top-[52vh] select-none text-[26vw] font-black leading-none tracking-tighter text-transparent sm:text-[20rem] ${
          t.ghostLight
            ? "[-webkit-text-stroke:2px_rgba(255,255,255,0.35)]"
            : "[-webkit-text-stroke:2px_rgba(24,24,27,0.15)]"
        }`}
      >
        {year}
      </span>
    </FixedBackdrop>
  );
}

/** イベント名のマーキー帯(セクションの繋ぎ目を消す) */
function Marquee({ event, t }: { event: PublicEvent; t: LpTheme }) {
  const item = `${event.title} — ${yearFmt.format(event.startsAt)} `;
  const row = item.repeat(6);
  return (
    <div aria-hidden className="overflow-hidden py-10 sm:py-14">
      <div className="lp-marquee">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`pr-8 text-5xl font-black uppercase leading-none tracking-tighter sm:text-7xl ${
              t.mode === "dark"
                ? "text-white/12"
                : t.id === "spectrum"
                  ? "text-white/30"
                  : "text-zinc-950/10"
            }`}
          >
            {row}
          </span>
        ))}
      </div>
    </div>
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

  const stats: [string, string][] = [
    ["Days", String(Math.max(days.length, 1))],
    ["Sessions", String(sessions.length)],
    ["Speakers", String(speakers.length)],
    ["Tracks", String(Math.max(tracks.length, 1))],
  ];

  return (
    <main className={`relative flex-1 ${t.page}`} style={{ backgroundColor: t.paper }}>
      {/* 開場カーテン(テーマカラー → 上に抜ける) */}
      <div
        aria-hidden
        className="lp-curtain fixed inset-0 z-[90]"
        style={{ backgroundColor: color }}
      />

      {/* ─── 全画面キャンバス(固定・低速スクロール) ─── */}
      <BackdropCanvas event={event} t={t} />

      {/* ─── 前景コンテンツ ─── */}
      <div className="relative z-10">
        {/* 固定ナビ */}
        <header className={`sticky top-0 z-50 backdrop-blur ${t.nav}`}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <span className="truncate pr-4 text-sm font-black uppercase tracking-tight">
              {event.title}
            </span>
            <nav className="flex items-center gap-5 text-sm">
              <div className={`hidden items-center gap-5 font-bold sm:flex ${t.navLink}`}>
                {event.description && <a href="#about">概要</a>}
                {sessions.length > 0 && <a href="#sessions">タイムテーブル</a>}
                {speakers.length > 0 && <a href="#speakers">登壇者</a>}
              </div>
              {hasTickets && (
                <Link
                  href={registerHref}
                  className={`rounded-full px-5 py-1.5 text-sm font-black hover:opacity-85 ${
                    t.id === "spectrum" ? "bg-white text-zinc-950 shadow-lg" : "text-white"
                  }`}
                  style={
                    t.id === "spectrum"
                      ? undefined
                      : { backgroundColor: dark || t.id === "aurora" ? color : "#09090b" }
                  }
                >
                  参加登録
                </Link>
              )}
            </nav>
          </div>
        </header>

        {/* ─── ファーストビュー(100svh) ─── */}
        <section className="relative flex min-h-[100svh] flex-col justify-center">
          <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-10">
            <div className="lp-fade-up flex flex-wrap gap-x-12 gap-y-4" style={{ animationDelay: "1.15s" }}>
              <Spec label="Date" value={dateValue} />
              <Spec label="Venue" value={event.venueName || "Online"} />
              <Spec
                label="Doors"
                value={`${timeFmt.format(event.startsAt)} – ${timeFmt.format(event.endsAt)}`}
              />
            </div>

            {event.tagline && (
              <p
                className="lp-fade-up mt-12 text-xl font-black tracking-tight sm:text-3xl"
                style={{
                  animationDelay: "0.95s",
                  // spectrum は「白を色として使う」: グレー地に白のキャッチコピー
                  color: dark || t.id === "spectrum" ? "#fff" : "#18181b",
                }}
              >
                {event.tagline}
              </p>
            )}

            {/* タイトルは「バーン」と出す */}
            <h1
              className={`lp-burst ${event.tagline ? "mt-4" : "mt-12"} max-w-6xl break-words text-6xl font-black leading-[0.95] tracking-tighter sm:text-8xl lg:text-[9.5rem]`}
              style={{ animationDelay: "0.45s" }}
            >
              {event.title}
            </h1>

            {hasTickets && (
              <div
                className="lp-fade-up mt-12 flex flex-wrap items-center gap-4"
                style={{ animationDelay: "1.3s" }}
              >
                <Link
                  href={registerHref}
                  className={`rounded-full px-9 py-4 text-base font-black transition-transform hover:scale-[1.02] ${
                    t.id === "spectrum" ? "bg-white text-zinc-950 shadow-2xl shadow-black/20" : "text-white"
                  }`}
                  style={
                    t.id === "spectrum"
                      ? undefined
                      : {
                          backgroundColor: dark || t.id === "aurora" ? color : "#09090b",
                          boxShadow: dark ? `0 8px 40px ${color}66` : undefined,
                        }
                  }
                >
                  参加登録はこちら →
                </Link>
                {sessions.length > 0 && (
                  <a
                    href="#sessions"
                    className={`rounded-full px-7 py-3.5 text-sm font-black ${
                      dark
                        ? "border border-white/30 text-white hover:bg-white/10"
                        : t.id === "spectrum"
                          ? "border-2 border-white/70 text-white hover:bg-white hover:text-zinc-950"
                          : "border-2 border-zinc-950 hover:bg-zinc-950 hover:text-white"
                    }`}
                  >
                    タイムテーブル
                  </a>
                )}
              </div>
            )}
          </div>

          {/* スクロールキュー */}
          <div
            className="lp-fade-up absolute bottom-8 left-6 flex flex-col items-center gap-3 sm:left-10"
            style={{ animationDelay: "1.6s" }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.35em] opacity-60 [writing-mode:vertical-rl]">
              Scroll
            </span>
            <span
              className={`lp-scroll-line block h-14 w-px ${
                dark || t.id === "spectrum" ? "bg-white/70" : "bg-zinc-950/60"
              }`}
            />
          </div>
        </section>

        <Marquee event={event} t={t} />

        {/* ─── 統計 ─── */}
        {sessions.length > 0 && (
          <div className="mx-auto max-w-6xl px-6">
            <Panel t={t}>
              <div className="grid grid-cols-2 sm:grid-cols-4">
                {stats.map(([label, value], i) => (
                  <Reveal key={label} delayMs={i * 90}>
                    <div
                      className={`flex flex-col items-center py-8 ${
                        t.id === "kodak" ? "border-zinc-950" : dark ? "border-white/15" : "border-zinc-200"
                      } ${i > 0 ? (t.id === "kodak" ? "sm:border-l-2" : "sm:border-l") : ""}`}
                    >
                      <span className="text-5xl font-black tabular-nums tracking-tighter">
                        {value}
                      </span>
                      <span className={`mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.3em] ${t.muted}`}>
                        [{label}]
                      </span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* ─── カウントダウン ─── */}
        <div className="mx-auto mt-16 max-w-6xl px-6 sm:mt-24">
          <CountdownBand
            targetIso={event.startsAt.toISOString()}
            className={`relative overflow-hidden py-14 text-white ${
              t.id === "aurora"
                ? "rounded-3xl bg-zinc-950/90 backdrop-blur"
                : t.id === "spectrum"
                  ? "bg-zinc-950/90 shadow-2xl shadow-black/20 backdrop-blur"
                  : "border-2 border-zinc-950 bg-zinc-950/90 backdrop-blur"
            }`}
          />
        </div>

        {/* ─── 概要 ─── */}
        {event.description && (
          <section id="about" className="relative mx-auto max-w-4xl scroll-mt-24 px-6 pt-24 sm:pt-32">
            <Ghost text="About" light={t.ghostLight} />
            <Panel t={t} className="p-8 sm:p-12">
              <SectionHead label="About" title="開催概要" light={dark} />
              <Reveal delayMs={120}>
                <div className={`mt-8 whitespace-pre-wrap text-lg font-medium leading-relaxed ${dark ? "text-zinc-300" : "text-zinc-800"}`}>
                  {event.description}
                </div>
              </Reveal>
            </Panel>
          </section>
        )}

        {/* ─── タイムテーブル ─── */}
        {sessions.length > 0 && (
          <section id="sessions" className="relative mx-auto max-w-4xl scroll-mt-24 px-6 pt-24 sm:pt-32">
            <Ghost text="Schedule" light={t.ghostLight} />
            <Panel t={t} className="p-8 sm:p-12">
              <SectionHead label="Timetable" title="タイムテーブル" light={dark} />
              {days.map(([day, daySessions], di) => (
                <div key={day} className="mt-12">
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
                      t.id === "kodak"
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
            </Panel>
          </section>
        )}

        {/* ─── 登壇者 ─── */}
        {speakers.length > 0 && (
          <section id="speakers" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 pt-24 sm:pt-32">
            <Ghost text="Speakers" light={t.ghostLight} />
            <Panel
              t={t}
              className={`p-8 sm:p-12 ${t.id === "aurora" ? "" : "!bg-zinc-950/85 text-white"}`}
            >
              {t.id !== "aurora" && <Grain opacity={0.2} />}
              <div className="relative">
                <SectionHead label="Speakers" title="登壇者" light={t.id !== "aurora"} />
                <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
                  {speakers.map((sp, i) => (
                    <Reveal key={sp.id} delayMs={(i % 4) * 90}>
                      <Link href={`/e/${event.slug}/speakers/${sp.id}`} className="group block">
                        <div
                          className={`relative aspect-square overflow-hidden ${t.id === "aurora" ? "rounded-3xl" : ""}`}
                          style={{ backgroundColor: color }}
                        >
                          {sp.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sp.photoUrl}
                              alt={sp.name}
                              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
                                t.id === "aurora" ? "" : "grayscale mix-blend-luminosity"
                              }`}
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-7xl font-black text-zinc-950/70">
                              {sp.name.charAt(0)}
                            </span>
                          )}
                          {t.id !== "aurora" && <Grain opacity={0.3} blend="soft-light" />}
                        </div>
                        <p
                          className="mt-4 border-l-2 pl-3 text-lg font-black leading-tight tracking-tight group-hover:underline"
                          style={{ borderColor: color }}
                        >
                          {sp.name}
                        </p>
                        <p
                          className={`mt-1 pl-3 text-[11px] font-bold uppercase leading-relaxed tracking-[0.15em] ${
                            t.id === "aurora" ? "text-zinc-500" : "text-zinc-400"
                          }`}
                        >
                          {[sp.company, sp.title].filter(Boolean).join(" / ")}
                        </p>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Panel>
          </section>
        )}

        {/* ─── チケット ─── */}
        <section id="tickets" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 pt-24 sm:pt-32">
          <Ghost text="Tickets" light={t.ghostLight} />
          <Panel t={t} className="p-8 sm:p-12">
            <div
              className="absolute inset-0"
              style={{
                background:
                  t.id === "spectrum"
                    ? "linear-gradient(160deg, #ff3d0018 0%, #ff910014 35%, #ffd60010 65%, transparent 90%)"
                    : `linear-gradient(165deg, ${color}22 0%, transparent 60%)`,
              }}
            />
            <div className="relative">
              <SectionHead label="Tickets" title="チケット" light={dark} />
              {!hasTickets ? (
                <p className={`mt-6 font-bold ${t.muted}`}>
                  チケットは準備中です。公開までお待ちください。
                </p>
              ) : (
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tickets.map((tk, i) => (
                    <Reveal key={tk.id} delayMs={i * 100}>
                      <div
                        className={`flex h-full flex-col p-7 ${t.radius} ${
                          t.id === "spectrum"
                            ? "bg-[#ecece8] shadow-lg shadow-black/10"
                            : t.id === "aurora"
                              ? "bg-white shadow-lg shadow-black/5"
                              : "border-2 border-zinc-950 bg-[#f6f5f2]"
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
                          <span
                            className={`py-3 text-center text-sm font-black ${t.radius} border-2 border-zinc-300 text-zinc-400`}
                          >
                            SOLD OUT
                          </span>
                        ) : (
                          <Link
                            href={`${registerHref}?ticket=${tk.id}`}
                            className={`py-3.5 text-center text-sm font-black text-white hover:opacity-85 ${t.radius}`}
                            style={{ backgroundColor: t.id === "aurora" ? color : "#09090b" }}
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
          </Panel>
        </section>

        <Marquee event={event} t={t} />

        {/* ─── 締めのCTA ─── */}
        {hasTickets && (
          <section className="relative mx-auto max-w-4xl px-6 pb-32 text-center">
            <Reveal>
              <p
                className={`text-[11px] font-black uppercase tracking-[0.4em] ${
                  dark || t.id === "spectrum" ? "text-white/60" : "text-zinc-950/50"
                }`}
              >
                Join us
              </p>
              <p
                className={`mt-4 text-4xl font-black tracking-tighter sm:text-6xl ${
                  t.id === "spectrum" ? "text-white" : ""
                }`}
              >
                会場でお会いしましょう。
              </p>
              <Link
                href={registerHref}
                className={`mt-10 inline-block rounded-full px-10 py-4 text-base font-black transition-transform hover:scale-[1.02] ${
                  t.id === "spectrum" ? "bg-white text-zinc-950 shadow-2xl shadow-black/20" : "text-white"
                }`}
                style={
                  t.id === "spectrum"
                    ? undefined
                    : {
                        backgroundColor: dark || t.id === "aurora" ? color : "#09090b",
                        boxShadow: dark ? `0 8px 40px ${color}66` : undefined,
                      }
                }
              >
                参加登録はこちら →
              </Link>
            </Reveal>
          </section>
        )}

        <footer className={`py-8 text-center backdrop-blur ${dark ? "bg-zinc-950/70" : "bg-zinc-950/90"}`}>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-zinc-500">
            Powered by <span className="text-white">GAO HUB</span>
          </p>
        </footer>
      </div>
    </main>
  );
}

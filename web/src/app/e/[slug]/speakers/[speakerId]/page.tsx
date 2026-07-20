import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPublicSessions,
  getPublicSpeakers,
  getPublishedEventBySlug,
} from "@/lib/server/events";
import { Grain } from "@/components/Grain";
import { spectrumAccent, spectrumStops } from "@/lib/color";
import { LP_THEMES } from "@/components/lp/theme";
import { AnimatedTitle } from "@/components/lp/AnimatedTitle";

export const dynamic = "force-dynamic";

const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

export async function generateMetadata(props: {
  params: Promise<{ slug: string; speakerId: string }>;
}): Promise<Metadata> {
  const { slug, speakerId } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) return {};
  const speaker = (await getPublicSpeakers(event.id)).find((s) => s.id === speakerId);
  if (!speaker) return {};
  return {
    title: `${speaker.name} — ${event.title}`,
    description: speaker.bio.slice(0, 120),
  };
}

export default async function SpeakerDetailPage(props: {
  params: Promise<{ slug: string; speakerId: string }>;
}) {
  const { slug, speakerId } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const [speakers, sessions] = await Promise.all([
    getPublicSpeakers(event.id),
    getPublicSessions(event.id),
  ]);
  const speaker = speakers.find((s) => s.id === speakerId);
  if (!speaker) notFound();

  const speakerSessions = sessions.filter((s) => s.speakerIds.includes(speakerId));
  const t = LP_THEMES[event.template];
  // spectrum はアクセントも背景と同じ生成パレットの第一色に揃える
  const color = t.id === "spectrum" ? spectrumAccent(event.themeColor) : event.themeColor;
  const dark = t.mode === "dark";

  return (
    <main className={`flex-1 ${t.page}`}>
      <header className={`sticky top-0 z-50 backdrop-blur ${t.nav}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href={`/e/${event.slug}`}
            className="truncate pr-4 text-sm font-black uppercase tracking-tight hover:underline"
          >
            ← {event.title}
          </Link>
          <Link
            href={`/e/${event.slug}/register`}
            className="rounded-full px-5 py-1.5 text-sm font-black text-white hover:opacity-85"
            style={{ backgroundColor: dark || event.template === "aurora" ? color : "#09090b" }}
          >
            参加登録
          </Link>
        </div>
      </header>

      {/* ─── プロフィールヒーロー ─── */}
      <section
        className={`relative overflow-hidden ${
          event.template === "kodak" ? "border-b-2 border-zinc-950" : `border-b ${dark ? "border-white/15" : "border-zinc-200"}`
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background: dark
              ? `radial-gradient(ellipse 70% 80% at 80% 0%, ${color}66, #09090b 70%)`
              : t.id === "spectrum"
                ? // 公開LPの背景キャンバスと同じテーマカラー由来のスペクトラムを使う
                  (() => {
                    const [c1, c2, c3] = spectrumStops(event.themeColor);
                    return `radial-gradient(ellipse 60% 70% at 85% 0%, hsl(${c1} / 0.66), transparent 60%), radial-gradient(ellipse 55% 60% at 45% 60%, hsl(${c2} / 0.53), transparent 62%), radial-gradient(ellipse 60% 55% at 0% 110%, hsl(${c3} / 0.44), transparent 65%), ${t.paper}`;
                  })()
                : `linear-gradient(150deg, ${t.paper} 0%, ${t.paper} 45%, ${color} 130%)`,
          }}
        />
        {event.template !== "aurora" && <Grain opacity={0.3} />}

        <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <p className="lp-fade-up text-[11px] font-black uppercase tracking-[0.35em] opacity-50">
            Speaker
          </p>
          <div className="mt-8 flex flex-col gap-10 sm:flex-row sm:items-end">
            <div
              className={`relative aspect-square w-56 shrink-0 overflow-hidden lp-fade-up ${
                event.template === "aurora" ? "rounded-3xl" : ""
              }`}
              style={{ backgroundColor: color, animationDelay: "150ms" }}
            >
              {speaker.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={speaker.photoUrl}
                  alt={speaker.name}
                  className={`h-full w-full object-cover ${
                    event.template === "aurora" ? "" : "grayscale mix-blend-luminosity"
                  }`}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-8xl font-black text-zinc-950/70">
                  {speaker.name.charAt(0)}
                </span>
              )}
              {event.template !== "aurora" && <Grain opacity={0.3} blend="soft-light" />}
            </div>
            <div className="pb-2">
              <h1 className="text-5xl font-black tracking-tighter sm:text-7xl">
                <AnimatedTitle text={speaker.name} baseDelayMs={250} />
              </h1>
              <p className={`lp-fade-up mt-4 text-sm font-bold uppercase tracking-[0.2em] ${t.muted}`} style={{ animationDelay: "500ms" }}>
                {[speaker.company, speaker.title].filter(Boolean).join(" / ")}
              </p>
              {(() => {
                const links: [string, string][] = [
                  ["X (Twitter)", speaker.xUrl],
                  ["Instagram", speaker.instagramUrl],
                  ["LinkedIn", speaker.linkedinUrl],
                  ["Facebook", speaker.facebookUrl],
                  ["Website", speaker.websiteUrl],
                ];
                const active = links.filter(([, url]) => url);
                if (active.length === 0) return null;
                return (
                  <div className="lp-fade-up mt-5 flex flex-wrap gap-3" style={{ animationDelay: "650ms" }}>
                    {active.map(([label, url]) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded-full px-4 py-1.5 text-xs font-black ${
                          dark ? "border border-white/30 hover:bg-white/10" : "border-2 border-zinc-950 hover:bg-zinc-950 hover:text-white"
                        }`}
                      >
                        {label} ↗
                      </a>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ─── プロフィール ─── */}
      {speaker.bio && (
        <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] opacity-50">Profile</p>
          <div className={`mt-6 whitespace-pre-wrap text-lg font-medium leading-relaxed ${dark ? "text-zinc-300" : "text-zinc-800"}`}>
            {speaker.bio}
          </div>
        </section>
      )}

      {/* ─── 登壇セッション ─── */}
      {speakerSessions.length > 0 && (
        <section
          className={`py-16 sm:py-20 ${t.timetableBg} ${
            event.template === "kodak" ? "border-t-2 border-zinc-950" : `border-t ${dark ? "border-white/15" : "border-zinc-200"}`
          }`}
        >
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] opacity-50">Sessions</p>
            <h2 className="mt-2 text-3xl font-black tracking-tighter">登壇セッション</h2>
            <ol
              className={`mt-8 ${
                event.template === "kodak"
                  ? "divide-y-2 divide-zinc-950 border-y-2 border-zinc-950"
                  : `divide-y border-y ${t.divide}`
              }`}
            >
              {speakerSessions.map((s) => (
                <li key={s.id} className="py-6">
                  <p className="font-mono text-sm font-black tabular-nums">
                    {timeFmt.format(s.startsAt)}
                    {s.track && (
                      <span
                        className="ml-3 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                        style={{ backgroundColor: color }}
                      >
                        {s.track}
                      </span>
                    )}
                  </p>
                  <Link
                    href={`/e/${event.slug}/sessions/${s.id}`}
                    className="hover:underline"
                  >
                    <h3 className="mt-2 text-xl font-black tracking-tight">{s.title}</h3>
                  </Link>
                  {s.description && (
                    <p className={`mt-2 text-sm leading-relaxed ${t.muted}`}>{s.description}</p>
                  )}
                </li>
              ))}
            </ol>
            <Link
              href={`/e/${event.slug}#speakers`}
              className="mt-10 inline-block text-sm font-black underline"
            >
              ← 登壇者一覧へ戻る
            </Link>
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

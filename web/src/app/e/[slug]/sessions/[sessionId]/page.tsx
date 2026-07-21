import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPublicSpeakers,
  getPublishedEventBySlug,
  getSessionById,
  pickSpeakers,
} from "@/lib/server/events";
import { appUrl } from "@/lib/format";
import { Grain } from "@/components/Grain";
import { spectrumAccent, spectrumStops } from "@/lib/color";
import { LP_THEMES } from "@/components/lp/theme";
import { AnimatedTitle } from "@/components/lp/AnimatedTitle";
import { ShareButtons } from "@/components/ShareButtons";

export const dynamic = "force-dynamic";

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

export async function generateMetadata(props: {
  params: Promise<{ slug: string; sessionId: string }>;
}): Promise<Metadata> {
  const { slug, sessionId } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) return {};
  const session = await getSessionById(event.id, sessionId);
  if (!session) return {};
  const title = `${session.title} — ${event.title}`;
  const description = session.description.slice(0, 120) || `${event.title} のセッション詳細`;
  // シェアカードにはセッションバナーを使う(カスタムバナー設定時はそちらが返る)
  const image = appUrl(`/api/banner/${event.id}/sessions/${session.id}?size=wide`);
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SessionDetailPage(props: {
  params: Promise<{ slug: string; sessionId: string }>;
}) {
  const { slug, sessionId } = await props.params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const session = await getSessionById(event.id, sessionId);
  if (!session) notFound();

  const speakers = pickSpeakers(await getPublicSpeakers(event.id), session.speakerIds);
  const t = LP_THEMES[event.template];
  // spectrum はアクセントも背景と同じ生成パレットの第一色に揃える
  const color = t.id === "spectrum" ? spectrumAccent(event.themeColor) : event.themeColor;
  const dark = t.mode === "dark";
  const shareUrl = appUrl(`/e/${event.slug}/sessions/${session.id}`);
  const shareText = `${session.title} | ${event.title}`;
  const remaining = session.capacity != null ? session.capacity - session.reservedCount : null;

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

      {/* ─── セッションヒーロー ─── */}
      <section
        className={`relative overflow-hidden ${
          event.template === "kodak"
            ? "border-b-2 border-zinc-950"
            : `border-b ${dark ? "border-white/15" : "border-zinc-200"}`
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background: dark
              ? `radial-gradient(ellipse 70% 80% at 80% 0%, ${color}66, #09090b 70%)`
              : t.id === "spectrum"
                ? (() => {
                    const [c1, c2, c3] = spectrumStops(event.themeColor);
                    return `radial-gradient(ellipse 60% 70% at 85% 0%, hsl(${c1} / 0.66), transparent 60%), radial-gradient(ellipse 55% 60% at 45% 60%, hsl(${c2} / 0.53), transparent 62%), radial-gradient(ellipse 60% 55% at 0% 110%, hsl(${c3} / 0.44), transparent 65%), ${t.paper}`;
                  })()
                : `linear-gradient(150deg, ${t.paper} 0%, ${t.paper} 45%, ${color} 130%)`,
          }}
        />
        {event.template !== "aurora" && <Grain opacity={0.3} />}

        <div className="relative mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="lp-fade-up text-[11px] font-black uppercase tracking-[0.35em] opacity-50">
                Session
              </p>
              <div className="lp-fade-up mt-6 flex flex-wrap items-center gap-3" style={{ animationDelay: "120ms" }}>
                {session.isComingSoon ? (
                  <span className="rounded-full bg-zinc-950 px-4 py-1.5 font-mono text-xs font-black uppercase tracking-[0.2em] text-white">
                    Coming Soon
                  </span>
                ) : (
                  <span className="font-mono text-lg font-black tabular-nums">
                    {dayFmt.format(session.startsAt)} {timeFmt.format(session.startsAt)} –{" "}
                    {timeFmt.format(session.endsAt)}
                  </span>
                )}
                {session.track && !session.isComingSoon && (
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                    style={{ backgroundColor: color }}
                  >
                    {session.track}
                  </span>
                )}
                {remaining != null && !session.isComingSoon && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${
                      remaining <= 0
                        ? "bg-red-600/90 text-white"
                        : `${t.muted} ${dark ? "bg-white/10" : "bg-zinc-950/10"}`
                    }`}
                  >
                    {remaining <= 0 ? "満席" : `残り${remaining}席`}
                  </span>
                )}
              </div>
              <h1 className="mt-6 text-3xl font-black leading-tight tracking-tighter sm:text-5xl">
                <AnimatedTitle text={session.title} baseDelayMs={250} />
              </h1>
            </div>

            {/* 告知バナー（アイキャッチ） */}
            <div className="lg:col-span-5">
              <div className="group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-900 shadow-2xl transition-all duration-300 dark:border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={session.customBannerUrl || `/api/banner/${event.id}/sessions/${session.id}?size=wide`}
                  alt={session.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <a
                  href={`/api/banner/${event.id}/sessions/${session.id}?size=wide&download=1`}
                  download
                  className="absolute bottom-3 right-3 rounded-full bg-black/70 px-4 py-1.5 text-xs font-black text-white backdrop-blur-md transition-all hover:bg-black hover:scale-105"
                >
                  バナーを保存 📥
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 概要 ─── */}
      {session.description && (
        <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] opacity-50">About</p>
          <div
            className={`mt-6 whitespace-pre-wrap text-lg font-medium leading-relaxed ${
              dark ? "text-zinc-300" : "text-zinc-800"
            }`}
          >
            {session.description}
          </div>
        </section>
      )}

      {/* ─── 登壇者 ─── */}
      {speakers.length > 0 && (
        <section
          className={`py-16 sm:py-20 ${t.timetableBg} ${
            event.template === "kodak"
              ? "border-t-2 border-zinc-950"
              : `border-t ${dark ? "border-white/15" : "border-zinc-200"}`
          }`}
        >
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] opacity-50">Speakers</p>
            <h2 className="mt-2 text-3xl font-black tracking-tighter">登壇者</h2>
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {speakers.map((sp) => (
                <Link key={sp.id} href={`/e/${event.slug}/speakers/${sp.id}`} className="group block">
                  <div
                    className={`relative aspect-square overflow-hidden ${
                      event.template === "aurora" ? "rounded-3xl" : ""
                    }`}
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
                      <span className="flex h-full w-full items-center justify-center text-6xl font-black text-zinc-950/70">
                        {sp.name.charAt(0)}
                      </span>
                    )}
                    {event.template !== "aurora" && <Grain opacity={0.3} blend="soft-light" />}
                  </div>
                  <p
                    className="mt-3 border-l-2 pl-3 text-lg font-black leading-tight tracking-tight group-hover:underline"
                    style={{ borderColor: color }}
                  >
                    {sp.name}
                  </p>
                  <p className={`mt-1 pl-3 text-[11px] font-bold uppercase leading-relaxed tracking-[0.15em] ${t.muted}`}>
                    {[sp.company, sp.title].filter(Boolean).join(" / ")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── シェア ─── */}
      <section
        className={`py-16 sm:py-20 ${
          event.template === "kodak"
            ? "border-t-2 border-zinc-950"
            : `border-t ${dark ? "border-white/15" : "border-zinc-200"}`
        }`}
      >
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] opacity-50">Share</p>
          <h2 className="mt-2 text-3xl font-black tracking-tighter">このセッションをシェア</h2>
          <p className={`mt-3 text-sm font-medium ${t.muted}`}>
            シェアするとセッションバナーがカード画像として自動で表示されます。
            登壇者のみなさまも、ぜひご自身のアカウントでの告知にご利用ください。
          </p>
          <div className="mt-8">
            <ShareButtons url={shareUrl} text={shareText} dark={dark} />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center sm:pb-28">
        <Link
          href={`/e/${event.slug}/register`}
          className={`inline-block rounded-full px-10 py-4 text-base font-black text-white transition-transform hover:scale-[1.02] ${
            dark ? "" : ""
          }`}
          style={{ backgroundColor: dark || event.template === "aurora" ? color : "#09090b" }}
        >
          参加登録はこちら →
        </Link>
      </section>

      <footer
        className={`py-8 text-center ${
          event.template === "aurora"
            ? "border-t border-zinc-200 bg-white"
            : "border-t-2 border-zinc-950 bg-zinc-950"
        }`}
      >
        <p
          className={`text-[11px] font-black uppercase tracking-[0.35em] ${
            event.template === "aurora" ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          Powered by{" "}
          <span className={event.template === "aurora" ? "text-zinc-900" : "text-white"}>
            GAO HUB
          </span>
        </p>
      </footer>
    </main>
  );
}
